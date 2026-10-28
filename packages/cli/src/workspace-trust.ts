import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { parse, type ParseError } from "jsonc-parser"
import { WorkspaceTrust } from "@xudu/util/workspace-trust"

export interface Finding {
  /** The folder whose trust would allow the source. */
  readonly folder: string
  readonly source: string
  readonly settings: readonly string[]
}

const configNames = ["xudu-code.json", "xudu-code.jsonc"]

function readConfig(file: string): Record<string, unknown> | undefined {
  if (!existsSync(file)) return undefined
  const errors: ParseError[] = []
  const value: unknown = parse(readFileSync(file, "utf8"), errors, { allowTrailingComma: true })
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function entries(directory: string) {
  try {
    return readdirSync(directory, { recursive: true, encoding: "utf8" })
  } catch {
    return []
  }
}

/**
 * Configuration in `cwd` and its parents that waits for trust: settings that could run code or send data, project
 * plugins, and agents that set permissions. Mirrors what the server ignores in an untrusted folder.
 */
export function pending(cwd: string, input: { readonly state: string; readonly home: string }): Finding[] {
  const findings: Finding[] = []
  for (let directory = path.resolve(cwd); ; directory = path.dirname(directory)) {
    if (!WorkspaceTrust.trusted(directory, input)) {
      const locals = WorkspaceTrust.configDirectories.map((name) => path.join(directory, name))
      for (const file of [directory, ...locals].flatMap((folder) =>
        configNames.map((name) => path.join(folder, name)),
      )) {
        const config = readConfig(file)
        const settings = config ? WorkspaceTrust.unsafeSettings(config) : []
        if (settings.length > 0) findings.push({ folder: directory, source: file, settings })
      }
      for (const local of locals) findings.push(...code(directory, local))
    }
    if (path.dirname(directory) === directory) break
  }
  return findings
}

// Plugins, and agents that grant themselves tools or permissions, in one configuration folder.
function code(folder: string, local: string): Finding[] {
  const findings: Finding[] = []
  for (const name of ["plugin", "plugins"]) {
    const plugins = path.join(local, name)
    if (entries(plugins).length > 0) findings.push({ folder, source: plugins, settings: ["plugins"] })
  }
  for (const name of ["agent", "agents", "mode", "modes"]) {
    const agents = path.join(local, name)
    const granting = entries(agents).filter((file) => {
      const full = path.join(agents, file)
      return (
        file.endsWith(".md") && statSync(full).isFile() && /^(permissions?|tools)\s*:/m.test(readFileSync(full, "utf8"))
      )
    })
    if (granting.length > 0) findings.push({ folder, source: agents, settings: ["agent permissions"] })
  }
  return findings
}

/** The folder `xudu-code trust` trusts by default: the repository root, or the folder itself outside a repository. */
export function projectRoot(cwd: string) {
  for (let directory = path.resolve(cwd); ; directory = path.dirname(directory)) {
    if (existsSync(path.join(directory, ".git")) || existsSync(path.join(directory, ".hg"))) return directory
    if (path.dirname(directory) === directory) return path.resolve(cwd)
  }
}

/** The folders to trust so every finding applies: the project root when a finding lies inside it, else its own folder. */
export function targets(cwd: string, findings: readonly Finding[]) {
  const root = projectRoot(cwd)
  return [...new Set(findings.map((finding) => (WorkspaceTrust.inside(finding.folder, root) ? root : finding.folder)))]
}
