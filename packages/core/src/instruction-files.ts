export * as InstructionFiles from "./instruction-files.js"

import { dirname } from "path"

/**
 * Instruction file names in priority order. A directory contributes only its first match, so a repository that keeps
 * the same guidance in AGENTS.md and CLAUDE.md is not loaded twice.
 */
export const names = ["XUDU.md", "AGENTS.md", "CLAUDE.md"]

/** Keeps the highest-priority instruction file of each directory, preserving the walk order of `files`. */
export function firstPerDirectory(files: readonly string[]) {
  const seen = new Set<string>()
  return files.filter((file) => {
    const directory = dirname(file)
    if (seen.has(directory)) return false
    seen.add(directory)
    return true
  })
}
