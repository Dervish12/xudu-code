# xudu-code

Use this guide for any question about xudu-code itself: signing in, plans and
limits, configuration, instruction files, MCP servers, skills, agents,
commands, the background service, upgrading, and troubleshooting.

xudu-code is xudu.ai's coding agent. It is built on the open-source xudu-code V2
engine (MIT), so configuration fields have the same shapes as xudu-code V2; only
the names and locations below differ. When you need the exact shape of a field
that this guide does not cover, the xudu-code V2 configuration reference at
<https://xudu.ai/v2/docs/config> applies, with xudu-code's file names and
directories substituted. Never recommend settings for other providers or
models: xudu-code talks only to xudu.ai.

## Account, model, and limits

- The model is `xudu-flash`, served by xudu.ai at `https://api.xudu.ai`.
- On first run xudu-code asks the user to sign in. It shows a code and opens
  `https://xudu.ai/cli-login`; the user approves the code while signed in to
  their xudu.ai account. The token is tied to that account.
- Sign in again or switch accounts with `xudu-code auth login`; sign out with
  `xudu-code auth logout`; list credentials with `xudu-code auth list`.
- Each xudu.ai account has a plan with daily request and output-token limits.
  When a limit is reached, the API answers HTTP 429 with a message naming the
  limit; it resets the next day. Plans are managed by xudu.ai administrators.
- A deactivated or pending xudu.ai account stops working within a few minutes,
  even with a saved token.

## Instruction files

xudu-code loads project guidance into every session from these files, walking
from the current directory up to the project root. In each directory only the
first one that exists is used, in this order:

1. `XUDU.md`
2. `AGENTS.md`
3. `CLAUDE.md`

A global file for every project lives at `~/.config/xudu-code/XUDU.md` (or
`AGENTS.md` there). When the agent reads files in a subdirectory, that
subdirectory's instruction file is loaded too. `/init` creates or improves an
`AGENTS.md` for the repository.

## Configuration

Server and project configuration is JSON or JSONC:

- Global: `~/.config/xudu-code/xudu-code.json(c)`.
- Project: `xudu-code.json(c)` in any directory, or
  `.xudu-code/xudu-code.json(c)`. Files are merged from the farthest ancestor
  to the current directory; `.xudu-code/` files override direct files.

Common fields: `default_agent`, `permissions`, `agents`, `commands`,
`plugins`, `mcp`, `skills`, `instructions`, `references`, `formatter`, `lsp`.
Do not set `model` or `providers`; the xudu.ai provider is built in.

Config changes apply without a restart: xudu-code watches its config files and
reloads agents, commands, skills, MCP servers, and plugins after a save. Use
`/reload` to force a reload. Never guess field names; preserve unrelated
settings when editing a file.

Terminal preferences (theme, keybinds, input, tabs, diffs) are separate and
live in `~/.config/xudu-code/cli.json`. Most can be changed in the TUI with
`Ctrl+P` → **Open settings**.

## Skills, agents, and commands

Project definitions live in `.xudu-code/` (`skills/<name>/SKILL.md`,
`agents/<name>.md`, `commands/<name>.md`); global ones in
`~/.config/xudu-code/`. Skills are also read from `.claude/skills/` and
`.agents/skills/` (in the project and in the home directory), so existing
Claude Code skills work unchanged. Agents and commands are read only from the
xudu-code directories.

## MCP servers

Prefer the CLI because it preserves unrelated configuration. Use `--global`
when the user wants the server everywhere:

```sh
xudu-code mcp add <name> --global --url <remote-url>
xudu-code mcp list
```

Remote servers use OAuth by default. If `mcp list` shows that a server needs
authentication, tell the user to run `/mcps`, select the server, and sign in.
Do not run `xudu-code mcp auth` through the shell tool: it is interactive.
Use environment substitution such as `{env:MCP_API_KEY}` instead of writing a
secret into configuration.

## Service

Interfaces such as the TUI connect to a background xudu-code service, which
owns sessions, configuration, permissions, and tool execution. It starts
automatically. Restart it only when it is stuck, not to apply configuration:

```sh
xudu-code service restart
xudu-code service status
```

`xudu-code api get /api/info` calls the local API through the same
authentication as the TUI.

## Upgrading and installing

- Upgrade in place: `xudu-code upgrade` (or `xudu-code upgrade <version>`).
  xudu-code also checks for new versions itself.
- Install on macOS or Linux: `curl -fsSL https://xudu.ai/install | bash`.
- Install on Windows (PowerShell): `irm https://xudu.ai/install.ps1 | iex`.
- The binary lives in `~/.xudu-code/bin`.

## Troubleshooting

- Check the service with `xudu-code service status`; compare with
  `xudu-code --standalone`, which runs with a private server.
- Logs: `~/.local/share/xudu-code/log/xudu-code.log`. Filter `role=cli` for
  client startup and `role=server` for sessions, tools, and permissions. Run
  one reproduction with `XUDU_LOG_LEVEL=DEBUG` for more detail.
- "401" from api.xudu.ai means the sign-in is missing, revoked, or the account
  is not active: run `xudu-code auth login`. "429" means the daily plan limit
  was reached.
- Do not delete or edit the database or service files while diagnosing.
  Redact tokens, prompts, and file contents before sharing diagnostics.
