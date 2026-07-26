# Component Intent Audit

When asked for repository health, source-of-truth misses, shared-component
drift, component intent, declarations/usages, architecture drift, or
`reuse-me`, run the local CLI and summarize deterministic data.

Prefer:

```bash
reuse-me --health --json
```

For a current diff:

```bash
reuse-me --diff --json
```

If `REUSE_ME_BIN` is set, run that executable. If only a source
checkout is known, build it and run `node <checkout>/dist/cli.js`.

Report repository intelligence coverage, `repositoryHeuristics`,
`intelligenceSignals`, `competing-implementation`, `missing-abstraction`, and
`unused-abstraction` with paths and confidence where present. Prefer these
signals before opening source files. Do not apply fixes unless separately
asked.
