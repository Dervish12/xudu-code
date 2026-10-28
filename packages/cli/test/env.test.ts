import { expect, test } from "bun:test"
import { Env } from "../src/env"

test("session environment omits server credentials", () => {
  const previousPassword = process.env.XUDU_PASSWORD
  const previousLegacyPassword = process.env.XUDU_SERVER_PASSWORD
  const previousValue = process.env.XUDU_SESSION_ENV_TEST
  process.env.XUDU_PASSWORD = "password"
  process.env.XUDU_SERVER_PASSWORD = "legacy"
  process.env.XUDU_SESSION_ENV_TEST = "included"

  const environment = Env.session()

  if (previousPassword === undefined) delete process.env.XUDU_PASSWORD
  else process.env.XUDU_PASSWORD = previousPassword
  if (previousLegacyPassword === undefined) delete process.env.XUDU_SERVER_PASSWORD
  else process.env.XUDU_SERVER_PASSWORD = previousLegacyPassword
  if (previousValue === undefined) delete process.env.XUDU_SESSION_ENV_TEST
  else process.env.XUDU_SESSION_ENV_TEST = previousValue

  expect(environment.XUDU_PASSWORD).toBeUndefined()
  expect(environment.XUDU_SERVER_PASSWORD).toBeUndefined()
  expect(environment.XUDU_SESSION_ENV_TEST).toBe("included")
})
