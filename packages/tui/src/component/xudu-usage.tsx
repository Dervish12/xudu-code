import { TextAttributes } from "@opentui/core"
import { openUrl } from "@xudu/util/open"
import { createResource, Match, Show, Switch } from "solid-js"
import { useClient } from "../context/client"
import { useTheme } from "../context/theme"
import { DialogHeader, DialogLayout } from "../ui/dialog"
import { bar, fetchXuduUsage, formatCount, formatQuota, panelURL } from "../util/xudu-usage"

/** `/usage`: the xudu.ai plan, today's usage against its limits, and the last 30 days. */
export function DialogXuduUsage() {
  const client = useClient()
  const theme = useTheme().surface("dialog")
  const [usage] = createResource(() => fetchXuduUsage(client.api))
  const month = () => usage()?.history.reduce((sum, day) => sum + day.requests, 0) ?? 0
  const level = (used: number, limit: number | null) =>
    limit !== null && used >= limit
      ? theme.text.feedback.error.base
      : limit !== null && used >= limit * 0.8
        ? theme.text.feedback.warning.base
        : theme.text.base

  return (
    <DialogLayout header={<DialogHeader title="Usage" />}>
      <Switch>
        <Match when={usage.error}>
          <text fg={theme.text.feedback.error.base} wrapMode="word">
            {usage.error instanceof Error ? usage.error.message : String(usage.error)}
          </text>
        </Match>
        <Match when={usage()}>
          {(value) => (
            <box gap={1}>
              <box>
                <text fg={theme.text.base} attributes={TextAttributes.BOLD}>
                  {value().plan.name}
                </text>
                <text fg={theme.text.muted}>
                  {value().user.name} · {value().user.email}
                </text>
              </box>
              <box>
                <text fg={theme.text.muted}>Bu gün</text>
                <text fg={level(value().today.requests, value().plan.daily_requests)}>
                  Sorğular {formatQuota(value().today.requests, value().plan.daily_requests)}
                </text>
                <Show when={value().plan.daily_requests !== null}>
                  <text fg={theme.text.muted}>{bar(value().today.requests, value().plan.daily_requests)}</text>
                </Show>
                <text fg={level(value().today.output_tokens, value().plan.daily_output_tokens)}>
                  Çıxış tokenləri {formatQuota(value().today.output_tokens, value().plan.daily_output_tokens)}
                </text>
                <Show when={value().plan.daily_output_tokens !== null}>
                  <text fg={theme.text.muted}>{bar(value().today.output_tokens, value().plan.daily_output_tokens)}</text>
                </Show>
              </box>
              <text fg={theme.text.muted}>
                Son 30 gün: {formatCount(month())} sorğu · cihazlar: {value().devices.length}
              </text>
              <text fg={theme.markdown.link} onMouseUp={() => void openUrl(panelURL).catch(() => {})}>
                {panelURL}
              </text>
            </box>
          )}
        </Match>
        <Match when={true}>
          <text fg={theme.text.muted}>Yüklənir…</text>
        </Match>
      </Switch>
    </DialogLayout>
  )
}
