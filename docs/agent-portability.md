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
| Cursor | `.cursor/rules/component-intent-audit.mdc` |
| Windsurf | `.windsurf/rules/component-intent-audit.md` |
| Cline | `.clinerules/component-intent-audit.md` |
| Kiro | `.kiro/steering/component-intent-audit.md` |
| CodeWhale / VS Code Codex / Aider / Zed / generic agents | `AGENTS.md` |
| Swival | `.swival/skills/`, `AGENTS.md` |
| OpenClaw | `.openclaw/skills/component-intent-audit/` |
| Agent rules marketplace | `.agents/rules/`, `.agents/plugins/marketplace.json` |

## Runtime Boundary

Adapters do not reimplement analysis. They instruct the agent to run:

```bash
component-intent-audit --health --json
component-intent-audit --diff --json
```

The CLI must be available through `PATH`, `COMPONENT_INTENT_AUDIT_BIN`, or a
known local checkout.
