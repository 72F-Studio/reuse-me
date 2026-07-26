# Agent Portability

This repo follows Ponytail's adapter shape: keep behavior in `skills/`, then
add thin host files that either expose the skill or tell the host how to invoke
the CLI.

## Supported Adapters

| Host | Files |
|------|-------|
| Codex | `.codex-plugin/plugin.json`, `skills/` |
| Claude Code | `.claude-plugin/`, `commands/`, `skills/` |
| Gemini / Antigravity | `gemini-extension.json`, `AGENTS.md`, `commands/`, `skills/` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| GitHub Copilot CLI | `.github/plugin/`, `commands/`, `skills/` |
| OpenCode | `opencode.json`, `.opencode/plugins/`, `.opencode/command/`, `skills/` |
| pi | `pi-extension/`, `skills/` |
| Hermes Agent | `plugin.yaml`, `__init__.py`, `skills/` |
| Devin | `.devin-plugin/plugin.json`, `skills/` |
| Cursor | `.cursor/rules/reuse-me.mdc` |
| Windsurf | `.windsurf/rules/reuse-me.md` |
| Cline | `.clinerules/reuse-me.md` |
| Kiro | `.kiro/steering/reuse-me.md` |
| CodeWhale / VS Code Codex / Aider / Zed / generic agents | `AGENTS.md` |
| Swival | `.swival/skills/`, `AGENTS.md` |
| OpenClaw | `.openclaw/skills/reuse-me/` |
| Agent rules marketplace | `.agents/rules/`, `.agents/plugins/marketplace.json` |

## Runtime Boundary

Adapters do not reimplement analysis. They instruct the agent to run:

```bash
reuse-me --health --json
reuse-me --diff --json
```

The CLI must be available through `PATH`, `REUSE_ME_BIN`, or a
known local checkout.
