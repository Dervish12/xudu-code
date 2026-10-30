export * as ReadLedger from "./read-ledger.js"

import { createHash } from "crypto"

// Which files each session has read, and what they contained at that moment. Edit, write and patch refuse to change
// an existing file the session has not read, or one that changed since it was read, so the model never edits from a
// guess or from a stale view of the file.
const sessions = new Map<string, Map<string, string>>()
const MAX_SESSIONS = 500

export type Status = "ok" | "unread" | "stale"

export const digest = (text: string) => createHash("sha256").update(text).digest("hex")

/** Remember that the session has seen this file with this content. */
export function record(sessionID: string, path: string, text: string) {
  const files = sessions.get(sessionID) ?? new Map<string, string>()
  // Re-insert so the most recently active session is last; the oldest is evicted first.
  sessions.delete(sessionID)
  sessions.set(sessionID, files)
  files.set(path, digest(text))
  if (sessions.size > MAX_SESSIONS) sessions.delete(sessions.keys().next().value!)
}

/** Whether the session may change the file, given its current content. */
export function check(sessionID: string, path: string, text: string): Status {
  // Test-only escape hatch, like XUDU_TRUST_ALL: older tool tests change files they never read.
  if (process.env.XUDU_SKIP_READ_CHECK === "1") return "ok"
  const seen = sessions.get(sessionID)?.get(path)
  if (seen === undefined) return "unread"
  return seen === digest(text) ? "ok" : "stale"
}

export function message(status: Exclude<Status, "ok">, path: string) {
  return status === "unread"
    ? `${path} has not been read in this session. Read it with the read tool first, then change it.`
    : `${path} has changed since you last read it. Read it again before changing it.`
}

/** Test helper: forget every session. */
export function reset() {
  sessions.clear()
}
