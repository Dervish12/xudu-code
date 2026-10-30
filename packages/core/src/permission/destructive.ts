export * as Destructive from "./destructive.js"

// Shell commands that destroy work or data and cannot be undone. A saved "always allow" approval never covers them:
// approving `git push origin main` once must not silently approve `git push --force` later. Only an explicit rule in
// the agent or session configuration can allow them without asking.
const patterns: ReadonlyArray<readonly [string, RegExp]> = [
  ["recursive rm", /^rm\s+(?:\S+\s+)*?(?:-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)(?:\s|$)/],
  ["git push --force", /^git\s+push\b(?=.*(?:\s--force(?:-with-lease)?(?:=\S*)?(?:\s|$)|\s-[a-zA-Z]*f[a-zA-Z]*(?:\s|$)|\s\+\S))/],
  ["git reset --hard", /^git\s+reset\b.*\s--hard(?:\s|$)/],
  ["git clean -f", /^git\s+clean\b.*\s-[a-zA-Z]*f/],
  ["git branch -D", /^git\s+branch\b.*\s(?:-D|--delete\s+--force|--force\s+--delete)(?:\s|$)/],
  ["git checkout/restore discarding changes", /^git\s+(?:checkout\s+(?:\S+\s+)?--\s|restore\s+(?!.*--staged))/],
  ["git stash drop/clear", /^git\s+stash\s+(?:drop|clear)\b/],
  ["dd / mkfs", /^(?:dd|mkfs(?:\.\w+)?)(?:\s|$)/],
  ["docker prune/rm", /^docker\s+(?:system\s+prune|volume\s+(?:rm|prune)|image\s+prune|rm\s+.*-[a-zA-Z]*f)/],
  ["kubectl delete", /^kubectl\s+delete\b/],
  ["truncate", /^truncate(?:\s|$)/],
]

/** Strip wrappers that do not change what the command does to data. */
function core(command: string) {
  let text = command.trim()
  for (;;) {
    const next = text
      .replace(/^(?:sudo|doas|command|nohup|time)\s+(?:-\S+\s+)*/, "")
      .replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+/, "")
    if (next === text) return text
    text = next
  }
}

/** The name of the destructive pattern this command matches, or undefined. */
export function match(command: string): string | undefined {
  const text = core(command)
  return patterns.find(([, pattern]) => pattern.test(text))?.[0]
}
