import fs from "fs/promises"
import path from "path"
import { afterEach, beforeEach, describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { Config } from "@xudu/core/config"
import { AppNodeBuilder } from "@xudu/core/effect/app-node-builder"
import { LayerNode } from "@xudu/util/effect/layer-node"
import { Environment } from "@xudu/core/environment/index"
import { FileAccess } from "@xudu/core/file-access"
import { FileMutation } from "@xudu/core/file-mutation"
import { Formatter } from "@xudu/core/formatter"
import { Global } from "@xudu/util/global"
import { Image } from "@xudu/core/image"
import { Location } from "@xudu/core/location"
import { Permission } from "@xudu/core/permission"
import { AbsolutePath } from "@xudu/core/schema"
import { Session } from "@xudu/core/session"
import { SessionInstructions } from "@xudu/core/session/instructions"
import { Tool } from "@xudu/core/tool"
import { ReadLedger } from "@xudu/core/tool/read-ledger"
import { ReadToolFileSystem } from "@xudu/core/tool/read-filesystem"
import { EditTool } from "@xudu/core/tool/plugin/edit"
import { PatchTool } from "@xudu/core/tool/plugin/patch"
import { ReadTool } from "@xudu/core/tool/plugin/read"
import { WriteTool } from "@xudu/core/tool/plugin/write"
import { FSUtil } from "@xudu/util/fs-util"
import { makeLocationNode } from "@xudu/util/effect/app-node"
import { location } from "./fixture/location"
import { withTempDir } from "./fixture/tmpdir"
import { testEffect } from "./lib/effect"
import { permissionLayer } from "./lib/permission"
import { toolIdentity, executeTool, registerToolPlugin } from "./lib/tool"

// The real read, edit, write and patch tools in one registry: the ledger key read records must be the one the
// mutating tools look up, so these tests go through the tools rather than calling ReadLedger.record by hand.
const toolsNode = makeLocationNode({
  name: "test/read-before-edit",
  layer: Layer.effectDiscard(
    Effect.all([
      registerToolPlugin(ReadTool.Plugin),
      registerToolPlugin(EditTool.Plugin),
      registerToolPlugin(WriteTool.Plugin),
      registerToolPlugin(PatchTool.Plugin),
    ]),
  ),
  deps: [
    Tool.node,
    ReadToolFileSystem.node,
    FileAccess.node,
    FileMutation.node,
    Environment.node,
    Formatter.node,
    Image.node,
    Permission.node,
    SessionInstructions.node,
    FSUtil.node,
    Location.node,
  ],
})

const allowAll = permissionLayer({ assert: () => Effect.void })
const noFormat = Layer.mock(Formatter.Service, { file: () => Effect.succeed(false) })

const withTools = <A, E, R>(directory: string, body: (registry: Tool.Interface) => Effect.Effect<A, E, R>) =>
  Effect.gen(function* () {
    return yield* body(yield* Tool.Service)
  }).pipe(
    Effect.provide(
      AppNodeBuilder.build(LayerNode.group([Tool.node, toolsNode]), [
        Location.node.replace(
          Layer.succeed(Location.Service, Location.Service.of(location({ directory: AbsolutePath.make(directory) }))),
        ),
        Permission.node.replace(allowAll),
        Formatter.node.replace(noFormat),
        Config.node.replace(Config.testLayer()),
        Global.node.replace(Global.layerWith({ data: Global.Path.data })),
      ]),
    ),
  )

const sessionA = Session.ID.make("ses_read_before_edit_a")
const sessionB = Session.ID.make("ses_read_before_edit_b")
let n = 0
const run = (registry: Tool.Interface, name: string, input: Record<string, unknown>, sessionID = sessionA) =>
  executeTool(registry, { sessionID, ...toolIdentity, call: { type: "tool-call", id: `call-${++n}`, name, input } })
const text = (result: unknown) => JSON.stringify(result)
const disk = (file: string) => Effect.promise(() => fs.readFile(file, "utf8"))

const it = testEffect(Layer.empty)
let previous: string | undefined
beforeEach(() => {
  previous = process.env.XUDU_SKIP_READ_CHECK
  delete process.env.XUDU_SKIP_READ_CHECK
  ReadLedger.reset()
})
afterEach(() => {
  if (previous === undefined) delete process.env.XUDU_SKIP_READ_CHECK
  else process.env.XUDU_SKIP_READ_CHECK = previous
})

describe("ReadLedger", () => {
  it.live("tracks unread, read and stale content per session", () =>
    Effect.sync(() => {
      expect(ReadLedger.check("s1", "/x", "a")).toBe("unread")
      ReadLedger.record("s1", "/x", "a")
      expect(ReadLedger.check("s1", "/x", "a")).toBe("ok")
      expect(ReadLedger.check("s1", "/x", "b")).toBe("stale")
      expect(ReadLedger.check("s2", "/x", "a")).toBe("unread")
    }),
  )

  it.live("the test-only escape hatch allows everything", () =>
    Effect.sync(() => {
      process.env.XUDU_SKIP_READ_CHECK = "1"
      expect(ReadLedger.check("s1", "/never-read", "a")).toBe("ok")
    }),
  )
})

describe("read before edit", () => {
  it.live("edit refuses a file the session has not read, and leaves it unchanged", () =>
    withTempDir((tmp) => {
      const file = path.join(tmp.path, "a.txt")
      return Effect.promise(() => fs.writeFile(file, "one\ntwo\n")).pipe(
        Effect.andThen(
          withTools(tmp.path, (registry) =>
            Effect.gen(function* () {
              const result = yield* run(registry, "edit", { path: "a.txt", oldString: "one", newString: "ONE" })
              expect(result.status).toBe("error")
              expect(text(result)).toContain("has not been read in this session")
              expect(yield* disk(file)).toBe("one\ntwo\n")
            }),
          ),
        ),
      )
    }),
  )

  it.live("read then edit works, and repeated edits need no new read", () =>
    withTempDir((tmp) => {
      const file = path.join(tmp.path, "a.txt")
      return Effect.promise(() => fs.writeFile(file, "one\ntwo\n")).pipe(
        Effect.andThen(
          withTools(tmp.path, (registry) =>
            Effect.gen(function* () {
              expect((yield* run(registry, "read", { path: "a.txt" })).status).toBe("completed")
              expect((yield* run(registry, "edit", { path: "a.txt", oldString: "one", newString: "ONE" })).status).toBe(
                "completed",
              )
              expect((yield* run(registry, "edit", { path: "a.txt", oldString: "two", newString: "TWO" })).status).toBe(
                "completed",
              )
              expect(yield* disk(file)).toBe("ONE\nTWO\n")
            }),
          ),
        ),
      )
    }),
  )

  it.live("edit refuses a file that changed on disk after it was read", () =>
    withTempDir((tmp) => {
      const file = path.join(tmp.path, "a.txt")
      return Effect.promise(() => fs.writeFile(file, "one\n")).pipe(
        Effect.andThen(
          withTools(tmp.path, (registry) =>
            Effect.gen(function* () {
              yield* run(registry, "read", { path: "a.txt" })
              yield* Effect.promise(() => fs.writeFile(file, "one\nchanged elsewhere\n"))
              const result = yield* run(registry, "edit", { path: "a.txt", oldString: "one", newString: "ONE" })
              expect(result.status).toBe("error")
              expect(text(result)).toContain("has changed since you last read it")
              expect(yield* disk(file)).toBe("one\nchanged elsewhere\n")
            }),
          ),
        ),
      )
    }),
  )

  it.live("a read in one session does not let another session edit", () =>
    withTempDir((tmp) => {
      const file = path.join(tmp.path, "a.txt")
      return Effect.promise(() => fs.writeFile(file, "one\n")).pipe(
        Effect.andThen(
          withTools(tmp.path, (registry) =>
            Effect.gen(function* () {
              yield* run(registry, "read", { path: "a.txt" }, sessionA)
              const result = yield* run(registry, "edit", { path: "a.txt", oldString: "one", newString: "X" }, sessionB)
              expect(result.status).toBe("error")
              expect(text(result)).toContain("has not been read in this session")
            }),
          ),
        ),
      )
    }),
  )

  it.live("write creates a new file without a read, but refuses to overwrite an unread one", () =>
    withTempDir((tmp) => {
      const existing = path.join(tmp.path, "old.txt")
      return Effect.promise(() => fs.writeFile(existing, "keep me\n")).pipe(
        Effect.andThen(
          withTools(tmp.path, (registry) =>
            Effect.gen(function* () {
              expect((yield* run(registry, "write", { path: "new.txt", content: "fresh\n" })).status).toBe("completed")
              expect(yield* disk(path.join(tmp.path, "new.txt"))).toBe("fresh\n")
              const result = yield* run(registry, "write", { path: "old.txt", content: "clobbered\n" })
              expect(result.status).toBe("error")
              expect(text(result)).toContain("has not been read in this session")
              expect(yield* disk(existing)).toBe("keep me\n")
              yield* run(registry, "read", { path: "old.txt" })
              expect((yield* run(registry, "write", { path: "old.txt", content: "replaced\n" })).status).toBe(
                "completed",
              )
              expect(yield* disk(existing)).toBe("replaced\n")
            }),
          ),
        ),
      )
    }),
  )

  it.live("a file the session wrote can be edited without reading it back", () =>
    withTempDir((tmp) =>
      withTools(tmp.path, (registry) =>
        Effect.gen(function* () {
          yield* run(registry, "write", { path: "made.txt", content: "alpha\n" })
          expect((yield* run(registry, "edit", { path: "made.txt", oldString: "alpha", newString: "beta" })).status).toBe(
            "completed",
          )
          expect(yield* disk(path.join(tmp.path, "made.txt"))).toBe("beta\n")
        }),
      ),
    ),
  )

  it.live("patch refuses to update an unread file and applies after a read", () =>
    withTempDir((tmp) => {
      const file = path.join(tmp.path, "p.txt")
      const patchText = ["*** Begin Patch", "*** Update File: p.txt", "@@", "-one", "+ONE", "*** End Patch"].join("\n")
      return Effect.promise(() => fs.writeFile(file, "one\n")).pipe(
        Effect.andThen(
          withTools(tmp.path, (registry) =>
            Effect.gen(function* () {
              const refused = yield* run(registry, "patch", { patchText })
              expect(refused.status).toBe("error")
              expect(text(refused)).toContain("has not been read in this session")
              expect(yield* disk(file)).toBe("one\n")
              yield* run(registry, "read", { path: "p.txt" })
              expect((yield* run(registry, "patch", { patchText })).status).toBe("completed")
              expect(yield* disk(file)).toBe("ONE\n")
            }),
          ),
        ),
      )
    }),
  )
})
