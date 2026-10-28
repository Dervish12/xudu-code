import { expect, test } from "bun:test"
import { mkdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { Plugin } from "@xudu/plugin"
import { initRepo } from "../../core/test/fixture/git"
import { tmpdir } from "../../core/test/fixture/tmpdir"
import { Xudu } from "../src"

test("embedded worktree APIs use project IDs and SDK-registered strategies", async () => {
  await using directory = await tmpdir("xudu-sdk-worktree-")
  await initRepo(directory.path)
  const state = { activated: 0, discovered: 0, removed: 0 }
  const plugin = Plugin.define({
    id: "sdk-worktrees",
    async setup(ctx) {
      state.activated++
      await ctx.worktree.transform((editor) =>
        editor.add({
          id: "sdk-copy",
          async create(input, { signal }) {
            signal.throwIfAborted()
            await mkdir(input.directory)
            return { directory: input.directory }
          },
          async remove(input, { signal }) {
            signal.throwIfAborted()
            await rm(input.directory, { recursive: true })
            state.removed++
          },
          async list(_source, { signal }) {
            signal.throwIfAborted()
            state.discovered++
            return []
          },
        }),
      )
    },
  })
  await using xudu = await Xudu.create({
    plugins: [plugin],
    config: { directory: directory.path, project: false },
    models: { fetch: false },
    fs: { filewatcher: false },
  })
  const session = await xudu.sessions.create({ location: { directory: directory.path } })
  const projectID = session.projectID
  expect(await xudu.worktree.list({ projectID })).toHaveLength(1)
  expect(state.activated).toBe(0)
  const worktree = await xudu.worktree.create({
    projectID,
    directory: join(directory.path, "copies"),
    name: "task",
  })
  expect(state.activated).toBe(1)
  expect(await xudu.worktree.list({ projectID })).toContainEqual({
    directory: worktree.directory,
    strategy: "sdk-copy",
  })
  expect(state.discovered).toBe(0)
  await xudu.worktree.refresh({ projectID })
  expect(state.discovered).toBe(1)
  await xudu.worktree.remove({ projectID, directory: worktree.directory, force: false })
  expect(state.removed).toBe(1)
  expect(await xudu.worktree.list({ projectID })).toHaveLength(1)
})
