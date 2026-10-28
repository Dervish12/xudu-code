import type { FileSystem } from "@xudu/core/filesystem"
import { Bus } from "@xudu/core/bus"
import { Image } from "@xudu/core/image"
import { LocationServiceMap } from "@xudu/core/location-service-map"
import type { LocationServices } from "@xudu/core/location-services"
import { Plugin } from "@xudu/core/plugin"
import { PluginHooks } from "@xudu/core/plugin/hooks"
import { Skill } from "@xudu/core/skill"
import type { Location } from "@xudu/schema/location"
import { makeGlobalNode } from "@xudu/util/effect/app-node"
import { LayerNode } from "@xudu/util/effect/layer-node"
import { Effect, Layer, LayerMap } from "effect"

// Plain-prompt unit fixtures use virtual directories.
export const promptLocationNode = makeGlobalNode({
  service: LocationServiceMap.Service,
  layer: Layer.effect(
    LocationServiceMap.Service,
    Effect.gen(function* () {
      const bus = yield* Bus.Service
      return yield* LayerMap.make(
        (_ref: Location.Ref) =>
          LayerNode.compile(LayerNode.group([PluginHooks.node, Image.node, Skill.node, Plugin.node]), {
            replacements: [
              Bus.node.replace(Layer.succeed(Bus.Service, bus)),
              Plugin.node.replace(Layer.mock(Plugin.Service, { awaitActivation: Effect.void })),
            ],
          }) as unknown as Layer.Layer<LocationServices, FileSystem.DirectoryNotFoundError>,
      )
    }),
  ),
  deps: [Bus.node],
})
