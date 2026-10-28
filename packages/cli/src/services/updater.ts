import { Global } from "@xudu/util/global"
import { AppProcess } from "@xudu/util/process"
import { EffectFlock } from "@xudu/util/effect-flock"
import { XUDU_CHANNEL, XUDU_LOCAL, XUDU_VERSION } from "../version"
import { Context, Duration, Effect, FileSystem, Layer, Ref } from "effect"
import { ChildProcess } from "effect/process"
import { parse, type ParseError } from "jsonc-parser"
import path from "node:path"
import { stripVTControlCharacters } from "node:util"
import { RetainedImage } from "./retained-image"
import { action, parseReleaseVersion, type Policy } from "./updater-action"
import { errorMessage } from "../util/error"

// xudu-code ships through its own installer (xudu.ai/install, xudu.ai/install.ps1), which upgrades also run.
export const methods = ["curl"] as const

export type Method = (typeof methods)[number]
export type RunResult = { readonly type: "available" | "installed"; readonly version: string }
export type CheckResult = RunResult | { readonly type: "unavailable"; readonly message: string }

export class UpgradeError extends Error {
  readonly title: string
  readonly detail: string
  readonly command?: string
  readonly retry: string

  constructor(
    input: {
      readonly title: string
      readonly detail: string
      readonly command?: string
      readonly retry: string
    },
    options?: ErrorOptions,
  ) {
    super(input.detail, options)
    this.name = "UpgradeError"
    this.title = input.title
    this.detail = input.detail
    this.command = input.command
    this.retry = input.retry
  }
}

function conciseDetail(input: string) {
  const lines = stripVTControlCharacters(input)
    .trim()
    .replaceAll("\r", "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
  const tail = lines.slice(-12).join("\n")
  const clipped = tail.length > 2_000
  const detail = clipped ? `…${tail.slice(-1_999)}` : tail
  if (!detail) return
  if (lines.length <= 12 && !clipped) return detail
  return `${detail}\n\nOutput shortened to the last 12 lines.`
}

function errorDetail(cause: unknown): string {
  if (cause instanceof AppProcess.AppProcessError) {
    const stderr = conciseDetail(cause.stderr ?? "")
    if (stderr) return stderr
    if (cause.cause !== undefined) return errorDetail(cause.cause)
    return cause.message
  }
  if (cause instanceof Error) {
    const detail = cause.cause === undefined ? undefined : errorDetail(cause.cause)
    if (!detail || detail === cause.message) return cause.message
    return `${cause.message}: ${detail}`
  }
  return errorMessage(cause)
}

function resultDetail(result: { code: number; stdout: string; stderr: string }) {
  return (
    conciseDetail(result.stderr) ??
    conciseDetail(result.stdout) ??
    `The command exited with code ${result.code} without any error output.`
  )
}

export interface Interface {
  readonly run: (onInstall?: (version: string) => void) => Effect.Effect<RunResult | undefined>
  readonly check: () => Effect.Effect<CheckResult | undefined, Error>
  readonly apply: (version: string) => Effect.Effect<void, Error>
  readonly method: () => Effect.Effect<Method | undefined>
  readonly latest: (method?: Method) => Effect.Effect<string, Error>
  readonly upgrade: (method: Method, version: string) => Effect.Effect<void, Error>
  readonly removal: (
    method: Method,
  ) => { readonly command: ReadonlyArray<string>; readonly run: Effect.Effect<void, Error> } | undefined
}

export class Service extends Context.Service<Service, Interface>()("@xudu/cli/Updater") {}

export function decodePolicy(text: string): Policy | undefined {
  // The CLI only projects this host-level preference instead of initializing
  // the location-scoped server configuration graph.
  const errors: ParseError[] = []
  const input: unknown = parse(text, errors, { allowTrailingComma: true })
  if (errors.length || typeof input !== "object" || input === null) return
  if ("update" in input) {
    const value = input.update
    if (value === "disable" || value === "notify" || value === "auto") return value
    return
  }
  if (!("autoupdate" in input)) return
  if (input.autoupdate === false) return "disable"
  if (input.autoupdate === "notify") return "notify"
  if (input.autoupdate === true) return "auto"
}

const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const global = yield* Global.Service
  const appProcess = yield* AppProcess.Service
  const flock = yield* EffectFlock.Service
  const installedVersion = yield* Ref.make(XUDU_VERSION)
  const channel = XUDU_CHANNEL.replace(/[^a-zA-Z0-9._-]/g, "-")
  const executable = yield* fs.realPath(process.execPath).pipe(Effect.orElseSucceed(() => process.execPath))

  const readPolicy = Effect.fnUntraced(function* () {
    const values = yield* Effect.forEach(["config.json", "xudu-code.json", "xudu-code.jsonc"], (name) =>
      fs.readFileString(path.join(global.config, name)).pipe(
        Effect.map(decodePolicy),
        Effect.orElseSucceed(() => undefined),
      ),
    )
    return values.findLast((value) => value !== undefined) ?? "notify"
  })

  const exec = Effect.fnUntraced(function* (command: string[], timeout: Duration.Input = "30 seconds") {
    return yield* appProcess
      .run(ChildProcess.make(command[0], command.slice(1)), {
        timeout,
        maxOutputBytes: 100_000,
        maxErrorBytes: 100_000,
      })
      .pipe(
        Effect.map((result) => ({
          code: result.exitCode,
          stdout: result.stdout.toString("utf8"),
          stderr: result.stderr.toString("utf8"),
        })),
      )
  })

  const installPath = path.resolve(
    global.home,
    ".xudu-code",
    "bin",
    process.platform === "win32" ? "xudu-code.exe" : "xudu-code",
  )
  const installedBinary = yield* fs.realPath(installPath).pipe(Effect.orElseSucceed(() => installPath))

  // Only a binary the installer placed can be upgraded in place; source checkouts run inside Bun.
  const method = Effect.fnUntraced(function* () {
    if (executable === installedBinary) return "curl" as const
  })

  const removal = (_method: Method) => undefined

  const release = Effect.fnUntraced(function* () {
    const response = yield* Effect.tryPromise({
      try: (signal) =>
        fetch(
          `https://xudu.ai/dl/update?channel=${encodeURIComponent(channel)}&current=${encodeURIComponent(XUDU_VERSION)}`,
          { signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) },
        ),
      catch: (cause) =>
        new UpgradeError(
          {
            title: "Could not check for xudu-code updates",
            detail: errorDetail(cause),
            retry: "Check your network, then run xudu-code upgrade again.",
          },
          { cause },
        ),
    })
    if (!response.ok)
      return yield* Effect.fail(
        new UpgradeError({
          title: "Could not check for xudu-code updates",
          detail: `The update service returned HTTP ${response.status}.`,
          retry: "Try again in a few minutes.",
        }),
      )
    const data: { version?: string } = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) =>
        new UpgradeError(
          {
            title: "Could not read the xudu-code update information",
            detail: errorDetail(cause),
            retry: "Try again in a few minutes.",
          },
          { cause },
        ),
    })
    if (!data.version)
      return yield* Effect.fail(
        new UpgradeError({
          title: "Could not read the xudu-code update information",
          detail: "The update service returned incomplete release information.",
          retry: "Try again in a few minutes.",
        }),
      )
    return data.version
  })

  const latest = (_selected?: Method) => release()

  const temporaryDirectory = (prefix: string) =>
    Effect.acquireRelease(fs.makeTempDirectory({ directory: global.cache, prefix }), (directory) =>
      fs.remove(directory, { recursive: true, force: true }).pipe(Effect.ignore),
    )

  // On Windows the installer must replace the running binary, which only works while another link to it exists
  // (see RetainedImage).
  const retaining = <A, E, R>(effect: Effect.Effect<A, E, R>) => {
    if (process.platform !== "win32" || executable !== installedBinary) return effect
    return Effect.scoped(RetainedImage.retain(global.cache, "upgrade").pipe(Effect.andThen(effect))).pipe(
      Effect.provideService(FileSystem.FileSystem, fs),
    )
  }

  const runUpgrade = (input: {
    readonly command: string[]
    readonly displayCommand?: string[]
    readonly title: string
    readonly retry?: string
  }) => {
    const failure = (detail: string, cause?: unknown) =>
      new UpgradeError(
        {
          title: input.title,
          detail,
          command: (input.displayCommand ?? input.command).join(" "),
          retry: input.retry ?? "Fix the issue above, then run xudu-code upgrade again.",
        },
        cause === undefined ? undefined : { cause },
      )
    return exec(input.command, "5 minutes").pipe(
      Effect.flatMap((result) =>
        result.code === 0 ? Effect.succeed(result) : Effect.fail(failure(resultDetail(result))),
      ),
      Effect.mapError((cause) => (cause instanceof UpgradeError ? cause : failure(errorDetail(cause), cause))),
    )
  }

  const upgrade = Effect.fnUntraced(function* (_method: Method, input: string) {
    if (!parseReleaseVersion(input)) return yield* Effect.fail(new Error(`Invalid version: ${input}`))
    const version = input.trim().replace(/^v/, "")
    yield* Effect.scoped(
      Effect.gen(function* () {
        // Other xudu-code processes may be installing at the same time; wait longer than the slowest install.
        yield* flock.acquire("cli-upgrade", undefined, { timeoutMs: Duration.toMillis("15 minutes") })
        if (process.platform === "win32")
          // Windows installs come from the PowerShell installer, which every supported Windows version has.
          return yield* retaining(
            runUpgrade({
              command: [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                `$env:XUDU_CODE_VERSION='${version}'; $env:XUDU_CODE_NO_MODIFY_PATH='1'; irm https://xudu.ai/install.ps1 | iex`,
              ],
              displayCommand: ["xudu-code", "upgrade", version],
              title: "The xudu-code installer failed",
              retry: "Check your network, then run xudu-code upgrade again.",
            }),
          )
        yield* fs.makeDirectory(global.cache, { recursive: true })
        const directory = yield* temporaryDirectory("update-")
        const installer = path.join(directory, "install")
        yield* runUpgrade({
          command: ["curl", "-fsSL", "-o", installer, "https://xudu.ai/install"],
          displayCommand: ["curl", "-fsSL", "https://xudu.ai/install"],
          title: "Could not download the xudu-code installer",
          retry: "Check your network, then run xudu-code upgrade again.",
        })
        return yield* runUpgrade({
          command: ["bash", installer, "--version", version, "--no-modify-path"],
          displayCommand: ["xudu-code", "upgrade", version],
          title: "The xudu-code installer failed",
        })
      }),
    ).pipe(
      Effect.mapError((cause) =>
        cause instanceof UpgradeError
          ? cause
          : new UpgradeError(
              {
                title: "Could not prepare the xudu-code upgrade",
                detail: errorDetail(cause),
                retry: "Fix the issue above, then run xudu-code upgrade again.",
              },
              { cause },
            ),
      ),
      Effect.asVoid,
    )
  })

  const inspect = Effect.fnUntraced(function* () {
    if (XUDU_LOCAL || ["1", "true"].includes(process.env.XUDU_DISABLE_AUTOUPDATE?.toLowerCase() ?? "")) {
      yield* Effect.logInfo("update check skipped", {
        reason: XUDU_LOCAL ? "local-install" : "disabled",
        version: XUDU_VERSION,
        channel: XUDU_CHANNEL,
      })
      return undefined
    }
    const policy = yield* readPolicy()
    if (policy === "disable") {
      yield* Effect.logInfo("update check skipped", { reason: "policy-disabled" })
      return undefined
    }

    const current = yield* Ref.get(installedVersion)
    const version = yield* latest()
    yield* Effect.logInfo("update check", {
      current,
      latest: version,
    })
    const next = action(current, version, policy)
    if (next === "none") {
      yield* Effect.logInfo("update check done", { action: "up-to-date" })
      return undefined
    }
    yield* Effect.logInfo("xudu-code update available", { current, latest: version, action: next })
    return { policy, version }
  })

  const install = Effect.fnUntraced(function* (version: string) {
    const detected = yield* method()
    if (!detected) {
      yield* Effect.logWarning("update skipped: installation method not found")
      return false
    }
    const current = yield* Ref.get(installedVersion)
    yield* upgrade(detected, version)
    yield* Ref.set(installedVersion, version)
    yield* Effect.logInfo("updated xudu-code", { from: current, to: version, method: detected })
    return true
  })

  const apply = Effect.fn("cli.updater.apply")(function* (version: string) {
    if (!(yield* install(version)))
      return yield* Effect.fail(
        new Error(
          "This xudu-code was not installed by the xudu.ai installer. Reinstall with: curl -fsSL https://xudu.ai/install | bash",
        ),
      )
  })

  const check = Effect.fn("cli.updater.check")(function* () {
    if (XUDU_LOCAL)
      return {
        type: "unavailable" as const,
        message: "This build runs from a source checkout. Use an installed xudu-code release to check for updates.",
      }
    const detected = yield* method()
    if (!detected)
      return {
        type: "unavailable" as const,
        message:
          "This xudu-code was not installed by the xudu.ai installer. Reinstall with: curl -fsSL https://xudu.ai/install | bash",
      }
    const version = yield* latest(detected)
    if (!parseReleaseVersion(version)) return yield* Effect.fail(new Error(`Invalid version: ${version}`))
    const current = yield* Ref.get(installedVersion)
    if (action(current, version, "auto") === "none") {
      // An earlier check may have installed the update while this client is still running.
      return action(XUDU_VERSION, current, "auto") === "none"
        ? undefined
        : { type: "installed" as const, version: current }
    }
    return { type: "available" as const, version }
  })

  const run = Effect.fn("cli.updater.run")(
    function* (onInstall: (version: string) => void = () => {}) {
      const result = yield* inspect()
      if (!result) return undefined
      if (result.policy === "notify") return { type: "available" as const, version: result.version }
      onInstall(result.version)
      if (!(yield* install(result.version))) return yield* Effect.fail(new Error("Installation method not found"))
      return { type: "installed" as const, version: result.version }
    },
    Effect.catch((error) => Effect.logWarning("update check failed", { error }).pipe(Effect.as(undefined))),
  )

  return Service.of({ run, check, apply, method, latest, upgrade, removal })
})

export const layer = Layer.effect(Service, make)

export * as Updater from "./updater"
export { action, type Action, type Policy } from "./updater-action"
