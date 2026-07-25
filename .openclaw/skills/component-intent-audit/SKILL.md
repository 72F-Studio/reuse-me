---
name: component-intent-audit
description: >
  Runs the component-intent-audit CLI to find re-implemented components and
  design values hardcoded instead of tokenized, in any language. Use when the
  user asks for shared-component drift, component intent audit, repository
  health, current diff audit, source-of-truth checks, design token drift,
  hardcoded colors or spacing, component-intent-audit, or
  /component-intent-audit. Produces deterministic findings; does not apply
  fixes unless the user separately asks for implementation.
---

Run the local static analyzer before reading large parts of a repo. Use its
repository structure, declaration, relationship, and usage data to reduce model
context.

Works on any language. Component drift is detected from shape — constructed
symbols and style literals — not from framework-specific syntax, so Kotlin,
Swift, Dart, Vue and TypeScript all go through the same backend.

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

- `competing-implementation`: local repeated code that re-implements an
  existing shared component.
- `missing-abstraction`: repeated local shape with no strong shared candidate.
- `unused-abstraction`: shared component with no observed references.
- `untokenized-value`: a design value written as a literal. `bypassed` means a
  token with that exact value already exists and was not used; `candidate`
  means the value repeats often enough to deserve a token.
- `repositoryHeuristics`: path-level drift such as duplicate filenames or
  repeated source directories.
- `intelligenceSignals`: top referenced files, unresolved import hotspots, and
  duplicate declarations.

Keep the report short. Prefer the CLI's semantic summary before opening files.
Include file paths and confidence when present.

## Reporting absence honestly

Some analyses turn themselves off when the evidence cannot support them — most
often `Unused Abstraction Analysis` when too few imports resolve to tell used
from unused. When an area reports as unavailable, say so. Do not translate it
into "no findings"; "nothing is unused" and "I cannot tell what is unused" are
different answers.

If the tool reports no findings and no area is unavailable, say that directly.

## Limits

Static syntax evidence only. Generic declarations and imports are best-effort
across common languages; framework-specific UI details need a matching
provider. No model calls. No autofix. Treat results as review prompts, not
proof.
