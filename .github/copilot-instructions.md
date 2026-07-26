# Component Intent Audit

When the user asks for repository health, declarations/usages, component
intent, repeated local UI, source-of-truth changes, or `reuse-me`,
run the local analyzer.

Use `reuse-me --health --json` for whole-repository audits and
`reuse-me --diff --json` for current changes. If the binary is
not on `PATH`, use `REUSE_ME_BIN` or the built CLI from this
checkout.

Report repository intelligence coverage, findings, and intelligence signals
only unless the user asks for fixes. Prefer the analyzer output before opening
source files.
