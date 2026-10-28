import path from "node:path"
import { confirm, log, note } from "@clack/prompts"
import { Effect } from "effect"
import type { XuduClient } from "@xudu/client"
import { Global } from "@xudu/util/global"
import { WorkspaceTrust } from "@xudu/util/workspace-trust"
import { pending, targets } from "../../workspace-trust"
import { prompt } from "../../ui/prompt"

/**
 * Asks once whether to trust the folder when its configuration would run code (plugins, MCP servers, formatters,
 * permissions). Until it is trusted the server ignores those settings, so declining is safe; the next start asks again.
 */
export const ensureTrust = Effect.fn("cli.trust.prompt")(function* (client: XuduClient) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return
  const global = yield* Global.Service
  const findings = pending(process.cwd(), { state: global.state, home: global.home })
  if (findings.length === 0) return
  const folders = targets(process.cwd(), findings)
  note(
    findings
      .map((finding) => `${path.relative(process.cwd(), finding.source) || "."}: ${finding.settings.join(", ")}`)
      .join("\n"),
    "Bu qovluğun konfiqurasiyası kod işə sala bilər",
  )
  const accepted = yield* prompt(() =>
    confirm({
      message: `${folders.join(", ")} qovluğuna etibar edilsin? Etibar etməsən, bu ayarlar nəzərə alınmayacaq.`,
      initialValue: false,
    }),
  ).pipe(Effect.orElseSucceed(() => false))
  if (!accepted) {
    log.info("Etibar edilmədi: təhlükəsiz ayarlarla davam edilir. Sonra: xudu-code trust")
    return
  }
  for (const folder of folders) WorkspaceTrust.trust(global.state, folder)
  yield* Effect.tryPromise({ try: (signal) => client.location.reload({ signal }), catch: (cause) => cause }).pipe(
    Effect.ignore,
  )
  log.success("Etibar edildi")
})
