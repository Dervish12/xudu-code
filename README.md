# xudu-code

xudu-code is the terminal coding agent of [xudu.ai](https://xudu.ai). It reads and edits your code, runs commands and
tests, searches the web, and carries a task through to a verified result. It runs on the `xudu-flash` model and signs
in with your xudu.ai account.

> **Azərbaycanca:** xudu-code xudu.ai-ın terminalda işləyən kod agentidir. Quraşdırma, giriş və istifadə haqqında
> ətraflı məlumat: [xudu.ai/code](https://xudu.ai/code).

## Install

macOS and Linux:

```sh
curl -fsSL https://xudu.ai/install | bash
```

Windows (PowerShell):

```powershell
irm https://xudu.ai/install.ps1 | iex
```

The installer verifies each download against its SHA-256 checksum and the release signature, then places the binary
in `~/.xudu-code/bin`. Supported platforms: macOS (Apple Silicon and Intel), Linux (x64 and arm64) and Windows x64.

## Get started

```sh
cd your-project
xudu-code
```

On first run xudu-code shows a code and opens `xudu.ai/cli-login`. Approve the code while signed in to xudu.ai; the CLI
then works with your account and its plan.

| Command | What it does |
| --- | --- |
| `xudu-code` | Interactive terminal interface |
| `xudu-code run "task"` | Run a task without the interface (scripts and CI) |
| `xudu-code usage` | Your plan, today's usage and connected devices |
| `xudu-code trust` | Trust the current folder's executable configuration |
| `xudu-code auth login` / `logout` | Sign in or out of xudu.ai |
| `xudu-code mcp add` | Add an MCP server |
| `xudu-code upgrade` | Upgrade to the latest release |

## Project instructions

xudu-code loads guidance for your project from `XUDU.md`, `AGENTS.md` or `CLAUDE.md` (the first one found in each
directory). Configuration lives in `xudu-code.json` or `.xudu-code/`; global settings in `~/.config/xudu-code/`.

## Security

- **Workspace trust.** Configuration that can run code or reach the network (plugins, MCP servers, formatters,
  language servers, providers, shell and permission overrides) only loads from folders you have trusted. Opening an
  unfamiliar repository never runs its code.
- **Signed releases.** Every release's checksums are signed with an Ed25519 key that never leaves the release machine;
  the installers refuse a download whose signature does not verify.
- **Local server.** The background service listens on localhost by default and requires a random password; there is
  no browser interface and no remote tunnel.

See [SECURITY.md](SECURITY.md) to report a vulnerability.

## Development

xudu-code is a [Bun](https://bun.sh) monorepo (TypeScript, Effect).

```sh
bun install
bun run dev                      # run the CLI from source
bun --cwd packages/core run test # tests run per package
bun run typecheck
```

Release binaries are built with `packages/cli/script/build.ts`.

## License

MIT, see [LICENSE](LICENSE). xudu-code includes software from other projects; their notices are in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
