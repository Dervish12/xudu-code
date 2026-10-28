export * as WorkspaceTrust from "./workspace-trust.js"

import fs from "node:fs"
import path from "node:path"

/**
 * Settings an untrusted folder may still apply. None of them runs a program, widens what tools may do, loads code, or
 * sends data anywhere. Everything else a folder's configuration sets (plugins, MCP servers, formatters, language
 * servers, providers, the shell, permissions, agents, references, update and sharing settings) waits until the folder
 * is trusted, so opening an unfamiliar repository never runs its code.
 */
export const safe = new Set<string>([
  "model",
  "default_agent",
  "username",
  "snapshots",
  "watcher",
  "media",
  "tool_output",
  "compaction",
  "commands",
  "warming",
  "websearch",
  "policies",
])

// Lists of local paths that may also name URLs; only the local entries are safe.
export const localOnly = new Set<string>(["instructions", "skills"])

export const remote = (value: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(value)

/** The settings in a raw configuration object that an untrusted folder may not apply. */
export function unsafeSettings(config: Record<string, unknown>) {
  return Object.entries(config).flatMap(([key, value]) => {
    if (key === "$schema" || value === undefined) return []
    if (localOnly.has(key) && Array.isArray(value))
      return value.some((item) => typeof item !== "string" || remote(item)) ? [key] : []
    return safe.has(key) ? [] : [key]
  })
}

/** Folders inside a project that hold its configuration; they belong to the folder that contains them. */
export const configDirectories = [".xudu-code", ".claude", ".agents"]

export const fileName = "trusted-folders.json"

/** The trust list lives in the state directory, outside every project, so a repository cannot trust itself. */
export function file(state: string) {
  return path.join(state, fileName)
}

export function list(state: string): string[] {
  try {
    const value: unknown = JSON.parse(fs.readFileSync(file(state), "utf8"))
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

function save(state: string, folders: readonly string[]) {
  fs.mkdirSync(state, { recursive: true })
  const target = file(state)
  const temporary = `${target}.${process.pid}.tmp`
  fs.writeFileSync(temporary, JSON.stringify([...new Set(folders)].toSorted(), null, 2) + "\n", { mode: 0o600 })
  fs.renameSync(temporary, target)
}

/**
 * The folder's real path, so a symlinked path and its target are the same folder. A folder that does not exist yet
 * resolves through its nearest existing parent.
 */
export function canonical(folder: string): string {
  const resolved = path.resolve(folder)
  try {
    return fs.realpathSync.native(resolved)
  } catch {
    const parent = path.dirname(resolved)
    return parent === resolved ? resolved : path.join(canonical(parent), path.basename(resolved))
  }
}

export function trust(state: string, folder: string) {
  save(state, [...list(state), canonical(folder)])
}

export function untrust(state: string, folder: string) {
  const resolved = canonical(folder)
  save(
    state,
    list(state).filter((item) => item !== resolved),
  )
}

export function inside(target: string, root: string) {
  const relative = path.relative(root, target)
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
}

/**
 * Whether configuration found in `directory` may run code. Trusting a folder trusts everything inside it. The home
 * directory's own configuration belongs to the user and is always trusted; folders below it are not.
 */
export function trusted(directory: string, input: { readonly state: string; readonly home: string }) {
  if (["1", "true"].includes(process.env.XUDU_TRUST_ALL?.toLowerCase() ?? "")) return true
  const resolved = canonical(directory)
  const owner = configDirectories.includes(path.basename(resolved)) ? path.dirname(resolved) : resolved
  if (owner === canonical(input.home)) return true
  return list(input.state).some((root) => inside(resolved, root))
}
