import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

export const shellParserWasm = {
  runtime: process.env.XUDU_TREE_SITTER_WASM_PATH ?? require.resolve("web-tree-sitter/tree-sitter.wasm"),
  bash: process.env.XUDU_TREE_SITTER_BASH_WASM_PATH ?? require.resolve("tree-sitter-bash/tree-sitter-bash.wasm"),
  powershell:
    process.env.XUDU_TREE_SITTER_POWERSHELL_WASM_PATH ??
    require.resolve("tree-sitter-powershell/tree-sitter-powershell.wasm"),
}
