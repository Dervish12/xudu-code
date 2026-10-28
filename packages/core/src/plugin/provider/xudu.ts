import type { IntegrationOAuthMethodRegistration } from "@xudu/plugin/effect/integration"
import { define } from "@xudu/plugin/effect/plugin"
import { Integration } from "@xudu/schema/integration"
import { Provider } from "@xudu/schema/provider"
import { Effect, Schema } from "effect"
import os from "os"
import { Credential } from "../../credential.js"
import { Model } from "../../model.js"

// xudu.ai: the only built-in provider of xudu-code. Login is a device flow against the xudu.ai gateway:
// the CLI shows a code, the user approves it on xudu.ai/cli-login while signed in, and the gateway issues a
// token tied to that xudu.ai account (its plan and daily limits apply to every request).
export const api = "https://api.xudu.ai"
export const providerID = Provider.ID.make("xudu")
export const integrationID = Integration.ID.make("xudu")
export const modelID = "xudu-flash"
// Cloudflare in front of api.xudu.ai rejects bare library user agents.
const userAgent = "Mozilla/5.0 (xudu-code)"
const methodID = Integration.MethodID.make("device")

const Device = Schema.Struct({
  device_code: Schema.String,
  user_code: Schema.String,
  verification_uri: Schema.String,
  interval: Schema.Number,
  expires_in: Schema.Number,
})
const Poll = Schema.Struct({
  status: Schema.String,
  token: Schema.optional(Schema.String),
  plan: Schema.optional(Schema.String),
  user: Schema.optional(Schema.Struct({ name: Schema.optional(Schema.String), email: Schema.optional(Schema.String) })),
})

const SearchResponse = Schema.Struct({
  results: Schema.Array(
    Schema.Struct({
      url: Schema.String,
      title: Schema.optional(Schema.String),
      content: Schema.optional(Schema.String),
      published: Schema.optional(Schema.NullOr(Schema.String)),
    }),
  ),
})

function request(url: string, init: RequestInit = {}) {
  return Effect.tryPromise({
    try: async (signal) => {
      const response = await fetch(url, {
        ...init,
        signal,
        headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": userAgent },
      })
      // The poll endpoint answers "denied" with 403 and "expired" with 410; their bodies carry the status.
      if (!response.ok && response.status !== 403 && response.status !== 410)
        throw new Error(`xudu.ai: ${response.status}`)
      return response.json()
    },
    catch: (cause) => cause,
  })
}

const oauth = {
  integrationID,
  method: { id: methodID, type: "oauth", label: "xudu.ai hesabı ilə daxil ol" },
  authorize: () =>
    Effect.gen(function* () {
      const host = os.hostname()
      const device = yield* request(`${api}/cli/device`, {
        method: "POST",
        body: JSON.stringify({ label: `${host.split(".")[0]} · xudu-code` }),
      }).pipe(Effect.map(Schema.decodeUnknownSync(Device)))
      const interval = Math.max(device.interval, 1) * 1000

      const poll: Effect.Effect<Credential.OAuth, unknown> = request(
        `${api}/cli/poll?device_code=${encodeURIComponent(device.device_code)}`,
      ).pipe(
        Effect.map(Schema.decodeUnknownSync(Poll)),
        Effect.flatMap((result) => {
          if (result.status === "ok" && result.token)
            return Effect.succeed(
              Credential.OAuth.make({
                type: "oauth",
                methodID,
                access: result.token,
                refresh: result.token,
                expires: 0,
                metadata: {
                  ...(result.user?.name ? { name: result.user.name } : {}),
                  ...(result.user?.email ? { email: result.user.email } : {}),
                  ...(result.plan ? { plan: result.plan } : {}),
                },
              }),
            )
          if (result.status === "pending") return Effect.sleep(interval).pipe(Effect.andThen(poll))
          if (result.status === "denied") return Effect.fail(new Error("Giriş xudu.ai-da rədd edildi"))
          return Effect.fail(new Error("Kodun vaxtı keçdi, yenidən daxil ol"))
        }),
      )

      return {
        mode: "auto" as const,
        url: device.verification_uri,
        instructions: `Kod: ${device.user_code}`,
        expiresAt: Date.now() + device.expires_in * 1000,
        callback: poll,
      }
    }),
} satisfies IntegrationOAuthMethodRegistration

export const XuduPlugin = define({
  id: "xudu.provider",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.integration.transform((integrations) => {
      integrations.update(integrationID, (integration) => (integration.name = "xudu.ai"))
      integrations.method.update(oauth)
      // A pasted xudu.ai API key (sk-...) also works with the gateway.
      integrations.method.update({ integrationID, method: { type: "key" } })
    })
    yield* ctx.provider.transform((providers) => {
      providers.add({
        info: {
          id: providerID,
          integrationID,
          name: "xudu.ai",
          activation: "auto",
          package: "@xudu/ai/providers/anthropic",
          settings: { baseURL: `${api}/v1` },
          headers: { "User-Agent": userAgent },
        },
        models: [
          {
            ...Model.Info.default(providerID, Model.ID.make(modelID)),
            name: "xudu-flash",
            capabilities: { tools: true, input: ["text", "image"], output: ["text"] },
            limit: { context: 262_144, output: 32_000 },
          },
        ],
      })
    })
    yield* ctx.model.transform((models) => models.default.set(providerID, Model.ID.make(modelID)))
    // Web search runs on xudu.ai under the signed-in account, so it works without a third-party search key.
    yield* ctx.websearch.transform((editor) => {
      editor.add({
        id: "xudu",
        name: "xudu.ai",
        execute: (input) =>
          Effect.gen(function* () {
            const connection = yield* ctx.integration.connection.active(integrationID)
            const credential = connection ? yield* ctx.integration.connection.resolve(connection) : undefined
            const token =
              credential?.type === "oauth" ? credential.access : credential?.type === "key" ? credential.key : undefined
            if (!token) return yield* Effect.fail(new Error("xudu.ai hesabına daxil olmamısan: xudu-code auth login"))
            const result = yield* Effect.tryPromise({
              try: async (signal) => {
                const response = await fetch(`${api}/v1/xudu/search`, {
                  method: "POST",
                  signal,
                  headers: {
                    "Content-Type": "application/json",
                    "User-Agent": userAgent,
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ query: input.query }),
                })
                if (!response.ok) throw new Error(`xudu.ai web search: ${response.status}`)
                return Schema.decodeUnknownSync(SearchResponse)(await response.json())
              },
              catch: (cause) => cause,
            })
            return result.results.map((item) => {
              const published = item.published ? Date.parse(item.published) : NaN
              return {
                url: item.url,
                ...(item.title ? { title: item.title } : {}),
                ...(item.content ? { content: item.content } : {}),
                time: Number.isFinite(published) ? { published } : {},
              }
            })
          }),
      })
      editor.default.set("xudu")
    })
  }),
})
