export * as ServerAuth from "./auth"

import { Context, Layer, Option, Redacted } from "effect"
import { createHash, timingSafeEqual } from "node:crypto"

export type DecodedCredentials = {
  readonly username: string
  readonly password: Redacted.Redacted
}

export type Info = {
  readonly password: Option.Option<string>
  readonly username: string
}

export class Config extends Context.Service<Config, Info>()("@xudu/ServerAuthConfig") {
  static configLayer(input: Pick<Info, "password">) {
    return Layer.succeed(this, this.of({ ...input, username: "xudu" }))
  }

  static get layer() {
    return this.configLayer({ password: Option.none() })
  }
}

export function required(config: Info) {
  return Option.isSome(config.password) && config.password.value !== ""
}

// Constant-time comparison of SHA-256 digests, so a wrong password reveals nothing about the right one through timing.
export function authorized(credentials: DecodedCredentials, config: Info) {
  if (Option.isNone(config.password) || credentials.username !== config.username) return false
  const digest = (value: string) => createHash("sha256").update(value).digest()
  return timingSafeEqual(digest(Redacted.value(credentials.password)), digest(config.password.value))
}
