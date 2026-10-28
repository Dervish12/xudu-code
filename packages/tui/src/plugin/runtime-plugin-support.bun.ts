import { ensurePluginRuntime, provides } from "@xudu/plugin/runtime"
import { Plugin, PluginContextProvider, usePlugin } from "@xudu/plugin/tui"
import { ensureRuntimePluginSupport } from "@opentui/solid/runtime-plugin-support/configure"

ensurePluginRuntime()
ensureRuntimePluginSupport({
  additional: {
    "@xudu/plugin/tui": { Plugin, PluginContextProvider, usePlugin },
  },
  preserve: provides,
})
