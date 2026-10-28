import type { Xudu } from "./client.js"

export * from "./generated/index.js"
export { Xudu } from "./client.js"
export type {
  AgentApi,
  CommandApi,
  ConfigApi,
  EventApi,
  IntegrationApi,
  ModelApi,
  PluginApi,
  ProviderApi,
  ReferenceApi,
  RpcApi,
  RpcCallOptions,
  RpcClient,
  RpcEventPayload,
  WebSearchApi,
  SessionApi,
  SkillApi,
} from "./api.js"
export type { EventSubscribeOutput as XuduEvent } from "./generated/types.js"
export type {
  MediaFileAttachment as PromptMediaFileAttachment,
  Attachment as PromptAttachment,
} from "@xudu/schema/prompt"
export type XuduClient = ReturnType<typeof Xudu.make>
