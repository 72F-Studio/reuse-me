# component-intent-audit

Local CLI for capability-driven repository reasoning from deterministic facts.
It is designed to give agents a compact map before they spend model context
reading files.

Modes:

- Change analysis: checks changed source artifacts and warns when repeated local edits likely belong in a shared abstraction.
- Repository health: ignores Git changes and reports repository-wide structure,
  declaration, usage, and abstraction signals.

## Usage

```bash
npm install
npm run build
npm run dev -- --diff
npm run dev -- --health
```

Text output is the default.

```bash
npm run dev -- --health --json
npm run dev -- --diff --markdown
```

## Agent Support

This repo ships Ponytail-style adapters. The analyzer stays in one CLI; agent
files only expose instructions, skills, or command aliases.

Supported adapter files include:

- Codex: `.codex-plugin/plugin.json`, `skills/`
- Claude Code: `.claude-plugin/`, `commands/`, `skills/`
- Gemini / Antigravity: `gemini-extension.json`, `AGENTS.md`
- GitHub Copilot: `.github/copilot-instructions.md`
- GitHub Copilot CLI: `.github/plugin/`, `commands/`, `skills/`
- OpenCode: `opencode.json`, `.opencode/`
- pi: `pi-extension/`
- Hermes Agent: `plugin.yaml`, `__init__.py`
- Devin: `.devin-plugin/plugin.json`
- Cursor, Windsurf, Cline, Kiro: native rule files
- CodeWhale, VS Code Codex, Aider, Zed, generic agents: `AGENTS.md`
- Swival and OpenClaw: copied skill directories

See `docs/agent-portability.md`.

Local Codex install:

```bash
npm install
npm run build
export COMPONENT_INTENT_AUDIT_BIN=/absolute/path/to/component-intent-audit/dist/cli.js
codex plugin marketplace add /absolute/path/to/component-intent-audit
codex plugin add component-intent-audit@component-intent-audit
```

Then start a new Codex thread and ask for `component-intent-audit`.

For other agents, install the matching adapter from this checkout or copy the
listed rule/skill file into that agent's global or project config. Keep the CLI
available through `COMPONENT_INTENT_AUDIT_BIN`, `npm link`, or a package
install.

## Configuration

Optional file: `component-intent.json`

```json
{
  "sharedSourceDirs": ["src/components", "src/ui", "src/design-system"],
  "localSourceDirs": ["src/screens", "src/pages", "src/routes"],
  "ignore": ["**/*.test.tsx", "**/*.stories.tsx"],
  "warningThreshold": 0.7
}
```

Missing fields inherit defaults. Unknown fields are rejected. Legacy
`sharedComponentDirs` and `screenDirs` keys are still accepted as aliases.

## Repository Intelligence

- Structure Intelligence: repository structure and path heuristics for any repo.
- Declaration Intelligence: generic declarations and imports for common source
  languages.
- Relationship Intelligence: resolved repository-local imports and usage counts.
- UI/Framework Intelligence: framework-specific facts where a knowledge provider
  exists.

The CLI reports repository intelligence coverage in every health result.
Missing UI intelligence does not block repository/declaration data.

## Limits

- Static syntax evidence only; treat results as review prompts, not proof.
- Generic declaration intelligence is heuristic. Language-specific knowledge
  providers can replace it when precision matters.
- No model calls, no autofix, no PR comments.
