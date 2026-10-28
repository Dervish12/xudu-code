import { Plugin } from "@xudu/plugin/tui"
import { createMermaidCodeBlockRenderer } from "./markdown.js"
import { resolveXuduDiagramPalette } from "./palette.js"

export default Plugin.define({
  id: "xudu.merman",
  setup(context) {
    context.markdown.registerCodeBlockRenderer(
      "mermaid",
      createMermaidCodeBlockRenderer(context.renderer, () => ({
        colors: resolveXuduDiagramPalette(context.theme, context.themeMode),
      })),
    )
  },
})
