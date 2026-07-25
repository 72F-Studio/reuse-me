---
name: component-intent-audit
description: "Run the component-intent-audit CLI for React/TypeScript shared-component drift. Reports findings only."
license: UNLICENSED
---

Run the local static analyzer for shared-component drift.

## Modes

- Whole repo: `component-intent-audit --health --json`
- Current diff: `component-intent-audit --diff --json`
- Human output: drop `--json`

Use whole-repo health mode by default. Use diff mode only when the user asks
about current changes or a patch.

## Command Lookup

Prefer this order:

1. If `COMPONENT_INTENT_AUDIT_BIN` is set, run that executable.
2. If `component-intent-audit` is on `PATH`, run it.
3. If this source checkout is available, run the built CLI directly:
   `node /absolute/path/to/component-intent-audit/dist/cli.js --health --json`.
4. If only source is available, run `npm install` if needed, then `npm run build`,
   then the built CLI.

Do not fabricate findings when no runnable CLI is available. Say what command
was missing.

## Output

Report findings ranked by impact:

- `competing-implementation`: local repeated UI likely belongs in a shared component.
- `missing-abstraction`: repeated local UI has no strong shared candidate.
- `unused-abstraction`: shared component has no observed references.

Keep the report short. Include file paths and confidence when present. If the
tool reports no findings, say that directly.

## Limits

React/TSX-oriented static heuristics only. No model calls. No autofix. Treat
results as review prompts, not proof.
