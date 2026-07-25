---
name: component-intent-audit
description: >
  Runs the component-intent-audit CLI for capability-driven repository
  intelligence. Use when the user asks for shared-component drift, component
  intent audit, repository health, current diff audit, source-of-truth checks,
  component-intent-audit, or /component-intent-audit. Produces deterministic
  findings and intelligence signals first; does not apply fixes unless the user
  separately asks for implementation.
---

Run the local static analyzer before reading large parts of a repo. Use its
repository structure, declaration, relationship, and usage data to reduce model
context.

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

Report repository intelligence coverage first when relevant, then
findings/signals ranked by impact:

- `competing-implementation`: local repeated UI likely belongs in a shared component.
- `missing-abstraction`: repeated local UI has no strong shared candidate.
- `unused-abstraction`: shared component has no observed references.
- `repositoryHeuristics`: path-level drift such as duplicate filenames or
  repeated source directories.
- `intelligenceSignals`: top referenced files, unresolved import hotspots, and
  duplicate declarations.

Keep the report short. Prefer the CLI's semantic summary before opening files.
Include file paths and confidence when present. If the tool reports no findings,
say that directly.

## Limits

Capability-driven static heuristics only. Generic declarations/imports are
best-effort across common languages; framework UI details require a specific
knowledge provider. No model calls. No autofix. Treat results as review
prompts, not proof.
