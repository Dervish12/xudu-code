import { Xudu } from "@xudu/client"
import { Service } from "@xudu/client/effect/service"
import { bar, fetchXuduUsage, formatCount, formatQuota, panelURL } from "@xudu/tui/util/xudu-usage"
import { Effect } from "effect"
import { EOL } from "node:os"
import { Commands } from "../commands"
import { Runtime } from "../../framework/runtime"
import { ServerConnection } from "../../services/server-connection"
import { errorMessage } from "../../util/error"

export default Runtime.handler(
  Commands.commands.usage,
  Effect.fn("cli.usage")(
    function* (input) {
      const server = yield* ServerConnection.resolve()
      const client = Xudu.make({ baseUrl: server.endpoint.url, headers: Service.headers(server.endpoint) })
      const usage = yield* Effect.tryPromise({ try: () => fetchXuduUsage(client), catch: (cause) => cause })
      if (input.json) {
        process.stdout.write(JSON.stringify(usage, null, 2) + EOL)
        return
      }
      const week = usage.history.slice(-7).reduce((sum, day) => sum + day.requests, 0)
      const month = usage.history.reduce((sum, day) => sum + day.requests, 0)
      const lines = [
        `xudu.ai · ${usage.user.name} (${usage.user.email}) · paket: ${usage.plan.name}`,
        "",
        "Bu gün",
        `  Sorğular          ${formatQuota(usage.today.requests, usage.plan.daily_requests)}`,
        ...(usage.plan.daily_requests === null ? [] : [`                    ${bar(usage.today.requests, usage.plan.daily_requests)}`]),
        `  Çıxış tokenləri   ${formatQuota(usage.today.output_tokens, usage.plan.daily_output_tokens)}`,
        ...(usage.plan.daily_output_tokens === null
          ? []
          : [`                    ${bar(usage.today.output_tokens, usage.plan.daily_output_tokens)}`]),
        `  Giriş tokenləri   ${formatCount(usage.today.input_tokens)}`,
        "",
        `Son 7 gün: ${formatCount(week)} sorğu · son 30 gün: ${formatCount(month)} sorğu`,
        `Qoşulu cihazlar: ${usage.devices.length}`,
        "",
        `Ətraflı: ${panelURL}`,
      ]
      process.stdout.write(lines.join(EOL) + EOL)
    },
    Effect.catch((error) =>
      Effect.sync(() => {
        process.stderr.write(errorMessage(error) + EOL)
        process.exitCode = 1
      }),
    ),
  ),
)
