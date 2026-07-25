# Product Evolution

## Original Problem

Claude keeps patching every screen instead of changing the shared component.

The first version of the problem was practical and narrow:

```text
An AI agent sees repeated UI issues across multiple screens.
It edits each screen locally.
It misses the shared component that should own the change.
The result is duplicated implementation, review churn, and architectural drift.
```

That remains the product's center.

## Insight 1: The Failure Is Not Just Code Quality

At first this looked like an ordinary code-quality issue: duplicated code, missed reuse, weak refactoring.

The better explanation is that the AI lacks the repository-local context needed to identify **source of truth**. It can see files. It often cannot infer which component is intended to be changed.

Practical conclusion:

```text
The product should expose likely source-of-truth components at the moment of change.
```

## Insight 2: "Architecture" Was Too Broad

We explored architectural governance: source of truth, design systems, tokens, APIs, state ownership, repository-wide impact.

That was useful background, but too broad for V1.

Practical conclusion:

```text
Do not build general architecture governance.
Start with shared UI component reuse.
```

## Insight 3: Intent Matters, But Only In A Narrow Form

The research introduced Intent Recoverability: can a future maintainer reconstruct why something exists and what should remain true?

For this product, the only intent we need in V1 is:

```text
This shared component appears to be the intended place for this UI behavior.
```

No general intent model is needed.

## Insight 4: Evidence Beats Assertions

Static docs like `README.md`, `CLAUDE.md`, and ADRs can say "use shared components," but they do not prove which component is relevant.

The useful product behavior is evidence-backed:

```text
This component is reused in 17 places.
These changed screens already resemble it.
The duplicated JSX/class structure appears in multiple leaf screens.
Therefore, inspect this shared component first.
```

Practical conclusion:

```text
Every warning must show evidence.
```

## Insight 5: The MVP Is Not Repository Intelligence

We considered repository memory, knowledge graphs, belief revision, semantic diff, IDE concepts, and long-term repository cognition.

Those ideas may matter later. They do not help us prove the product now.

Practical conclusion:

```text
V1 is a narrow analyzer that finds likely shared-component misses in a diff.
```

## Insight 6: The Output Must Be Usable By Humans And AI

The product should not just say "possible duplication."

It should give a developer something immediately useful:

```text
Change this shared component instead.
Here is why.
Here is the prompt to give Claude.
```

Practical conclusion:

```text
The primary artifact is an actionable source-of-truth warning.
```

## Current Product Shape

The product is a CLI that analyzes React/TypeScript UI diffs and warns when a change likely belongs in an existing shared component instead of multiple local screens.

It exists to answer one question:

```text
Can explicit shared-component guidance materially improve AI-generated code?
```

