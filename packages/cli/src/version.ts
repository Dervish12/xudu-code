import { Option, Schema } from "effect"

declare const XUDU_VERSION: string
declare const XUDU_CHANNEL: string
declare const XUDU_ARTIFACT: string
declare const XUDU_RELEASE_HIGHLIGHTS: string

const version = typeof XUDU_VERSION === "string" ? XUDU_VERSION : "local"
const channel = typeof XUDU_CHANNEL === "string" ? XUDU_CHANNEL : "local"
const artifact = typeof XUDU_ARTIFACT === "string" ? XUDU_ARTIFACT : "cli"
// Stable release builds embed the release notes' Highlights; every other build has none.
const highlights =
  typeof XUDU_RELEASE_HIGHLIGHTS === "string"
    ? Option.getOrElse(
        Schema.decodeUnknownOption(
          Schema.fromJsonString(Schema.Array(Schema.Struct({ title: Schema.String, body: Schema.String }))),
        )(XUDU_RELEASE_HIGHLIGHTS),
        () => [],
      )
    : []

export {
  version as XUDU_VERSION,
  channel as XUDU_CHANNEL,
  artifact as XUDU_ARTIFACT,
  highlights as XUDU_HIGHLIGHTS,
}
export const XUDU_LOCAL = channel === "local"
