import { NodeServices } from "@effect/platform-node"
import { EffectFlock } from "@xudu/util/effect-flock"
import { LayerNode } from "@xudu/util/effect/layer-node"
import { Global } from "@xudu/util/global"
import { AppProcess } from "@xudu/util/process"
import { expect, spyOn } from "bun:test"
import { Effect, FileSystem, Layer, PlatformError, Stream } from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/process"
import { existsSync } from "node:fs"
import path from "node:path"
import { Updater } from "../src/services/updater"
import { testEffect } from "../../core/test/lib/effect"

const it = testEffect(NodeServices.layer)

function fixture(
  respond: (command: ChildProcess.StandardCommand) => Partial<AppProcess.RunResult> & {
    error?: AppProcess.AppProcessError
  } = () => ({}),
  options: {
    readonly installed?: boolean
    readonly release?: unknown
    readonly executable?: (
      root: string,
      home: string,
    ) => Effect.Effect<string, PlatformError.PlatformError, FileSystem.FileSystem>
  } = {},
) {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
    const root = yield* fs.makeTempDirectoryScoped({ prefix: "xudu-updater-" })
    const home = path.join(root, "home")
    const execPath = process.execPath
    const executable = options.executable
      ? yield* options.executable(root, home)
      : options.installed === false
        ? path.join(root, "checkout", "bun")
        : path.join(home, ".xudu-code", "bin", process.platform === "win32" ? "xudu-code.exe" : "xudu-code")
    yield* fs.makeDirectory(path.dirname(executable), { recursive: true })
    yield* fs.writeFileString(executable, "binary")
    const requests: string[] = []
    // The updater uses global fetch; scope this replacement to each test.
    yield* Effect.acquireRelease(
      Effect.sync(() =>
        spyOn(globalThis, "fetch").mockImplementation(
          Object.assign(
            async (input: string | URL | Request) => {
              requests.push(input instanceof Request ? input.url : input.toString())
              return Response.json(options.release ?? { version: "2.3.4", metadata: { package: "xudu-code" } })
            },
            { preconnect: fetch.preconnect },
          ),
        ),
      ),
      (request) => Effect.sync(() => request.mockRestore()),
    )
    const global = Global.make({
      home,
      data: path.join(root, "data"),
      cache: path.join(root, "cache"),
      config: path.join(root, "config"),
      state: path.join(root, "state"),
      tmp: path.join(root, "tmp"),
      bin: path.join(root, "bin"),
      log: path.join(root, "log"),
      repos: path.join(root, "repos"),
    })
    const commands: string[][] = []
    const updater = yield* Updater.Service.pipe(
      Effect.provide(Updater.layer),
      Effect.provide(
        LayerNode.compile(EffectFlock.node, {
          replacements: [Global.node.replace(Layer.succeed(Global.Service, global))],
        }),
      ),
      Effect.provideService(Global.Service, global),
      Effect.provideService(FileSystem.FileSystem, {
        ...fs,
        realPath: (input) => (input === execPath ? fs.realPath(executable) : fs.realPath(input)),
      }),
      Effect.provideService(
        AppProcess.Service,
        AppProcess.Service.of({
          ...spawner,
          run: (command) =>
            Effect.suspend(() => {
              if (command._tag !== "StandardCommand") return Effect.die("Unexpected piped install command")
              commands.push([command.command, ...command.args])
              const result = respond(command)
              if (result.error) return Effect.fail(result.error)
              return Effect.succeed({
                command: command.command,
                exitCode: 0,
                stdout: Buffer.alloc(0),
                stderr: Buffer.alloc(0),
                stdoutTruncated: false,
                stderrTruncated: false,
                ...result,
              })
            }),
          runStream: () => Stream.die("Unexpected streaming install command"),
        }),
      ),
    )
    return { updater, commands, requests, global, fs, executable }
  })
}

const windows = process.platform === "win32" ? it.live : it.live.skip
const unix = process.platform === "win32" ? it.live.skip : it.live

;["success", "download", "install"].forEach((failure) => {
  unix(`upgrades run the xudu.ai installer and clean its directory: ${failure}`, () =>
    Effect.gen(function* () {
      const test = yield* fixture((command) => {
        const installer = command.command === "curl" ? command.args[2] : command.args[0]
        expect(existsSync(path.dirname(installer))).toBe(true)
        return {
          exitCode: command.command === (failure === "download" ? "curl" : failure === "install" ? "bash" : "") ? 1 : 0,
          stderr: Buffer.from(`${failure} failed`),
        }
      })
      const result = yield* test.updater.upgrade("curl", "v2.3.4-beta.1").pipe(Effect.flip, Effect.option)
      const installer = test.commands[0]?.[3]
      expect(installer).toStartWith(path.join(test.global.cache, "update-"))
      expect(test.commands).toEqual([
        ["curl", "-fsSL", "-o", installer, "https://xudu.ai/install"],
        ...(failure === "download" ? [] : [["bash", installer, "--version", "2.3.4-beta.1", "--no-modify-path"]]),
      ])
      expect(yield* test.fs.readDirectory(test.global.cache)).toEqual([])
      expect(result._tag).toBe(failure === "success" ? "None" : "Some")
      if (result._tag === "Some") expect(result.value.message).toBe(`${failure} failed`)
    }),
  )
})

windows("windows upgrades run the PowerShell installer for the requested version", () =>
  Effect.gen(function* () {
    const test = yield* fixture()
    yield* test.updater.upgrade("curl", "2.3.4")
    expect(test.commands).toHaveLength(1)
    expect(test.commands[0]?.[0]).toBe("powershell")
    expect(test.commands[0]?.at(-1)).toContain("$env:XUDU_CODE_VERSION='2.3.4'")
    expect(test.commands[0]?.at(-1)).toContain("irm https://xudu.ai/install.ps1 | iex")
  }),
)

it.live("invalid version targets never execute a command or create a cache", () =>
  Effect.gen(function* () {
    const test = yield* fixture()
    yield* Effect.forEach(
      ["", "latest", "2.3", "01.2.3", "vv2.3.4", "2.3.4; echo unsafe", "--global", "v2.3.4\n--force", "2.3.4'; rm -rf ~"],
      (version) =>
        Effect.gen(function* () {
          const error = yield* test.updater.upgrade("curl", version).pipe(Effect.flip)
          expect(error.message).toBe(`Invalid version: ${version}`)
        }),
    )
    expect(test.commands).toEqual([])
    expect(yield* test.fs.exists(test.global.cache)).toBe(false)
  }),
)

it.live("method detection recognizes only the binary the installer placed", () =>
  Effect.gen(function* () {
    const installed = yield* fixture()
    expect(yield* installed.updater.method()).toBe("curl")
    const checkout = yield* fixture(() => ({}), { installed: false })
    expect(yield* checkout.updater.method()).toBeUndefined()
    expect(installed.commands).toEqual([])
    expect(checkout.commands).toEqual([])
  }),
)

unix("method detection resolves symlinked home directories", () =>
  Effect.gen(function* () {
    const test = yield* fixture(() => ({}), {
      executable: (root, home) =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem
          const realHome = path.join(root, "real-home")
          const bin = path.join(realHome, ".xudu-code", "bin", "xudu-code")
          yield* fs.makeDirectory(path.dirname(bin), { recursive: true })
          yield* fs.symlink(realHome, home)
          return bin
        }),
    })
    expect(yield* test.updater.method()).toBe("curl")
  }),
)

it.live("latest reads the release from xudu.ai and rejects incomplete answers", () =>
  Effect.gen(function* () {
    const test = yield* fixture()
    expect(yield* test.updater.latest()).toBe("2.3.4")
    expect(test.requests).toHaveLength(1)
    expect(new URL(test.requests[0]!).origin + new URL(test.requests[0]!).pathname).toBe("https://xudu.ai/dl/update")
    const broken = yield* fixture(() => ({}), { release: { metadata: {} } })
    const error = yield* broken.updater.latest().pipe(Effect.flip)
    expect(error.message).toBe("The update service returned incomplete release information.")
  }),
)
