# Component Intent Audit

When the user asks for repository health, declarations/usages, component
intent, repeated local UI, source-of-truth changes, or `component-intent-audit`,
run the local analyzer.

Use `component-intent-audit --health --json` for whole-repository audits and
`component-intent-audit --diff --json` for current changes. If the binary is
not on `PATH`, use `COMPONENT_INTENT_AUDIT_BIN` or the built CLI from this
checkout.

Report repository intelligence coverage, findings, and intelligence signals
only unless the user asks for fixes. Prefer the analyzer output before opening
source files.
