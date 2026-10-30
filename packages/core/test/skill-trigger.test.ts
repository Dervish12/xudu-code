import { describe, expect, test } from "bun:test"
import { Message, ToolCallPart, ToolResultPart } from "@xudu/ai/effect"
import { SkillTriggerPlugin } from "@xudu/core/plugin/skill-trigger"

const { detect, fold, reminder } = SkillTriggerPlugin

const user = (text: string) => Message.user(text)
const shell = (text: string) => Message.tool(ToolResultPart.make({ id: "c1", name: "shell", result: text }))
const loadedVia = (skill: string) => [
  Message.assistant([ToolCallPart.make({ id: "s1", name: "skill", input: { id: skill } })]),
  Message.tool(ToolResultPart.make({ id: "s1", name: "skill", result: `<skill_content name="${skill}">\n# Skill</skill_content>` })),
]
const failedTest = "bun test v1.4\n✗ add > adds two numbers\n1 pass\n1 fail\n\nExited with code 1"

describe("doubt trigger", () => {
  for (const text of ["Əminsən?", "əminik?", "ƏMİNSƏN?", "eminsen?", "Əminsiz ?", "əminsən ki bu düzdür", "Are you sure?"])
    test(`loads tradecraft for «${text}»`, () => {
      expect(detect([user(text)])?.skill).toBe("kesfiyyat-tradecraft")
    })

  for (const text of ["Mən əminəm ki bu işləyir", "əminlik dərəcəsini yaz", "Qeyri-müəyyənlik", "faylı yoxla", "təminat?", "Əminik ki işləyir"])
    test(`stays quiet for «${text}»`, () => {
      expect(detect([user(text)])).toBeUndefined()
    })

  test("only the latest user prompt counts", () => {
    expect(detect([user("əminsən?"), Message.assistant("Bəli."), user("indi README yaz")])).toBeUndefined()
  })

  test("not again once the skill is in the conversation", () => {
    expect(detect([user("əminsən?"), ...loadedVia("kesfiyyat-tradecraft")])).toBeUndefined()
    expect(detect([user("əminsən?"), user(reminder({ skill: "kesfiyyat-tradecraft", reason: "x" }, '<skill_content name="kesfiyyat-tradecraft">'))])).toBeUndefined()
  })

  test("the harness reminder itself is not read as the user's prompt", () => {
    expect(detect([user("README yaz"), user("<system-reminder>\nəminsən?\n</system-reminder>")])).toBeUndefined()
  })
})

describe("failure trigger", () => {
  test("loads investigate after a failing test run", () => {
    expect(detect([user("testi düzəlt"), shell(failedTest)])?.skill).toBe("investigate")
  })

  test("the shell tool's text and content result shapes count too", () => {
    const text = Message.tool(ToolResultPart.make({ id: "c1", name: "shell", result: failedTest, resultType: "text" }))
    const content = Message.tool(ToolResultPart.make({ id: "c1", name: "shell", result: [{ type: "text", text: failedTest }], resultType: "content" }))
    expect(detect([user("düzəlt"), text])?.skill).toBe("investigate")
    expect(detect([user("düzəlt"), content])?.skill).toBe("investigate")
  })

  test("a failure from another tool does not count", () => {
    const read = Message.tool(ToolResultPart.make({ id: "c1", name: "read", result: failedTest, resultType: "text" }))
    expect(detect([user("oxu"), read])).toBeUndefined()
  })

  test("a Python traceback counts", () => {
    expect(detect([user("işə sal"), shell("Traceback (most recent call last):\n  ...\nValueError\n\nExited with code 1")])?.skill).toBe("investigate")
  })

  test("an assertion error counts even when `; echo exit=$?` hides the exit code", () => {
    const hidden = "node:assert:95\n  throw new AssertionError(obj);\nAssertionError [ERR_ASSERTION]: Expected values\nexit=1\n"
    expect(detect([user("düzəlt"), shell(hidden)])?.skill).toBe("investigate")
  })

  test("«1 failed» counts without an exit line, «0 failed» does not", () => {
    expect(detect([user("x"), shell("5 passed, 1 failed")])?.skill).toBe("investigate")
    expect(detect([user("x"), shell("5 passed, 0 failed")])).toBeUndefined()
  })

  test("the weak word «error» needs a non-zero exit", () => {
    expect(detect([user("x"), shell("grep: error handling notes")])).toBeUndefined()
    expect(detect([user("x"), shell("Error: cannot find module\nexit=1")])?.skill).toBe("investigate")
  })

  test("a non-zero exit without a failure signature does not count", () => {
    expect(detect([user("axtar"), shell("\n\nExited with code 1")])).toBeUndefined()
  })

  test("failure words with exit 0 do not count", () => {
    expect(detect([user("testlər"), shell("3 pass\n0 fail")])).toBeUndefined()
  })

  test("«fail» inside another word does not count", () => {
    expect(detect([user("grep"), shell("failover.ts\nExited with code 2")])).toBeUndefined()
  })

  test("«fail» as the end of another word does not count", () => {
    expect(detect([user("grep"), shell("unfailing.log\nExited with code 2")])).toBeUndefined()
  })

  test("a harness reminder does not reset the window to after the failure", () => {
    const injected = user(reminder({ skill: "kesfiyyat-tradecraft", reason: "x" }, "<skill_content name=\"kesfiyyat-tradecraft\">"))
    expect(detect([user("düzəlt"), shell(failedTest), injected])?.skill).toBe("investigate")
  })

  test("a failure before the latest prompt does not count", () => {
    expect(detect([user("x"), shell(failedTest), user("yeni tapşırıq")])).toBeUndefined()
  })

  test("not again once investigate is loaded", () => {
    expect(detect([user("düzəlt"), ...loadedVia("investigate"), shell(failedTest)])).toBeUndefined()
  })

  test("doubt wins first, then investigate", () => {
    const messages = [user("əminsən?"), shell(failedTest)]
    expect(detect(messages)?.skill).toBe("kesfiyyat-tradecraft")
    expect(detect([...messages, ...loadedVia("kesfiyyat-tradecraft")])?.skill).toBe("investigate")
  })
})

test("fold makes İ, I and ı compare equal", () => {
  expect(fold("ƏMİNSƏN")).toBe("əminsən")
  expect(fold("EMINSEN")).toBe("eminsen")
})
