# Product Vision

## Problem

AI coding agents frequently apply UI changes locally across multiple screens instead of modifying the shared component that owns the behavior.

This creates:

- duplicated JSX and styling
- inconsistent UI behavior
- missed design-system reuse
- repeated code review comments
- future maintenance cost
- extra prompt iterations to redirect the agent

The root issue is not that the AI cannot write code. The issue is that the repository's source-of-truth structure is implicit.

## Goal

Help developers and AI identify and modify the correct shared component instead of introducing local implementations.

V1 should answer:

```text
When a diff changes screen-level UI, is there an existing shared component that probably should own this change?
```

## Target Users

Primary users:

- developers using Claude, Cursor, Copilot, or other AI coding agents
- frontend engineers reviewing AI-generated UI changes
- small teams with reusable React component libraries

Secondary users:

- tech leads trying to reduce duplicated UI patches
- design-system maintainers
- reviewers who repeatedly leave "use the shared component" comments

## Non-Goals

V1 will not:

- build Repository Intelligence
- build a knowledge graph
- store semantic memory
- infer general architectural intent
- enforce design tokens
- analyze backend APIs
- write code automatically
- replace code review
- become an IDE
- integrate with every AI tool
- support every frontend framework

If a feature does not directly help Claude change the shared component instead of patching individual screens, it does not belong in V1.

## Success Metrics

Primary success:

- AI-generated patches modify shared components more often when the tool output is provided.

Secondary success:

- fewer duplicated local UI implementations
- fewer review comments about missed component reuse
- fewer prompt iterations needed to redirect AI
- engineers rate warnings as actionable
- low false-positive rate

Non-success metrics:

- number of files analyzed
- number of warnings produced
- number of components indexed
- CLI usage count without behavior change

## Product Philosophy

### Be Narrow

The product exists for one behavior: redirect local UI patches toward the likely shared component.

### Show Evidence

Every recommendation must explain why the component is likely the source of truth.

### Prefer Suggestions Over Enforcement

V1 should guide, not block. Developers must be able to ignore a warning when the local change is intentional.

### Work With Existing Repositories

No annotations, migrations, databases, or setup projects should be required before the first useful result.

### Output For The Next Action

The warning should be useful in code review and directly pasteable into an AI prompt.

### Stay Boring

Static analysis and simple heuristics first. No model calls, no embeddings, no graph database.

