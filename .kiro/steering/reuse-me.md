---
title: Component Intent Audit
inclusion: manual
---

# Component Intent Audit

Use when asked for repository health, declarations/usages, component intent,
shared-component drift, repeated local UI, or `reuse-me`.

Run `reuse-me --health --json` by default. Run
`reuse-me --diff --json` for current changes. If the binary is
not on `PATH`, use `REUSE_ME_BIN` or the built CLI from this
checkout.

Summarize repository intelligence coverage, findings, and intelligence signals
with file paths. Prefer analyzer output before opening source files. Do not
apply fixes unless the user asks.
