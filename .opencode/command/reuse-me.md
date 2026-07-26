---
description: Audit repository health, declarations, usage, and component intent
---

Run reuse-me on the current repository. Use whole-repository
health mode unless the user specifically asks for a diff audit. Prefer the
tool's deterministic intelligence signals before opening source files.

Prefer machine-readable output:

```bash
reuse-me --health --json
reuse-me --diff --json
```

If the command is not on PATH, use `REUSE_ME_BIN` or a known
local checkout:

```bash
node /absolute/path/to/reuse-me/dist/cli.js --health --json
```

Report repository intelligence coverage, findings, and intelligence signals
only. Do not apply fixes unless separately asked.
