export * as WorkspaceTrust from "./workspace-trust.js"

import { Info } from "@xudu/schema/config"
import { WorkspaceTrust as Store } from "@xudu/util/workspace-trust"

export const { file, fileName, list, trust, untrust, inside, trusted, unsafeSettings } = Store
const { safe, localOnly, remote } = Store

export interface Sanitized {
  readonly info: Info
  /** The settings that were ignored, by key. */
  readonly dropped: readonly string[]
}

/** The part of an untrusted folder's configuration that can apply without trust. */
export function sanitize(info: Info): Sanitized {
  const kept: Record<string, unknown> = {}
  const dropped: string[] = []
  for (const [key, value] of Object.entries(info)) {
    if (value === undefined) continue
    if (localOnly.has(key) && Array.isArray(value)) {
      const local = value.filter((item) => typeof item === "string" && !remote(item))
      if (local.length !== value.length) dropped.push(key)
      if (local.length > 0) kept[key] = local
      continue
    }
    if (safe.has(key)) kept[key] = value
    else dropped.push(key)
  }
  return { info: new Info(kept as ConstructorParameters<typeof Info>[0]), dropped }
}
