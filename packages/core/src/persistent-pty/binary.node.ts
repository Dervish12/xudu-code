export const available = true

export async function resolveBinary() {
  return process.env.XUDU_PTY_BIN || "xudu-pty"
}
