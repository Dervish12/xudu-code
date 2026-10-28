import { Agent } from "@xudu/core/agent"
import { AISDK } from "@xudu/core/aisdk"
import { Command } from "@xudu/core/command"
import { Config } from "@xudu/core/config"
import { Credential } from "@xudu/core/credential"
import { Database } from "@xudu/core/database/database"
import { FileAccess } from "@xudu/core/file-access"
import { LayerNodePlatform } from "@xudu/util/effect/app-node-platform"
import { AppProcess } from "@xudu/util/process"
import { LayerNode } from "@xudu/util/effect/layer-node"
import { Bus } from "@xudu/core/bus"
import { FileSystem } from "@xudu/core/filesystem"
import { FSUtil } from "@xudu/util/fs-util"
import { Form } from "@xudu/core/form"
import { Generate } from "@xudu/core/generate"
import { Integration } from "@xudu/core/integration"
import { KV } from "@xudu/core/kv"
import { Location } from "@xudu/core/location"
import { Mcp } from "@xudu/core/mcp/index"
import { Model } from "@xudu/core/model"
import { Npm } from "@xudu/util/npm"
import { Plugin } from "@xudu/core/plugin"
import { PluginHooks } from "@xudu/core/plugin/hooks"
import { Provider } from "@xudu/core/provider"
import { Session } from "@xudu/core/session"
import { InstructionEntry } from "@xudu/core/session/instruction-entry"
import { PersistentPty } from "@xudu/core/persistent-pty"
import { LocationServiceMap } from "@xudu/core/location-service-map"
import { AppNodeBuilder } from "@xudu/core/effect/app-node-builder"
import { Permission } from "@xudu/core/permission"
import { Reference } from "@xudu/core/reference"
import { Rpc } from "@xudu/core/rpc"
import { Skill } from "@xudu/core/skill"
import { SkillDiscovery } from "@xudu/core/skill/discovery"
import { Watcher } from "@xudu/core/filesystem/watcher"
import { Tool } from "@xudu/core/tool"
import { Vcs } from "@xudu/core/vcs"
import { WebSearch } from "@xudu/core/websearch"
import { Worktree } from "@xudu/core/worktree"
import { WorktreeStrategies } from "@xudu/core/worktree/strategies"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"
import { emptyMcpLayer } from "../fixture/mcp"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: (name) => Effect.succeed({ directory: "", name }),
    resolve: (name) => Effect.succeed({ directory: "", name }),
    check: () => Effect.succeed(false),
    update: (name) => Effect.succeed({ directory: "", name }),
    which: () => Effect.undefined,
  }),
)

const generateLayer = Layer.succeed(
  Generate.Service,
  Generate.Service.of({
    text: () => Effect.succeed(""),
    image: () => Effect.die("unused"),
    decisions: () => Effect.die("unused"),
  }),
)

const configLayer = Config.testLayer()

const permissionLayer = Layer.succeed(
  Permission.Service,
  Permission.Service.of({
    close: Effect.void,
    ask: (input) => Effect.succeed({ id: input.id ?? Permission.ID.create(), effect: "ask" }),
    assert: () => Effect.void,
    assertNotDenied: () => Effect.void,
    reply: () => Effect.void,
    get: () => Effect.succeed(undefined),
    forSession: () => Effect.succeed([]),
    list: () => Effect.succeed([]),
  }),
)

export const makePluginTestLayer = (permission = permissionLayer) =>
  AppNodeBuilder.build(
    LayerNode.group([
      AppProcess.node,
      FileSystem.node,
      FSUtil.node,
      Location.node,
      Npm.node,
      Credential.node,
      Config.node,
      Database.node,
      FileAccess.node,
      Bus.node,
      Form.node,
      Generate.node,
      LayerNodePlatform.httpClient,
      Plugin.node,
      Agent.node,
      AISDK.node,
      Provider.node,
      Model.node,
      Command.node,
      Integration.node,
      KV.node,
      Mcp.node,
      Session.node,
      InstructionEntry.node,
      PersistentPty.node,
      LocationServiceMap.node,
      Permission.node,
      PluginHooks.node,
      Reference.node,
      Rpc.node,
      Skill.node,
      SkillDiscovery.node,
      Tool.node,
      Vcs.node,
      Watcher.node,
      WebSearch.node,
      Worktree.node,
      WorktreeStrategies.node,
    ]),
    [
      Location.node.replace(tempLocationLayer),
      Npm.node.replace(npmLayer),
      Config.node.replace(configLayer),
      Mcp.node.replace(emptyMcpLayer),
      Generate.node.replace(generateLayer),
      Permission.node.replace(permission),
    ],
  ).pipe(Layer.provideMerge(configLayer))

export const PluginTestLayer = makePluginTestLayer()
