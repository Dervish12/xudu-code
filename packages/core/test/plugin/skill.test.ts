import { describe, expect } from "bun:test"
import { AppNodeBuilder } from "@xudu/core/effect/app-node-builder"
import { Effect } from "effect"
import { SkillPlugin } from "@xudu/core/plugin/skill"
import { Skill } from "@xudu/core/skill"
import { testEffect } from "../lib/effect"
import { host } from "./host"

const it = testEffect(AppNodeBuilder.build(Skill.node))

describe("SkillPlugin.Plugin", () => {
  it.effect("registers the built-in skills", () =>
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
      const byId = (id: string) => skills.find((item) => String(item.id) === id)
      expect(skills.map((item) => String(item.id))).toEqual([
        "xudu-code",
        "oxu-sonra-redakte",
        "test-intizami",
        "dagidici-emr-ehtiyati",
        "konvensiya-uygunlugu",
        "artifact-design",
        "dataviz",
        "artifact-diagramming",
        "investigate",
        "kesfiyyat-tradecraft",
        "run",
        "code-review",
        "security-review",
        "spec",
        "kesfiyyat-arayis",
      ])
      expect(byId("xudu-code")).toEqual(
        expect.objectContaining({
          name: "xudu-code",
          description: expect.stringContaining("any question about xudu-code itself"),
          content: expect.stringContaining("xudu-code auth login"),
        }),
      )
      expect(byId("oxu-sonra-redakte")).toEqual(
        expect.objectContaining({
          name: "oxu-sonra-redakte",
          description: expect.stringContaining("has not been read in this session"),
          content: expect.stringContaining("Oxu, sonra redaktə et"),
        }),
      )
      expect(byId("artifact-design")).toEqual(
        expect.objectContaining({
          description: expect.stringContaining("artifact_publish"),
          content: expect.stringContaining("Şəbəkə sorğusu yoxdur"),
        }),
      )
      // artifact-design hands charts and diagrams on to their own skills.
      expect(byId("artifact-design")?.content).toContain("yazmazdan əvvəl **`dataviz`** skillini də yüklə")
      expect(byId("artifact-design")?.content).toContain("**`artifact-diagramming`** skillini yüklə")
      // The categorical palette is a validated contract: exact hexes, in this order.
      const palette = [
        ["1 mavi", "#2a78d6", "#3987e5"],
        ["2 narıncı", "#eb6834", "#d95926"],
        ["3 aqua", "#1baf7a", "#199e70"],
        ["4 sarı", "#eda100", "#c98500"],
        ["5 maqenta", "#e87ba4", "#d55181"],
        ["6 yaşıl", "#008300", "#008300"],
        ["7 bənövşəyi", "#6250d6", "#9085e9"],
        ["8 qırmızı", "#e34948", "#e66767"],
      ]
      const rows = (byId("dataviz")?.content ?? "").split("\n").filter((line) => /^\| [1-8] /.test(line))
      expect(rows).toEqual(palette.map(([slot, light, dark]) => `| ${slot} | \`${light}\` | \`${dark}\` |`))
      expect(byId("run")?.content).toContain("«Testlər keçdi» ilə «proqram işləyir» eyni şey deyil.")
      expect(byId("run")?.content).toContain("`< /dev/null`")
      expect(byId("code-review")?.content).toContain("## Verify Each Finding")
      expect(byId("code-review")?.content).toContain("Input: the scope the user named; if none, the uncommitted changes.")
      expect(byId("code-review")?.content).not.toContain("$ARGUMENTS")
      expect(byId("security-review")?.content).toContain("Yol qırılırsa")
      expect(byId("spec")?.content).toContain("ƏHATƏDƏN KƏNAR")
      expect(byId("kesfiyyat-arayis")?.content).toContain("QİYMƏTLƏNDİRMƏ ƏVVƏLDƏ (BLUF)")
      expect(byId("kesfiyyat-arayis")?.content).toContain("«HÖKM» sözü İŞLƏDİLMİR")
      expect(byId("kesfiyyat-arayis")?.content).toContain("Ehtimal ilə etibar iki AYRI şeydir")
      expect(byId("dataviz")?.content).toContain("**Bu dörd hex hər iki rejimdə eynidir:**")
      expect(byId("dataviz")?.content).toContain("**Mətn ən azı 11px görünsün**")
      expect(byId("artifact-diagramming")?.content).toContain("currentColor")
      expect(byId("investigate")?.content).toContain("KÖK SƏBƏB TAPILMADAN DÜZƏLİŞ YOXDUR")
      expect(byId("investigate")?.content).toContain("düzəliş **olmadan qırmızı**")
      expect(byId("kesfiyyat-tradecraft")?.description).toContain("«əminsən?»")
      expect(byId("kesfiyyat-tradecraft")?.content).toContain('s.toLocaleLowerCase("az").replace(/ı/g, "i")')
    }),
  )
})
