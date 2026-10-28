// TODO: Keep additional network capabilities inside Schema and Protocol as the client grows; /effect must never import
// Core or Server. Preserve these datatype exports so internal model reorganizations do not require caller migrations.
import type { Effect } from "effect"
import type { Xudu } from "./client.js"

export * from "./generated/index"
export { Xudu } from "./client.js"
export type {
  AgentApi,
  AppApi,
  CommandApi,
  ConfigApi,
  EventApi,
  IntegrationApi,
  ModelApi,
  PluginApi,
  ProviderApi,
  ReferenceApi,
  RpcApi,
  RpcClient,
  WebSearchApi,
  SessionApi,
  SkillApi,
} from "./api.js"
export { Agent } from "@xudu/schema/agent"
export { Command } from "@xudu/schema/command"
export { Config } from "@xudu/schema/config"
export { Credential } from "@xudu/schema/credential"
export { Event } from "@xudu/schema/event"
export { EventLog } from "@xudu/schema/event-log"
export { FileSystem } from "@xudu/schema/filesystem"
export { Form } from "@xudu/schema/form"
export { Integration } from "@xudu/schema/integration"
export { Location } from "@xudu/schema/location"
export { Model } from "@xudu/schema/model"
export { Permission } from "@xudu/schema/permission"
export { PermissionSaved } from "@xudu/schema/permission-saved"
export { Project } from "@xudu/schema/project"
export { Worktree } from "@xudu/schema/worktree"
export { Vcs } from "@xudu/schema/vcs"
export { Provider } from "@xudu/schema/provider"
export { Pty } from "@xudu/schema/pty"
export { Question } from "@xudu/schema/question"
export { Reference } from "@xudu/schema/reference"
export { WebSearch } from "@xudu/schema/websearch"
export { AbsolutePath, RelativePath } from "@xudu/schema/schema"
export { Session } from "@xudu/schema/session"
export { SessionInbox } from "@xudu/schema/session-inbox"
export { SessionMessage } from "@xudu/schema/session-message"
export { Skill } from "@xudu/schema/skill"
export { Prompt } from "@xudu/schema/prompt"
export { PromptInput } from "@xudu/schema/prompt-input"
export type { XuduEvent } from "@xudu/protocol/groups/event"
export type XuduClient = Effect.Success<ReturnType<typeof Xudu.make>>
