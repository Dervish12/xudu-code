import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { WorkspaceTrust } from "@xudu/util/workspace-trust"
import { pending, projectRoot, targets } from "../src/workspace-trust"
import { isolatedEnv } from "./fixture/environment"

let root: string
let state: string
let home: string
const previous = process.env.XUDU_TRUST_ALL

beforeEach(async () => {
  delete process.env.XUDU_TRUST_ALL
  root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "xudu-trust-")))
  state = path.join(root, "state")
  home = path.join(root, "home")
})

afterEach(async () => {
  if (previous === undefined) delete process.env.XUDU_TRUST_ALL
  else process.env.XUDU_TRUST_ALL = previous
  await fs.rm(root, { recursive: true, force: true })
})

async function write(file: string, content: string) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, content)
}

describe("pending", () => {
  test("reports settings, plugins and agent permissions that wait for trust", async () => {
    const project = path.join(root, "repo")
    await write(path.join(project, ".git", "HEAD"), "ref: refs/heads/main\n")
    await write(path.join(project, "xudu-code.jsonc"), '{ // comment\n "username": "x", "mcp": {}, "shell": "zsh", }')
    await write(path.join(project, ".xudu-code", "plugins", "tool.ts"), "export default {}")
    await write(path.join(project, ".claude", "agents", "nested", "ops.md"), "---\npermission:\n  bash: allow\n---\nx")
    await write(path.join(project, ".xudu-code", "agents", "plain.md"), "---\ndescription: plain\n---\nx")
    const sub = path.join(project, "src")
    await fs.mkdir(sub)

    const found = pending(sub, { state, home })
    expect(found.map((item) => [path.relative(project, item.source), item.settings])).toEqual([
      ["xudu-code.jsonc", ["mcp", "shell"]],
      [path.join(".xudu-code", "plugins"), ["plugins"]],
      [path.join(".claude", "agents"), ["agent permissions"]],
    ])
    expect(targets(sub, found)).toEqual([project])
    expect(projectRoot(sub)).toBe(project)
  })

  test("is empty for safe configuration and for trusted folders", async () => {
    const safe = path.join(root, "safe")
    await write(path.join(safe, "xudu-code.json"), JSON.stringify({ username: "x", instructions: ["a.md"] }))
    expect(pending(safe, { state, home })).toEqual([])

    const risky = path.join(root, "risky")
    await write(path.join(risky, "xudu-code.json"), JSON.stringify({ instructions: ["https://example.com/a.md"] }))
    expect(pending(risky, { state, home }).map((item) => item.settings)).toEqual([["instructions"]])
    WorkspaceTrust.trust(state, risky)
    expect(pending(risky, { state, home })).toEqual([])
  })

  test("never asks about the home directory's own configuration", async () => {
    await write(path.join(home, ".xudu-code", "plugins", "mine.ts"), "export default {}")
    expect(pending(home, { state, home })).toEqual([])
  })
})

describe("WorkspaceTrust store", () => {
  test("trusts folders inside a trusted root only", async () => {
    const project = path.join(root, "p")
    await fs.mkdir(project)
    WorkspaceTrust.trust(state, project)
    expect(WorkspaceTrust.trusted(path.join(project, "deep", "er"), { state, home })).toBe(true)
    expect(WorkspaceTrust.trusted(`${project}-sibling`, { state, home })).toBe(false)
    expect(WorkspaceTrust.trusted(path.join(root, "..p"), { state, home })).toBe(false)
    expect(WorkspaceTrust.trusted(root, { state, home })).toBe(false)
    WorkspaceTrust.untrust(state, project)
    expect(WorkspaceTrust.trusted(project, { state, home })).toBe(false)
  })

  test("ignores a corrupt trust list", async () => {
    await write(WorkspaceTrust.file(state), "{ not json")
    expect(WorkspaceTrust.list(state)).toEqual([])
    expect(WorkspaceTrust.trusted(path.join(root, "x"), { state, home })).toBe(false)
  })

  test("stores the list privately", async () => {
    if (process.platform === "win32") return
    WorkspaceTrust.trust(state, root)
    expect((await fs.stat(WorkspaceTrust.file(state))).mode & 0o777).toBe(0o600)
  })
})

describe("trust command", () => {
  test("trusts, lists and removes a folder", async () => {
    const project = path.join(root, "proj")
    await fs.mkdir(project)
    const env = { ...isolatedEnv(root), XUDU_TRUST_ALL: undefined }
    const run = async (args: string[]) => {
      const child = Bun.spawn([process.execPath, "run", path.join(import.meta.dir, "../src/index.ts"), ...args], {
        // The package directory carries the bunfig preload the TUI sources need.
        cwd: path.join(import.meta.dir, ".."),
        env,
        stdout: "pipe",
        stderr: "pipe",
      })
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ])
      return { stdout, stderr, exitCode }
    }

    const trusted = await run(["trust", project])
    expect(trusted.stderr).toBe("")
    expect(trusted.exitCode).toBe(0)
    const listed = await run(["trust", "--list"])
    expect(listed.stdout.trim()).toBe(project)
    const removed = await run(["trust", "--remove", project])
    expect(removed.exitCode).toBe(0)
    expect((await run(["trust", "--list"])).stdout).not.toContain(project)
  })
})
