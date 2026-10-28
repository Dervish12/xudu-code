import { describe, expect } from "bun:test"
import { AppNodeBuilder } from "@xudu/core/effect/app-node-builder"
import { Effect } from "effect"
import { SkillPlugin } from "@xudu/core/plugin/skill"
import { Skill } from "@xudu/core/skill"
import { testEffect } from "../lib/effect"
import { host } from "./host"

const it = testEffect(AppNodeBuilder.build(Skill.node))

describe("SkillPlugin.Plugin", () => {
  it.effect("registers the built-in xudu-code skill only", () =>
    Effect.gen(function* () {
      const skill = yield* Skill.Service
      yield* SkillPlugin.Plugin.effect(
        host({
          skill: {
            list: () => Effect.die("unused skill.list"),
            transform: skill.transform,
            reload: skill.reload,
          },
        }),
      )
      const skills = yield* skill.list()
      expect(skills.map((item) => String(item.id))).toEqual(["xudu-code"])
      expect(skills[0]).toEqual(
        expect.objectContaining({
          name: "xudu-code",
          description: expect.stringContaining("any question about xudu-code itself"),
          content: expect.stringContaining("xudu-code auth login"),
        }),
      )
    }),
  )
})
