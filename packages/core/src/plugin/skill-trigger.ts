export * as SkillTriggerPlugin from "./skill-trigger.js"

import { Message } from "@xudu/ai/effect"
import type { Context } from "@xudu/plugin/effect/plugin"
import { FSUtil } from "@xudu/util/fs-util"
import { Effect } from "effect"
import { Permission } from "../permission.js"
import { Skill } from "../skill.js"

// A local model does not reliably load a skill from its description alone (measured: 0 of 2 trigger prompts). For
// the few moments where skipping a skill does real harm, the harness detects the moment itself and puts the skill's
// content into the conversation, the same way a user-invoked skill arrives. The model makes no decision.

/** Case- and dotless-i-insensitive form, so «ƏMİNSƏN», «Əminsən» and ASCII «eminsen» compare equal. */
export const fold = (text: string) => text.toLocaleLowerCase("az").replace(/ı/g, "i")

// «əminsən?», «əminik?», «eminsiz?», «əminsən ki ...», «are you sure?»
const DOUBT = /(?<![\p{L}])(?:[əe]min(?:s[əe]n|siz|ik)\s*\?|[əe]min(?:s[əe]n|siz)\s+ki(?![\p{L}])|are you sure)/u

const EXIT = /Exited with code [1-9]\d*|exit(?: code)?[=: ]+[1-9]\d*/i
// Unambiguous on their own: the model often runs `cmd; echo "exit=$?"`, which hides the exit code.
const STRONG =
  /(?<![\p{L}])(?:assertion ?error|assert(?:ion)? failed|traceback \(most recent call last\)|panicked at|[1-9]\d* (?:fail(?:ed|ing|ures?)?|errors?))(?![\p{L}])|[✗✘]/u
// Need a non-zero exit too: «failover», «0 fail» and logs that merely mention failure are not failures.
const WEAK = /(?<![\p{L}])(?:fail(?:ed|ing|ure)?|error)(?![\p{L}])/u

export type Trigger = { readonly skill: string; readonly reason: string }

const REMINDER = "<system-reminder>"
const isHarnessText = (text: string) => text.startsWith(REMINDER) || text.startsWith("<skill_content")

const textOf = (part: Message["content"][number]): string => {
  if (part.type === "text") return part.text
  if (part.type !== "tool-result") return ""
  const result = part.result
  if (result.type === "content") return result.value.map((item) => (item.type === "text" ? item.text : "")).join("\n")
  if (result.type === "error") return ""
  return typeof result.value === "string" ? result.value : (JSON.stringify(result.value) ?? "")
}

const loaded = (messages: ReadonlyArray<Message>, skill: string) =>
  messages.some((message) =>
    message.content.some(
      (part) =>
        (part.type === "tool-call" && part.name === "skill" && (part.input as { id?: unknown } | undefined)?.id === skill) ||
        (part.type === "text" && part.text.includes(`<skill_content name="${skill}">`)) ||
        (part.type === "tool-result" && part.name === "skill" && textOf(part).includes(`<skill_content name="${skill}">`)),
    ),
  )

/** The skill the harness should load before this request, or undefined. */
export function detect(messages: ReadonlyArray<Message>): Trigger | undefined {
  const last = messages.findLastIndex(
    (message) =>
      message.role === "user" && message.content.some((part) => part.type === "text" && !isHarnessText(part.text)),
  )
  if (last === -1) return undefined
  const prompt = messages[last]!.content.map(textOf).filter((text) => !isHarnessText(text)).join("\n")
  const candidates: Trigger[] = []
  if (DOUBT.test(fold(prompt)))
    candidates.push({ skill: "kesfiyyat-tradecraft", reason: "the user is asking whether you are sure" })
  const failed = messages
    .slice(last + 1)
    .some((message) =>
      message.content.some(
        (part) =>
          part.type === "tool-result" &&
          part.name === "shell" &&
          (STRONG.test(fold(textOf(part))) || (EXIT.test(textOf(part)) && WEAK.test(fold(textOf(part))))),
      ),
    )
  if (failed) candidates.push({ skill: "investigate", reason: "a command failed with a test or runtime error" })
  return candidates.find((candidate) => !loaded(messages, candidate.skill))
}

export const reminder = (trigger: Trigger, content: string) =>
  [
    REMINDER,
    `The harness loaded the \`${trigger.skill}\` skill because ${trigger.reason}. Follow it now; do not call the skill tool for it again.`,
    "</system-reminder>",
    content,
  ].join("\n")

export const Plugin = {
  id: "xudu.skill.trigger",
  effect: Effect.fn("SkillTriggerPlugin")(function* (ctx: Context) {
    const fs = yield* FSUtil.Service
    const skills = yield* Skill.Service
    const permission = yield* Permission.Service
    yield* ctx.session.hook("context", (event) =>
      Effect.gen(function* () {
        const trigger = detect(event.messages)
        if (!trigger) return
        const skill = yield* skills.get(Skill.ID.make(trigger.skill))
        if (!skill) return
        // An explicit deny rule for this skill still wins; loading it never asks the user.
        yield* permission.assertNotDenied({ sessionID: event.sessionID, agent: event.agent, action: "skill", resources: [skill.id] })
        const text = reminder(trigger, (yield* Skill.prepare(fs, skill)).output)
        // At the tail, so the cached prefix stays warm.
        event.messages.push(Message.user(text))
        yield* ctx.session.synthetic({ sessionID: event.sessionID, text, resume: false })
      }).pipe(Effect.catchCause((cause) => Effect.logWarning("skill trigger skipped", { sessionID: event.sessionID, cause }))),
    )
  }),
}
