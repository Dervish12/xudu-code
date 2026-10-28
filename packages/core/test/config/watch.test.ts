import path from "path"
import { describe, expect, test } from "bun:test"
import type { ConfigDiscovery } from "@xudu/core/config/discovery"
import { ConfigWatch } from "@xudu/core/config/watch"
import { AbsolutePath } from "@xudu/core/schema"
import { FSUtil } from "@xudu/util/fs-util"

const project = path.resolve("watch-plan-project")
const root = AbsolutePath.make(path.join(project, ".xudu-code"))
const sources: ConfigDiscovery.Sources = {
  direct: ["xudu-code.json", "xudu-code.jsonc"].map((name) => AbsolutePath.make(path.join(project, name))),
  project: [{ path: root, present: false }],
  claude: [AbsolutePath.make(path.join(project, ".claude"))],
  agents: [AbsolutePath.make(path.join(project, ".agents"))],
}

describe("ConfigWatch.plan", () => {
  test("groups missing candidates and keeps parent watches when roots appear", () => {
    const missing = ConfigWatch.plan(sources)
    expect(Array.from(missing.values())).toEqual([
      {
        path: project,
        type: "entries",
        names: [".agents", ".claude", ".xudu-code", "xudu-code.json", "xudu-code.jsonc"],
      },
    ])
    const system = AbsolutePath.make(path.join(project, "system-xudu"))
    const present = ConfigWatch.plan({
      ...sources,
      system: { path: system, present: true },
      project: [{ path: root, present: true }],
    })
    expect(Array.from(present.values())).toEqual([
      { path: system, type: "directory", ignore: FSUtil.ignoreGlobs },
      { path: root, type: "directory", ignore: FSUtil.ignoreGlobs },
      {
        path: project,
        type: "entries",
        names: [".agents", ".claude", ".xudu-code", "system-xudu", "xudu-code.json", "xudu-code.jsonc"],
      },
    ])
  })

  test("adds exact watches for explicit files only when not already covered", () => {
    expect(ConfigWatch.plan({ ...sources, explicit: sources.direct[0] })).toEqual(ConfigWatch.plan(sources))
    const present = { ...sources, project: [{ path: root, present: true }] }
    expect(ConfigWatch.plan({ ...present, explicit: AbsolutePath.make(path.join(root, "custom.json")) })).toEqual(
      ConfigWatch.plan(present),
    )
    const directory = path.resolve("watch-plan-external")
    expect(
      Array.from(
        ConfigWatch.plan({ ...sources, explicit: AbsolutePath.make(path.join(directory, "custom.json")) }).values(),
      ),
    ).toContainEqual({ path: directory, type: "entries", names: ["custom.json"] })
  })
})
