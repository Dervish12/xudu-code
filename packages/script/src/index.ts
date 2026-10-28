import { $ } from "bun"
import semver from "semver"
import path from "path"

const rootPkgPath = path.resolve(import.meta.dir, "../../../package.json")
const rootPkg = await Bun.file(rootPkgPath).json()
const expectedBunVersion = rootPkg.packageManager?.split("@")[1]

if (!expectedBunVersion) {
  throw new Error("packageManager field not found in root package.json")
}

// relax version requirement
const expectedBunVersionRange = `^${expectedBunVersion}`

if (!semver.satisfies(process.versions.bun, expectedBunVersionRange)) {
  throw new Error(`This script requires bun@${expectedBunVersionRange}, but you are using bun@${process.versions.bun}`)
}

const env = {
  XUDU_CHANNEL: process.env["XUDU_CHANNEL"],
  XUDU_VERSION: process.env["XUDU_VERSION"],
}
const CHANNEL = await (async () => {
  if (env.XUDU_CHANNEL) return env.XUDU_CHANNEL
  if (env.XUDU_VERSION && !env.XUDU_VERSION.startsWith("0.0.0-")) return "latest"
  const branch = await $`git branch --show-current`.text().then((x) => x.trim())
  if (!branch) return "detached"
  const channel = branch.replace(/[^a-zA-Z0-9._-]/g, "-")
  if (/^[a-zA-Z0-9]/.test(channel)) return channel
  return `branch-${channel}`
})()
const IS_PREVIEW = CHANNEL !== "latest"

// The release workflow's plan job owns release versions; builds only read them.
const VERSION = (() => {
  if (env.XUDU_VERSION) return env.XUDU_VERSION
  if (!IS_PREVIEW) throw new Error("XUDU_VERSION is required for latest-channel builds")
  return `0.0.0-${CHANNEL}-${previewBuildNumber()}`
})()

function previewBuildNumber() {
  const runNumber = process.env["GITHUB_RUN_NUMBER"]
  if (!runNumber) return new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")
  const runAttempt = process.env["GITHUB_RUN_ATTEMPT"]
  if (runAttempt && runAttempt !== "1") return `${runNumber}.${runAttempt}`
  return runNumber
}

export const Script = {
  get channel() {
    return CHANNEL
  },
  get version() {
    return VERSION
  },
  get preview() {
    return IS_PREVIEW
  },
}
console.log(`xudu script`, JSON.stringify(Script, null, 2))
