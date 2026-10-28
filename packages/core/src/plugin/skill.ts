/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill.js"

import { define } from "@xudu/plugin/effect/plugin"
import { Effect } from "effect"
import { AbsolutePath } from "../schema.js"
import { Skill } from "../skill.js"
import xuduContent from "./skill/xudu-code.md" with { type: "text" }

export const XuduContent = xuduContent

export const XuduDescription =
  "Use this skill for any question about xudu-code itself: signing in with xudu.ai, plans and daily limits, configuration (xudu-code.json, .xudu-code/), instruction files (XUDU.md, AGENTS.md, CLAUDE.md), skills, agents, commands, permissions, MCP servers, themes, keybinds, the CLI and TUI, the background service, upgrading, and troubleshooting."

export const Plugin = define({
  id: "xudu.skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((editor) => {
      editor.add(
        Skill.Info.make({
          id: Skill.ID.make("xudu-code"),
          name: Skill.Name.make("xudu-code"),
          description: XuduDescription,
          path: AbsolutePath.make("/builtin/xudu-code.md"),
          content: XuduContent,
        }),
      )
    })
  }),
})
