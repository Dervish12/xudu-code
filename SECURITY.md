# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub's
["Report a vulnerability"](https://github.com/Dervish12/xudu-code/security/advisories/new) form. Do not open a public
issue for a vulnerability. Include the version (`xudu-code --version`), your platform, and steps to reproduce.

We aim to acknowledge reports within three working days and to ship a fix for confirmed issues as soon as possible.

## Threat model

xudu-code is an agent that reads files, edits code and runs commands on your machine, so what it may do is governed by
explicit boundaries:

- **Permissions.** Tool use is checked against permission rules. Commands and edits that are not allowed by default
  ask before they run.
- **Workspace trust.** A project's configuration can define plugins, MCP servers, formatters, language servers,
  providers, a shell, and permission or agent overrides. These can run code or send data, so they are ignored until the
  folder is trusted with `xudu-code trust` or the first-run prompt. Text-only configuration (instructions, commands,
  skills) always loads.
- **Local service.** The background service binds to localhost unless you configure another address, and authenticates every request with a random
  password stored with mode 0600. Passwords are compared in constant time.
- **Credentials.** The xudu.ai sign-in token is stored in the local database (mode 0600) and is only sent to
  `api.xudu.ai`. Revoke a device at [xudu.ai/code/usage](https://xudu.ai/code/usage) or with `xudu-code auth logout`.
- **Releases.** Release checksums are signed with an Ed25519 key kept off the download server. The installers verify
  the signature and the checksum before installing.

## Out of scope

- Actions you approve, or that your own trusted configuration allows.
- Code that the model writes and you choose to run.
- Vulnerabilities in third-party MCP servers or plugins you install.
