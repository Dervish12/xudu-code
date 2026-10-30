import { describe, expect, test } from "bun:test"
import { ArtifactTool } from "@xudu/core/tool/plugin/artifact"

describe("ArtifactTool", () => {
  test("description sends the model to the artifact-design skill before writing", () => {
    expect(ArtifactTool.description).toContain("load the `artifact-design` skill")
    expect(ArtifactTool.description).toContain("private by default")
  })

  test("extractTitle reads the page title and collapses whitespace", () => {
    expect(ArtifactTool.extractTitle("<html><head><title>\n  Satış   Paneli </title></head></html>")).toBe("Satış Paneli")
    expect(ArtifactTool.extractTitle('<TITLE lang="az">Hesabat</TITLE>')).toBe("Hesabat")
  })

  test("extractTitle returns undefined when the page has no usable title", () => {
    expect(ArtifactTool.extractTitle("<html><body>salam</body></html>")).toBeUndefined()
    expect(ArtifactTool.extractTitle("<title>   </title>")).toBeUndefined()
  })

  test("invalidReason accepts a normal page", () => {
    expect(ArtifactTool.invalidReason("<!doctype html><title>x</title><p>salam</p>")).toBeUndefined()
  })

  test("invalidReason rejects empty, non-HTML and oversized files", () => {
    expect(ArtifactTool.invalidReason("  \n")).toBe("the file is empty")
    expect(ArtifactTool.invalidReason("sadəcə mətn, teq yoxdur")).toBe("the file is not HTML")
    const big = "<p>" + "a".repeat(ArtifactTool.MAX_BYTES) + "</p>"
    expect(ArtifactTool.invalidReason(big)).toContain("the limit is")
  })

  test("invalidReason counts bytes, not characters", () => {
    // "ə" is two bytes in UTF-8: a page under the limit in characters can be over it in bytes.
    const page = "<p>" + "ə".repeat(ArtifactTool.MAX_BYTES / 2) + "</p>"
    expect(page.length).toBeLessThan(ArtifactTool.MAX_BYTES)
    expect(ArtifactTool.invalidReason(page)).toContain("the limit is")
  })

  test("artifactKey is stable per path and differs between paths", () => {
    const a = ArtifactTool.artifactKey("/tmp/a/report.html")
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(ArtifactTool.artifactKey("/tmp/a/report.html")).toBe(a)
    expect(ArtifactTool.artifactKey("/tmp/b/report.html")).not.toBe(a)
  })
})
