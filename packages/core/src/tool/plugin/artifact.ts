export * as ArtifactTool from "./artifact.js"

import type { Context } from "@xudu/plugin/effect/plugin"
import { ToolFailure } from "@xudu/ai/effect"
import { Effect, Schema } from "effect"
import { createHash } from "crypto"
import { readFile } from "fs/promises"
import { basename } from "path"
import { FileAccess } from "../../file-access.js"
import { Permission } from "../../permission.js"
import { api, integrationID } from "../../plugin/provider/xudu.js"

export const name = "artifact_publish"
export const MAX_BYTES = 2 * 1024 * 1024
// Cloudflare in front of api.xudu.ai rejects bare library user agents.
const userAgent = "Mozilla/5.0 (xudu-code)"

export const description = `Publish a self-contained HTML page as a xudu.ai artifact and get a link to it.

Before writing the HTML file, load the \`artifact-design\` skill and follow it: it holds the page contract (title, light and dark theme tokens, phone width, allowed CDNs, no network calls from the page). A page written without it may render broken, because the published page runs under a strict sandbox.

Write the page to a local .html file first, then call this tool with that file's path. Publishing the same path again updates the same artifact and keeps its link. Artifacts are private by default: only their owner sees them in the gallery at https://xudu.ai/artifacts, and the link works for anyone it is shared with.

Use it when a page would be clearer than terminal text, such as a report, comparison, dashboard or small tool, or when the user asks for a page to view or share.`

export const Input = Schema.Struct({
  path: Schema.String.annotate({ description: "Path of the local .html file to publish." }),
  title: Schema.optionalKey(Schema.String).annotate({
    description: "Artifact name. Omit to use the page's <title>.",
  }),
})

const Output = Schema.Struct({
  id: Schema.String,
  url: Schema.String,
  updated: Schema.Boolean.annotate({ description: "True when an existing artifact was replaced." }),
})

const Response = Schema.Struct({ id: Schema.String, url: Schema.String, updated: Schema.Boolean })

/** The text of the page's <title>, or undefined when it has none. */
export function extractTitle(html: string) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  const title = match?.[1]?.replace(/\s+/g, " ").trim()
  return title ? title : undefined
}

/** Why this file cannot be published, or undefined when it can. */
export function invalidReason(html: string) {
  if (!html.trim()) return "the file is empty"
  if (!/<[a-z!]/i.test(html)) return "the file is not HTML"
  const bytes = Buffer.byteLength(html, "utf8")
  if (bytes > MAX_BYTES) return `the file is ${bytes} bytes; the limit is ${MAX_BYTES}`
  return undefined
}

/** Stable per-file key, so publishing the same file again updates the same artifact. */
export function artifactKey(absolute: string) {
  return createHash("sha256").update(absolute).digest("hex")
}

export const Plugin = {
  id: "xudu.tool.artifact",
  effect: Effect.fn("ArtifactTool.Plugin")(function* (ctx: Context) {
    const access = yield* FileAccess.Service
    const permission = yield* Permission.Service

    yield* ctx.tool
      .transform((editor) =>
        editor.add({
          name,
          options: { codemode: false },
          description,
          input: Input,
          output: Output,
          execute: (input, context) =>
            Effect.gen(function* () {
              const target = yield* access.authorizeRead(input.path, context)
              const html = yield* Effect.tryPromise({
                try: () => readFile(target.absolute, "utf8"),
                catch: (cause) => new ToolFailure({ message: `Unable to read ${input.path}`, error: cause }),
              })
              const reason = invalidReason(html)
              if (reason) return yield* new ToolFailure({ message: `Cannot publish ${input.path}: ${reason}.` })
              const title = input.title?.trim() || extractTitle(html) || basename(target.absolute)
              // Publishing makes the page reachable by link, so it needs the same approval as other outward actions.
              yield* permission.assert({
                action: name,
                resources: [target.resource],
                save: ["*"],
                metadata: { path: input.path, title },
                sessionID: context.sessionID,
                agent: context.agent,
                source: { type: "tool", messageID: context.messageID, id: context.id },
              })
              const connection = yield* ctx.integration.connection.active(integrationID)
              const credential = connection ? yield* ctx.integration.connection.resolve(connection) : undefined
              const token =
                credential?.type === "oauth" ? credential.access : credential?.type === "key" ? credential.key : undefined
              if (!token)
                return yield* new ToolFailure({ message: "xudu.ai hesabına daxil olmamısan: xudu-code auth login" })
              const result = yield* Effect.tryPromise({
                try: async (signal) => {
                  const response = await fetch(`${api}/v1/xudu/artifacts`, {
                    method: "POST",
                    signal,
                    headers: {
                      "Content-Type": "application/json",
                      "User-Agent": userAgent,
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ key: artifactKey(target.absolute), title, html }),
                  })
                  if (!response.ok) {
                    const body = (await response.json().catch(() => undefined)) as { error?: string } | undefined
                    throw new Error(body?.error ?? `xudu.ai artifact: HTTP ${response.status}`)
                  }
                  return Schema.decodeUnknownSync(Response)(await response.json())
                },
                catch: (cause) =>
                  new ToolFailure({
                    message: cause instanceof Error ? cause.message : `Unable to publish ${input.path}`,
                    error: cause,
                  }),
              })
              return {
                output: result,
                content: `${result.updated ? "Updated" : "Published"} "${title}": ${result.url}`,
              }
            }).pipe(
              Effect.mapError((error) =>
                error instanceof ToolFailure
                  ? error
                  : new ToolFailure({ message: `Unable to publish ${input.path}`, error }),
              ),
            ),
        }),
      )
      .pipe(Effect.orDie)
  }),
}
