import { expect, test } from "bun:test"
import { selectTheme, selectThemeMode, supportsThemeMode, themeModes } from "@xudu/theme/tui"
import { getClassicTheme } from "../../../src/theme"

test("selects complete light and dark themes independently", () => {
  const light = selectTheme(getClassicTheme(), "light")
  const dark = selectTheme(getClassicTheme(), "dark")
  expect(selectTheme(getClassicTheme())).toEqual(light)
  expect(light.hue).toEqual(getClassicTheme().light.hue)
  expect(dark.text).toEqual(getClassicTheme().base.text)
  expect(dark.hue).toEqual(getClassicTheme().dark.hue)
  expect(selectThemeMode(getClassicTheme(), "dark")).toEqual({ theme: dark, mode: "dark" })
})

test("selects the available mode when the requested mode is missing", () => {
  const lightOnly = { base: getClassicTheme().base, light: getClassicTheme().light } as const
  const darkOnly = { base: getClassicTheme().base, dark: getClassicTheme().dark } as const

  expect(themeModes(lightOnly)).toEqual(["light"])
  expect(themeModes(darkOnly)).toEqual(["dark"])
  expect(supportsThemeMode(lightOnly, "light")).toBeTrue()
  expect(supportsThemeMode(lightOnly, "dark")).toBeFalse()
  expect(selectThemeMode(lightOnly, "dark")).toEqual({ theme: selectTheme(getClassicTheme(), "light"), mode: "light" })
  expect(selectThemeMode(darkOnly, "light")).toEqual({ theme: selectTheme(getClassicTheme(), "dark"), mode: "dark" })
})
