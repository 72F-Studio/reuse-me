# Backlog

Nothing in this file blocks V1.

These ideas may become useful only after we prove that source-of-truth warnings improve AI-generated UI changes.

## Product Integrations

### PR Comments

Post source-of-truth warnings directly on GitHub/GitLab PRs.

Wait because:

- needs auth and review UX
- noisy comments can damage trust
- CLI signal must be proven first

### VS Code Extension

Show warnings in editor.

Wait because:

- UI work before validation
- CLI output is enough for early users

### Claude Code / Cursor / Copilot Integration

Feed warnings directly into agent context.

Wait because:

- product should not depend on one agent
- CLI prompt snippet is enough for V1

## Broader Detection

### Design Token Enforcement

Detect hardcoded values that should use tokens.

Wait because:

- adjacent problem, not original problem
- likely better served by lint rules

### API Source-of-Truth Detection

Detect local API/client logic that should use shared API wrappers.

Wait because:

- different heuristics
- V1 should stay frontend-only

### State Ownership Detection

Detect duplicated local state that should come from shared store/cache.

Wait because:

- harder to infer safely
- higher false-positive risk

## Research Ideas

### Repository Intelligence

A broad system for repository self-knowledge.

Wait because:

- not needed to detect missed shared components
- too broad for MVP

### Intent Graph

Graph of concepts, intent, evidence, and implementation.

Wait because:

- V1 can use simple evidence bullets
- no graph needed

### Knowledge Graph

Repository-wide semantic graph.

Wait because:

- infrastructure before proof

### Repository Memory

Persistent claims and confidence over time.

Wait because:

- static diff warnings must prove useful first

### Belief Revision

Living evidence-backed claims that update as repo evolves.

Wait because:

- not required for one-shot source-of-truth warning

### Semantic Diff

Diff over meaning, not files.

Wait because:

- requires validated semantic layer

### Architectural Simulation

Predict future maintenance impact of changes.

Wait because:

- far beyond original failure

## Automation

### Auto-Fix

Automatically refactor duplicated screen patches into shared component.

Wait because:

- risky
- recommendation quality must be proven first

### CI Gate

Fail builds on source-of-truth violations.

Wait because:

- V1 warnings may be probabilistic
- enforcement requires high precision

### Suggested Patch Generation

Generate a proposed shared-component patch.

Wait because:

- code generation reintroduces agent complexity
- prompt snippet is simpler

## Future Frameworks

### Vue/Svelte/Angular Support

Wait because:

- React/TSX is enough to validate signal
- each framework needs separate parser conventions

### Design Tool Integration

Pull component intent from Figma/design systems.

Wait because:

- external API complexity
- code evidence should be tested first

## Rule

Do not move anything from backlog into V1 unless it directly improves this behavior:

```text
Claude changes the shared component instead of patching individual screens.
```

