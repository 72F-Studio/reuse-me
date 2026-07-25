# Component Intent Audit

Use this repo's audit when the user asks about repository health,
source-of-truth changes, component intent, shared-component drift, repeated
local UI, architecture drift, declarations/usages, hardcoded colors or
spacing, design token drift, or `component-intent-audit`.

Works on any language: drift is detected from shape, not framework syntax.

Run the CLI if available:

```bash
component-intent-audit --health --json
component-intent-audit --diff --json
```

Default to `--health` for whole-repository audits. Use `--diff` only for a
current patch or changed-file review. If `COMPONENT_INTENT_AUDIT_BIN` is set,
run that executable instead. If this checkout is available, use:

```bash
node /absolute/path/to/component-intent-audit/dist/cli.js --health --json
```

Report findings and intelligence signals only unless the user explicitly asks for
fixes. Prefer the tool's repository structure, declaration, relationship, and
usage data before opening files. Treat results as review prompts, not proof:
static heuristics, no model calls, no autofix.

Finding kinds: `competing-implementation`, `missing-abstraction`,
`unused-abstraction`, `untokenized-value` (`bypassed` when a token with that
value already exists, `candidate` when the value repeats untokenized).

When an intelligence area reports as unavailable, say so rather than reporting
"no findings". "Nothing is unused" and "I cannot tell what is unused" are
different answers.
