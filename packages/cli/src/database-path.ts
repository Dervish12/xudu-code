import path from "node:path"
import { XUDU_CHANNEL } from "./version"

export function databasePath(data: string) {
  const filename =
    process.env.XUDU_DB ??
    (["xudu", "latest", "dev", "beta", "next", "prod"].includes(XUDU_CHANNEL) ||
    process.env.XUDU_DISABLE_CHANNEL_DB === "1" ||
    process.env.XUDU_DISABLE_CHANNEL_DB === "true"
      ? "xudu-code.db"
      : `xudu-${XUDU_CHANNEL.replace(/[^a-zA-Z0-9._-]/g, "-")}.db`)
  return filename === ":memory:" ? filename : path.resolve(data, filename)
}
