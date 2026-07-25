# MVP Spec: Shared Component Intent Auditor

## Objective

Answer one question:

> Can we materially improve AI-generated code by exposing architectural intent more explicitly than current repositories do?

Original failure:

> Claude keeps patching every screen instead of changing the shared component.

The MVP should detect when a change is likely duplicating or bypassing an existing shared UI component, then produce a concrete recommendation the developer can feed back into Claude or apply manually.

## Part I: Product Hypotheses

| Rank | Hypothesis | Confidence | Evidence | Cost To Validate | Easiest Experiment |
|---:|---|---:|---|---|---|
| 1 | AI agents miss shared components because repository intent is implicit. | High | Common behavior: agents patch local files found in context. | Low | Run same UI task with and without component-intent report. |
| 2 | A static component reuse report can reduce duplicated screen-level patches. | Medium-high | Reviewers often catch "use shared component" manually. | Low | Analyze PRs/diffs and compare recommendations to engineer judgment. |
| 3 | Imports, component names, props, and usage frequency are enough to identify likely source-of-truth components. | Medium | Design systems usually expose shared components through imports. | Medium | Build analyzer on 2-3 repos and inspect false positives. |
| 4 | Developers will use a concise "change this shared component instead" recommendation. | Medium | Actionable review comments already work. | Low | Output one recommendation per violation in PR/comment format. |
| 5 | AI output improves when given explicit source-of-truth guidance. | Medium | LLMs respond well to precise repo-local constraints. | Medium | A/B prompt: task only vs task + generated guidance. |
| 6 | Git history improves source-of-truth detection. | Low-medium | High-churn shared components may reveal centrality. | Medium | Compare import-only ranking vs import+history ranking. |
| 7 | Intent can be inferred reliably enough without human annotations. | Low-medium | Some source-of-truth is discoverable; some is social. | Medium | Measure expert agreement with inferred canonical components. |

Top validation target:

```text
Can a static analyzer identify "you should modify the shared component" often enough to change AI behavior?
```

## Part II: Kill The Vision

Smallest useful artifact:

> **CLI architectural auditor for React component reuse.**

Command:

```bash
component-intent-audit --diff
```

Why CLI:

- easiest to build
- works with any editor or agent
- can run before/after Claude changes
- no marketplace/plugin overhead
- no UI required
- easy to use in CI later
- weekend-buildable

Why not the others yet:

| Option | Wait Because |
|---|---|
| VS Code extension | UI work before proof. |
| Claude Code plugin | Ties validation to one agent. |
| Git hook | Too intrusive before trust. |
| PR reviewer | Needs GitHub integration/auth/noise handling. |
| Repository memory | Research system, not MVP. |
| Knowledge graph | Too much infrastructure. |
| Static report | Useful but less directly tied to developer action. |
| IDE | Completely premature. |

The CLI can later become a plugin, hook, or PR reviewer if the signal is real.

## Part III: One Killer Feature

Feature:

> **Detect local UI patches that should probably be made in a shared component instead.**

The MVP flags this pattern:

```text
Multiple screens/components implement similar UI structure or styling,
while an existing shared component appears to represent the same concept.
```

Primary use case:

Claude changes:

```text
screens/BillingSettings.tsx
screens/TeamSettings.tsx
screens/ProfileSettings.tsx
```

The auditor says:

```text
Likely source-of-truth violation:
These changes resemble shared component SettingsSection.

Recommendation:
Modify components/SettingsSection.tsx instead of patching 3 screens.

Evidence:
- SettingsSection is imported by 14 files.
- The changed files already use similar section markup.
- New duplicated class set appears in 3 screens.
- Shared component exposes title, description, actions props.
```

This directly attacks the original problem.

## Part IV: Inputs

Use only realistic data available today.

Required:

- file tree
- Git diff
- TypeScript/JSX files
- imports/exports
- component names
- JSX structure
- className/style props
- existing shared component usage

Optional but cheap:

- `README.md`
- `CLAUDE.md`
- design-system folders
- Storybook stories
- Git history for usage frequency/churn
- package aliases / tsconfig paths

Do not require:

- full knowledge graph
- human annotations
- semantic memory
- architecture database
- AI model calls
- editor integration
- issue/PR history
- design tool API

MVP should work offline.

## Part V: Outputs

Primary output:

> **Actionable source-of-truth warning.**

Format:

```text
SOURCE-OF-TRUTH WARNING

Changed files:
- src/screens/BillingSettings.tsx
- src/screens/TeamSettings.tsx
- src/screens/ProfileSettings.tsx

Likely shared component:
- src/components/settings/SettingsSection.tsx

Why:
- 3 changed files introduced similar JSX shape.
- Similar className set already exists in SettingsSection.
- SettingsSection is reused by 14 files.
- Changed files are screen-level leaves.

Recommendation:
Move the repeated change into SettingsSection or extend its props.

Prompt for AI:
"Do not patch each screen. Inspect src/components/settings/SettingsSection.tsx and make this behavior reusable there unless there is a distinct product reason not to."
```

Output modes:

```bash
component-intent-audit --diff
component-intent-audit --json
component-intent-audit --markdown
```

No dashboard.

## Part VI: Success Criteria

Test with 10 experienced engineers.

Ranked outcomes:

| Rank | Outcome | Success Bar |
|---:|---|---|
| 1 | Engineers agree recommendation is valid. | >=70% of warnings rated useful/actionable. |
| 2 | AI patches use shared component more often. | >=30% increase in shared-component edits vs screen patches in controlled tasks. |
| 3 | Fewer review comments about missed reuse. | >=25% reduction in "use shared component" comments on trial PRs. |
| 4 | Reduced prompt iterations. | Fewer follow-up prompts needed to redirect Claude. |
| 5 | Lower duplicate JSX/style introduction. | Measurable drop in repeated class/structure clones. |
| 6 | Low annoyance. | <=20% warnings marked noisy or wrong. |

Do not count:

- number of warnings
- lines analyzed
- components indexed
- CLI runs
- stars/downloads

Behavior change is the metric.

## Part VII: Explicitly Not Building

| Not Building | Why It Waits |
|---|---|
| Repository memory | Need proof that static source-of-truth hints help first. |
| Intent graph | Too abstract for MVP. |
| Knowledge graph | Infrastructure before signal. |
| Belief revision | No living claims until we know useful claims exist. |
| Repository conversations | UI/product layer after core signal. |
| Semantic diff | Requires stable claim model. |
| Architectural simulation | Far beyond original problem. |
| AI agent integration | CLI output is enough to test. |
| Full backend support | Start with React UI components only. |
| Design token enforcement | Related, but not the original failure. |
| API consistency | Different domain. |
| Auto-fix | Risky; recommendation first. |

## Part VIII: Technical Architecture

Boring weekend architecture:

```text
CLI
├─ load repo config
├─ parse changed files
├─ build component inventory
├─ detect repeated local UI patterns
├─ rank likely shared components
├─ emit warnings
└─ output AI-ready prompt snippet
```

Implementation choices:

| Need | Tool |
|---|---|
| CLI | Node.js |
| TS/JS parsing | TypeScript compiler API or ts-morph |
| JSX traversal | ts-morph |
| diff detection | `git diff --name-only`, `git diff` |
| similarity | simple structural hashing + token overlap |
| config | optional `component-intent.json` |
| output | plain text + JSON |

Minimal config:

```json
{
  "sharedComponentDirs": [
    "src/components",
    "src/ui",
    "src/design-system"
  ],
  "screenDirs": [
    "src/screens",
    "src/pages",
    "src/routes"
  ]
}
```

Detection heuristic:

1. Identify changed JSX files.
2. Classify files as leaf screens or shared components by path/import count.
3. Extract JSX subtrees and `className` tokens from changed hunks.
4. Find repeated structures across changed files.
5. Search shared component inventory for similar:
   - component name
   - prop names
   - JSX shape
   - className/style tokens
   - usage context
6. Rank candidate source-of-truth components.
7. Emit warning only above confidence threshold.

No ML required.

## Part IX: Failure Criteria

Abandon or radically change project if:

1. Engineers rate fewer than 50% of warnings useful.
2. Controlled AI tasks show no increase in shared-component edits.
3. False positives cause developers to distrust the tool.
4. Existing lint/static tools catch the same cases with less effort.
5. Prompt-only instruction like "look for shared components first" performs equally well.
6. Most target repos lack enough shared component structure to infer source of truth.
7. Recommendations are too obvious to be valuable.
8. Recommendations require human annotations before they work.
9. Similarity detection cannot distinguish intentional variants from duplication.
10. The tool catches problems only after code review would already catch them.

Strongest falsifier:

```text
Claude + a simple prompt rule performs as well as Claude + audit output.
```

If true, do not build product. Write the prompt rule.

## MVP Summary

Build:

```text
A CLI that detects when AI-generated UI changes patch multiple leaf screens instead of modifying or extending a likely shared React component.
```

Primary command:

```bash
component-intent-audit --diff
```

Primary output:

```text
You are patching repeated UI locally.
The likely source of truth is X.
Change X instead.
Here is the evidence.
Here is a prompt to give the AI.
```

What we learn:

```text
Does explicit architectural intent, extracted from the repo, materially improve AI-generated code reuse?
```

That is the smallest product that tests the thesis.

