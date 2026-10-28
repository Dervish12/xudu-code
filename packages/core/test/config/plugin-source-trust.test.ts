import path from "path"
import fs from "fs/promises"
import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { Config } from "@xudu/core/config"
import { ConfigPluginSource } from "@xudu/core/config/plugin/source"
import { AppNodeBuilder } from "@xudu/core/effect/app-node-builder"
import { Watcher } from "@xudu/core/filesystem/watcher"
import { Location } from "@xudu/core/location"
import { AbsolutePath } from "@xudu/core/schema"
import { Directory } from "@xudu/schema/config"
import { LayerNode } from "@xudu/util/effect/layer-node"
import { FSUtil } from "@xudu/util/fs-util"
import { location } from "../fixture/location"
import { tmpdirScoped } from "../fixture/tmpdir"
import { testEffect } from "../lib/effect"

const it = testEffect(Layer.empty)

describe("ConfigPluginSource and workspace trust", () => {
  it.live("discovers plugins only in trusted folders", () =>
    Effect.gen(function* () {
      const tmp = yield* tmpdirScoped()
      const trusted = path.join(tmp.path, "trusted", ".xudu-code")
      const untrusted = path.join(tmp.path, "untrusted", ".xudu-code")
      yield* Effect.promise(async () => {
        for (const root of [trusted, untrusted]) {
          await fs.mkdir(path.join(root, "plugins"), { recursive: true })
          await fs.writeFile(path.join(root, "plugins", "tool.ts"), "export default {}")
        }
      })
      const directory = AbsolutePath.make(tmp.path)
      const operations = yield* Effect.scoped(
        Effect.flatMap(ConfigPluginSource.Service, (source) => source.operations()),
      ).pipe(
        Effect.provide(
          AppNodeBuilder.build(LayerNode.group([ConfigPluginSource.node, FSUtil.node]), [
            Config.node.replace(
              Config.testLayer([
                new Directory({ type: "directory", path: AbsolutePath.make(trusted) }),
                new Directory({ type: "directory", path: AbsolutePath.make(untrusted), untrusted: true }),
              ]),
            ),
            Location.node.replace(Layer.succeed(Location.Service, Location.Service.of(location({ directory })))),
            Watcher.node.replace(Watcher.testLayer),
          ]),
        ),
      )
      const targets = operations.flatMap((operation) => (operation.type === "add" ? [operation.target] : []))
      expect(targets).toEqual([path.join(trusted, "plugins", "tool.ts")])
    }),
  )
})
