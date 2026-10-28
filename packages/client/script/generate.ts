import { NodeFileSystem } from "@effect/platform-node"
import { compile, emitEffectImported, emitEffectShape, emitPromise, write } from "@xudu/httpapi-codegen"
import { ClientApi, effectOmitEndpoints, groupNames, promiseOmitEndpoints } from "@xudu/protocol/client"
import { Agent } from "@xudu/schema/agent"
import { Command } from "@xudu/schema/command"
import { Config } from "@xudu/schema/config"
import { Credential } from "@xudu/schema/credential"
import { Event } from "@xudu/schema/event"
import { EventLog } from "@xudu/schema/event-log"
import { FileDiff } from "@xudu/schema/file-diff"
import { FileSystem } from "@xudu/schema/filesystem"
import { Form } from "@xudu/schema/form"
import { Generate } from "@xudu/schema/generate"
import { Instruction } from "@xudu/schema/instruction"
import { InstructionEntry } from "@xudu/schema/instruction-entry"
import { Integration } from "@xudu/schema/integration"
import { Location } from "@xudu/schema/location"
import { Mcp } from "@xudu/schema/mcp"
import { Model } from "@xudu/schema/model"
import { Money } from "@xudu/schema/money"
import { Permission } from "@xudu/schema/permission"
import { PermissionSaved } from "@xudu/schema/permission-saved"
import { Plugin } from "@xudu/schema/plugin"
import { Project } from "@xudu/schema/project"
import { Worktree } from "@xudu/schema/worktree"
import { AgentAttachment, FileAttachment, Prompt, PromptMention } from "@xudu/schema/prompt"
import { PromptInput } from "@xudu/schema/prompt-input"
import { Provider } from "@xudu/schema/provider"
import { Pty } from "@xudu/schema/pty"
import { PtyTicket } from "@xudu/schema/pty-ticket"
import { Question } from "@xudu/schema/question"
import { Reference } from "@xudu/schema/reference"
import { AbsolutePath, RelativePath } from "@xudu/schema/schema"
import { Session } from "@xudu/schema/session"
import { SessionMessage } from "@xudu/schema/session-message"
import { SessionInbox } from "@xudu/schema/session-inbox"
import { Shell } from "@xudu/schema/shell"
import { Skill } from "@xudu/schema/skill"
import { Snapshot } from "@xudu/schema/snapshot"
import { Vcs } from "@xudu/schema/vcs"
import { WebSearch } from "@xudu/schema/websearch"
import { Workspace } from "@xudu/schema/workspace"
import { Effect, Schema } from "effect"
import { fileURLToPath } from "url"

const promiseContract = compile(ClientApi, { groupNames, omitEndpoints: promiseOmitEndpoints })
const effectContract = compile(ClientApi, { groupNames, omitEndpoints: effectOmitEndpoints })
const effectTypeReferences = [
  ...namespaceTypes("Agent", "@xudu/schema/agent", Agent),
  ...namespaceTypes("Command", "@xudu/schema/command", Command),
  ...namespaceTypes("Config", "@xudu/schema/config", Config),
  ...namespaceTypes("Credential", "@xudu/schema/credential", Credential),
  ...namespaceTypes("Event", "@xudu/schema/event", Event),
  ...namespaceTypes("EventLog", "@xudu/schema/event-log", EventLog),
  ...namespaceTypes("FileDiff", "@xudu/schema/file-diff", FileDiff),
  ...namespaceTypes("FileSystem", "@xudu/schema/filesystem", FileSystem),
  ...namespaceTypes("Form", "@xudu/schema/form", Form),
  ...namespaceTypes("Generate", "@xudu/schema/generate", Generate),
  ...namespaceTypes("Instruction", "@xudu/schema/instruction", Instruction),
  ...namespaceTypes("InstructionEntry", "@xudu/schema/instruction-entry", InstructionEntry),
  ...namespaceTypes("Integration", "@xudu/schema/integration", Integration),
  typeReference("Location.PublicRef", "@xudu/schema/location", Location.PublicRef),
  typeReference("Location.PublicInfo", "@xudu/schema/location", Location.PublicInfo),
  ...namespaceTypes("Mcp", "@xudu/schema/mcp", Mcp),
  ...namespaceTypes("Model", "@xudu/schema/model", Model),
  ...namespaceTypes("Money", "@xudu/schema/money", Money),
  ...namespaceTypes("Permission", "@xudu/schema/permission", Permission),
  ...namespaceTypes("PermissionSaved", "@xudu/schema/permission-saved", PermissionSaved),
  ...namespaceTypes("Plugin", "@xudu/schema/plugin", Plugin),
  ...namespaceTypes("Project", "@xudu/schema/project", Project),
  ...namespaceTypes("Worktree", "@xudu/schema/worktree", Worktree),
  ...namespaceTypes("PromptInput", "@xudu/schema/prompt-input", PromptInput),
  ...namespaceTypes("Provider", "@xudu/schema/provider", Provider),
  ...namespaceTypes("Pty", "@xudu/schema/pty", Pty),
  ...namespaceTypes("PtyTicket", "@xudu/schema/pty-ticket", PtyTicket),
  ...namespaceTypes("Question", "@xudu/schema/question", Question),
  ...namespaceTypes("Reference", "@xudu/schema/reference", Reference),
  ...namespaceTypes("Session", "@xudu/schema/session", Session),
  ...namespaceTypes("SessionMessage", "@xudu/schema/session-message", SessionMessage),
  ...namespaceTypes("SessionInbox", "@xudu/schema/session-inbox", SessionInbox),
  ...namespaceTypes("Shell", "@xudu/schema/shell", Shell),
  ...namespaceTypes("Skill", "@xudu/schema/skill", Skill),
  ...namespaceTypes("Snapshot", "@xudu/schema/snapshot", Snapshot),
  ...namespaceTypes("Vcs", "@xudu/schema/vcs", Vcs),
  ...namespaceTypes("WebSearch", "@xudu/schema/websearch", WebSearch),
  ...namespaceTypes("Workspace", "@xudu/schema/workspace", Workspace),
  typeReference("Prompt", "@xudu/schema/prompt", Prompt),
  typeReference("PromptMention", "@xudu/schema/prompt", PromptMention),
  typeReference("FileAttachment", "@xudu/schema/prompt", FileAttachment),
  typeReference("AgentAttachment", "@xudu/schema/prompt", AgentAttachment),
  typeReference("AbsolutePath", "@xudu/schema/schema", AbsolutePath),
  typeReference("RelativePath", "@xudu/schema/schema", RelativePath),
]

await Effect.runPromise(
  Effect.all(
    [
      write(
        emitPromise(promiseContract, {
          mutableOutputs: true,
        }),
        fileURLToPath(new URL("../src/promise/generated", import.meta.url)),
      ),
      write(
        emitEffectImported(effectContract, {
          module: "../../contract",
          api: "ClientApi",
          shapeModule: "../api/api.js",
        }),
        fileURLToPath(new URL("../src/effect/generated", import.meta.url)),
      ),
      write(
        emitEffectShape(effectContract, {
          typeReferences: effectTypeReferences,
          outputTypes: {
            "event.subscribe": {
              name: "XuduEvent",
              import: 'import type { XuduEvent } from "@xudu/protocol/groups/event"',
            },
          },
        }),
        fileURLToPath(new URL("../src/effect/api", import.meta.url)),
      ),
    ],
    { concurrency: 3, discard: true },
  ).pipe(Effect.provide(NodeFileSystem.layer)),
)

function namespaceTypes(namespace: string, module: string, values: object) {
  return Object.entries(values).flatMap(([name, schema]) =>
    Schema.isSchema(schema) ? [typeReference(`${namespace}.${name}`, module, schema)] : [],
  )
}

function typeReference(name: string, module: string, schema: Schema.Top) {
  return {
    schema,
    name,
    import: `import type { ${name.split(".")[0]} } from ${JSON.stringify(module)}`,
  }
}
