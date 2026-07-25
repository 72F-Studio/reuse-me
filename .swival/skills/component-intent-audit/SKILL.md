---
name: component-intent-audit
description: >
  Runs the component-intent-audit CLI for React/TypeScript UI repositories.
  Produces findings only; does not apply fixes unless separately asked.
---

Run the local static analyzer for shared-component drift.

Use `component-intent-audit --health --json` by default and
`component-intent-audit --diff --json` for current changes. If the command is
not on `PATH`, use `COMPONENT_INTENT_AUDIT_BIN` or the built CLI from this
checkout.

Report `competing-implementation`, `missing-abstraction`, and
`unused-abstraction` findings with paths and confidence where present. Do not
apply fixes unless the user asks.
