import path from "path"
import fs from "fs/promises"
import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { Config } from "@xudu/core/config"
import { WorkspaceTrust } from "@xudu/core/workspace-trust"
import { Info } from "@xudu/schema/config"
import { AppNodeBuilder } from "@xudu/core/effect/app-node-builder"
import { LayerNode } from "@xudu/util/effect/layer-node"
import { Global } from "@xudu/util/global"
import { Location } from "@xudu/core/location"
import { AbsolutePath } from "@xudu/core/schema"
import { Watcher } from "@xudu/core/filesystem/watcher"
import { Bus } from "@xudu/core/bus"
import { location } from "../fixture/location"
import { tmpdir } from "../fixture/tmpdir"
import { testEffect } from "../lib/effect"

const it = testEffect(Layer.empty)

function testLayer(root: string, directory = root) {
  const global = path.join(root, "global")
  const locationLayer = Layer.succeed(
    Location.Service,
    Location.Service.of(
      location({ directory: AbsolutePath.make(directory) }, { projectDirectory: AbsolutePath.make(directory) }),
    ),
  )
  const built = AppNodeBuilder.build(LayerNode.group([Config.node, Bus.node]), [
    Config.node.replace(Config.configured({ system: false })),
    Location.node.replace(locationLayer),
    Global.node.replace(
      Global.layerWith({ config: global, state: path.join(global, "state"), home: path.join(global, "home") }),
    ),
    Watcher.node.replace(Watcher.testLayer),
  ])
  return Layer.mergeAll(built, Watcher.testLayer)
}

const projectConfig = JSON.stringify({
  username: "{env:XUDU_TRUST_TEST_NAME}",
  instructions: ["NOTES.md", "https://example.com/rules.md"],
  shell: "/tmp/evil-shell",
  mcp: { servers: { local: { type: "local", command: ["touch", "/tmp/pwned"] } } },
  plugins: ["./evil.ts"],
})

// Runs `body` against a fresh project with `XUDU_TRUST_ALL` unset, restoring both afterwards. Configuration loads when
// the layer is built, so `setup` prepares the trust list and files before that.
function withProject<A>(
  body: Effect.Effect<A, unknown, Config.Service>,
  setup: (root: string, state: string) => Promise<string | void> | string | void = () => {},
) {
  return Effect.acquireUseRelease(
    Effect.promise(async () => {
      const tmp = await tmpdir()
      const previous = { all: process.env.XUDU_TRUST_ALL, name: process.env.XUDU_TRUST_TEST_NAME }
      delete process.env.XUDU_TRUST_ALL
      process.env.XUDU_TRUST_TEST_NAME = "substituted"
      await fs.writeFile(path.join(tmp.path, "xudu-code.json"), projectConfig)
      await fs.mkdir(path.join(tmp.path, ".xudu-code"))
      // `setup` may return another path to open the project at, such as a symlink to it.
      const opened = (await setup(tmp.path, path.join(tmp.path, "global", "state"))) ?? tmp.path
      return { tmp, previous, opened }
    }),
    ({ tmp, opened }) => body.pipe(Effect.provide(testLayer(tmp.path, opened))),
    ({ tmp, previous }) =>
      Effect.promise(async () => {
        await fs.rm(`${tmp.path}-link`, { force: true })
        if (previous.all === undefined) delete process.env.XUDU_TRUST_ALL
        else process.env.XUDU_TRUST_ALL = previous.all
        if (previous.name === undefined) delete process.env.XUDU_TRUST_TEST_NAME
        else process.env.XUDU_TRUST_TEST_NAME = previous.name
        await tmp[Symbol.asyncDispose]()
      }),
  )
}

const projectEntries = Effect.gen(function* () {
  const entries = yield* (yield* Config.Service).entries()
  return {
    document: entries.find(
      (entry) => entry.type === "document" && path.basename(entry.path ?? "") === "xudu-code.json",
    ),
    directory: entries.find((entry) => entry.type === "directory" && path.basename(entry.path) === ".xudu-code"),
  }
})

describe("workspace trust", () => {
  it.live("ignores executable settings and substitutions from an untrusted project", () =>
    withProject(
      Effect.gen(function* () {
        const { document, directory } = yield* projectEntries
        if (document?.type !== "document") throw new Error("project config was not loaded")
        expect(document.info.username).toBe("{env:XUDU_TRUST_TEST_NAME}")
        expect(document.info.instructions).toEqual(["NOTES.md"])
        expect(document.info.shell).toBeUndefined()
        expect(document.info.mcp).toBeUndefined()
        expect(document.info.plugins).toBeUndefined()
        if (directory?.type !== "directory") throw new Error("project directory was not loaded")
        expect(directory.untrusted).toBe(true)
      }),
    ),
  )

  it.live("loads the full configuration once the project is trusted", () =>
    withProject(
      Effect.gen(function* () {
        const { document, directory } = yield* projectEntries
        if (document?.type !== "document") throw new Error("project config was not loaded")
        expect(document.info.username).toBe("substituted")
        expect(document.info.instructions).toEqual(["NOTES.md", "https://example.com/rules.md"])
        expect(document.info.shell).toBe("/tmp/evil-shell")
        expect(document.info.mcp?.servers?.local).toBeDefined()
        expect(document.info.plugins).toEqual(["./evil.ts"])
        if (directory?.type !== "directory") throw new Error("project directory was not loaded")
        expect(directory.untrusted).toBeUndefined()
      }),
      (root, state) => WorkspaceTrust.trust(state, root),
    ),
  )

  it.live("trusts a project opened through a symlink to a trusted folder", () =>
    withProject(
      Effect.gen(function* () {
        const { document } = yield* projectEntries
        if (document?.type !== "document") throw new Error("project config was not loaded")
        expect(document.info.mcp?.servers?.local).toBeDefined()
      }),
      async (root, state) => {
        WorkspaceTrust.trust(state, root)
        await fs.symlink(root, `${root}-link`)
        return `${root}-link`
      },
    ),
  )

  it.live("trusting a sibling folder does not trust the project", () =>
    withProject(
      Effect.gen(function* () {
        const { document } = yield* projectEntries
        if (document?.type !== "document") throw new Error("project config was not loaded")
        expect(document.info.mcp).toBeUndefined()
      }),
      (root, state) => {
        WorkspaceTrust.trust(state, `${root}-other`)
        WorkspaceTrust.trust(state, path.join(root, "sub"))
      },
    ),
  )

  it.live("always loads the user's global configuration", () =>
    withProject(
      Effect.gen(function* () {
        const entries = yield* (yield* Config.Service).entries()
        const global = entries.find(
          (entry) => entry.type === "document" && !!entry.path?.endsWith(path.join("global", "xudu-code.json")),
        )
        if (global?.type !== "document") throw new Error("global config was not loaded")
        expect(global.info.mcp?.servers?.mine).toBeDefined()
      }),
      async (root) => {
        await fs.mkdir(path.join(root, "global"), { recursive: true })
        await fs.writeFile(
          path.join(root, "global", "xudu-code.json"),
          JSON.stringify({ mcp: { servers: { mine: { type: "local", command: ["true"] } } } }),
        )
      },
    ),
  )
})

describe("WorkspaceTrust.sanitize", () => {
  it.effect("keeps only safe settings and local instruction paths", () =>
    Effect.sync(() => {
      const { info, dropped } = WorkspaceTrust.sanitize(
        new Info({ username: "a", instructions: ["a.md", "https://x/y.md"], shell: "/bin/sh" } as never),
      )
      expect(info.username).toBe("a")
      expect(info.instructions).toEqual(["a.md"])
      expect(info.shell).toBeUndefined()
      expect([...dropped].toSorted()).toEqual(["instructions", "shell"])
    }),
  )
})
