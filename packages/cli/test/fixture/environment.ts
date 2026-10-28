import os from "node:os"
import path from "node:path"

// Each isolated home gets its own XDG_CACHE_HOME, where Bun would otherwise keep its transpiler cache,
// so every spawned CLI process would transpile the source from scratch. Share one cache instead.
export const transpilerCache = path.join(os.tmpdir(), "xudu-test-transpiler-cache")

export function isolatedEnv(root: string, overrides: Record<string, string | undefined> = {}) {
  return {
    ...process.env,
    BUN_RUNTIME_TRANSPILER_CACHE_PATH: transpilerCache,
    HOME: root,
    XUDU_CLI_CONFIG_CONTENT: undefined,
    XUDU_CONFIG_CONTENT: "{}",
    XUDU_CONFIG_DIR: path.join(root, "config"),
    XUDU_DB: path.join(root, "xudu.db"),
    XUDU_DISABLE_FILEWATCHER: "true",
    XUDU_DISABLE_MODELS_FETCH: "true",
    XUDU_TEST_HOME: root,
    XUDU_TRUST_ALL: "1",
    XDG_CACHE_HOME: path.join(root, "cache"),
    XDG_CONFIG_HOME: path.join(root, "xdg-config"),
    XDG_DATA_HOME: path.join(root, "data"),
    XDG_STATE_HOME: path.join(root, "state"),
    ...overrides,
  }
}
