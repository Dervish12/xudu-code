/** @jsxImportSource @opentui/solid */
import { testRender } from "@opentui/solid"
import { expect, test } from "bun:test"
import { resolveThemeDocument } from "@xudu/theme/tui"
import { ConfigProvider, useConfig, type Info } from "../../src/config"
import { ThemeProvider, useTheme, useThemes } from "../../src/context/theme"
import { getClassic2Theme, getXuduTheme } from "../../src/theme"
import { emptyThemeSource, tmpdir } from "../fixture/fixture"
import { TestTuiContexts } from "../fixture/tui-environment"
import { createTuiResolvedConfig } from "../fixture/tui-runtime"

test("offers xudu2 only while the new designs experiment is enabled", async () => {
  await using temporary = await tmpdir()
  const settings: Info = {}
  let config!: ReturnType<typeof useConfig>
  let themes!: ReturnType<typeof useThemes>
  let theme!: ReturnType<typeof useTheme>
  function Probe() {
    config = useConfig()
    themes = useThemes()
    theme = useTheme()
    return null
  }
  const app = await testRender(() => (
    <TestTuiContexts paths={{ state: temporary.path }}>
      <ConfigProvider
        config={createTuiResolvedConfig(settings)}
        service={{
          get: async () => settings,
          update: async (update) => {
            update(settings)
            return settings
          },
        }}
      >
        <ThemeProvider mode="dark" source={emptyThemeSource}>
          <Probe />
        </ThemeProvider>
      </ConfigProvider>
    </TestTuiContexts>
  ))

  try {
    app.renderer.start()
    await app.waitForFrame(() => themes !== undefined)
    expect(themes.has("classic2")).toBeFalse()
    expect(Object.keys(themes.all())).not.toContain("classic2")
    expect(themes.set("classic2")).toBeFalse()

    await config.update((draft) => {
      draft.experimental = { "new-designs": true }
    })
    expect(themes.has("classic2")).toBeTrue()
    expect(themes.set("classic2")).toBeTrue()
    expect(theme.background.base.equals(resolveThemeDocument(getClassic2Theme(), "dark").background.base)).toBeTrue()

    await config.update((draft) => {
      draft.experimental = { "new-designs": false }
    })
    expect(themes.has("classic2")).toBeFalse()
    expect(theme.background.base.equals(resolveThemeDocument(getXuduTheme(), "dark").background.base)).toBeTrue()
    expect(themes.selected).toBe("classic2")
    expect(settings.theme?.name).toBe("classic2")
  } finally {
    app.renderer.destroy()
  }
})
