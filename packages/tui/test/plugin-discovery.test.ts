import { expect, test } from "bun:test"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { WorkspaceTrust } from "@xudu/util/workspace-trust"
import { localPluginDirectories, mergePluginTargets } from "../src/plugin/discovery"

test("discovers a project's plugin directory only once the project is trusted", async () => {
  const previous = process.env.XUDU_TRUST_ALL
  delete process.env.XUDU_TRUST_ALL
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "xudu-tui-trust-")))
  try {
    const project = path.join(root, "repo")
    const config = path.join(root, "config")
    const trust = { state: path.join(root, "state"), home: path.join(root, "home") }
    await fs.mkdir(path.join(project, ".git"), { recursive: true })
    await fs.mkdir(path.join(project, ".xudu-code", "plugins"), { recursive: true })
    await fs.mkdir(config)
    const global = path.join(config, "plugins")
    const local = path.join(project, ".xudu-code", "plugins")

    expect(await localPluginDirectories(project, config, trust)).toEqual([global])
    WorkspaceTrust.trust(trust.state, project)
    expect(await localPluginDirectories(project, config, trust)).toEqual([global, local])
  } finally {
    if (previous === undefined) delete process.env.XUDU_TRUST_ALL
    else process.env.XUDU_TRUST_ALL = previous
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("deduplicates equivalent local plugin targets while retaining the final source", () => {
  const directory = "/project"
  const discovered = { entry: "/project/.xudu/plugins/example", install: true, optional: true }
  const server = { entry: "./.xudu/plugins/example", install: false, optional: true }

  expect(mergePluginTargets([discovered, server], directory)).toEqual([server])
})

test("preserves the first target position when a later source overrides it", () => {
  const first = { entry: "example", install: true, optional: true }
  const other = { entry: "other", install: true, optional: true }
  const configured = { entry: { package: "example", options: { enabled: true } }, install: true, optional: false }

  expect(mergePluginTargets([first, other, configured], "/project")).toEqual([configured, other])
})
