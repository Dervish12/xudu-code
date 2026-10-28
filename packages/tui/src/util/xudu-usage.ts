import type { XuduClient } from "@xudu/client"

/** The signed-in account's plan, usage, and devices, as the xudu.ai gateway reports them. */
export interface XuduUsage {
  user: { name: string; email: string; role: string }
  plan: { id: string; name: string; daily_requests: number | null; daily_output_tokens: number | null }
  today: { requests: number; input_tokens: number; output_tokens: number }
  history: { day: string; requests: number; input_tokens: number; output_tokens: number }[]
  devices: { id: string; label: string; created: number; last_used: number | null; current: boolean }[]
}

export const panelURL = "https://xudu.ai/code/usage"
const endpoint = "https://api.xudu.ai/cli/usage"

/** The token of the active xudu.ai credential, or undefined when the user has not signed in. */
export async function xuduToken(client: XuduClient) {
  const credentials = await client.credential.list()
  const credential = credentials.find((item) => item.integrationID === "xudu" && item.active)
  if (credential?.value.type === "oauth") return credential.value.access
  if (credential?.value.type === "key") return credential.value.key
  return undefined
}

export async function fetchXuduUsage(client: XuduClient): Promise<XuduUsage> {
  const token = await xuduToken(client)
  if (!token) throw new Error("xudu.ai hesabına daxil olmamısan: xudu-code auth login")
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "Mozilla/5.0 (xudu-code)" },
    signal: AbortSignal.timeout(15_000),
  })
  const body = (await response.json().catch(() => ({}))) as Partial<XuduUsage> & { error?: string }
  if (!response.ok) throw new Error(body.error ?? `xudu.ai: ${response.status}`)
  return body as XuduUsage
}

export function formatCount(value: number) {
  return value.toLocaleString("en-US").replaceAll(",", " ")
}

/** "used / limit" with the share used, or "used / limitsiz" when the plan sets no limit. */
export function formatQuota(used: number, limit: number | null) {
  if (limit === null) return `${formatCount(used)} / limitsiz`
  return `${formatCount(used)} / ${formatCount(limit)} (${Math.min(100, Math.round((used / limit) * 100))}%)`
}

/** A fixed-width bar for terminals: filled share of `width` cells. */
export function bar(used: number, limit: number | null, width = 24) {
  if (limit === null || limit <= 0) return ""
  const filled = Math.min(width, Math.round((used / limit) * width))
  return "█".repeat(filled) + "░".repeat(width - filled)
}
