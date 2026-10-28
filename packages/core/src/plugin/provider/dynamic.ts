import { Effect } from "effect"
import { define } from "@xudu/plugin/effect/plugin"
import { Npm } from "@xudu/util/npm"
import { loadSDKFactory } from "./sdk-factory.js"

export const DynamicProviderPlugin = define({
  id: "xudu.provider.dynamic",
  effect: Effect.fn(function* (ctx) {
    const npm = yield* Npm.Service
    yield* ctx.aisdk.hook(
      "sdk",
      Effect.fn(function* (evt) {
        if (evt.sdk) return

        evt.sdk = ((yield* loadSDKFactory(npm, evt.package)) as (options: any) => any)(evt.options)
      }),
    )
  }),
})
