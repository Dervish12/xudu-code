import { expect, test } from "bun:test"
import { ServerAuth } from "@xudu/server/auth"
import { Option, Redacted } from "effect"

test("accepts only the fixed xudu username", () => {
  const config = { password: Option.some("secret"), username: "xudu" }
  expect(ServerAuth.authorized({ username: "xudu", password: Redacted.make("secret") }, config)).toBe(true)
  expect(ServerAuth.authorized({ username: "custom", password: Redacted.make("secret") }, config)).toBe(false)
})

test("rejects wrong passwords, including prefixes and extensions of the right one", () => {
  const config = { password: Option.some("secret"), username: "xudu" }
  for (const attempt of ["", "secre", "secretx", "Secret", "secret "])
    expect(ServerAuth.authorized({ username: "xudu", password: Redacted.make(attempt) }, config)).toBe(false)
  expect(ServerAuth.authorized({ username: "xudu", password: Redacted.make("secret") }, { ...config, password: Option.none() })).toBe(false)
})
