# Risk Register

## Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TSX parsing fails on real-world syntax | Medium | Medium | Use `ts-morph`; fail per-file, not whole run; add fixtures from real code. |
| Path aliases make import counting inaccurate | Medium | Medium | Support tsconfig paths later if needed; start with relative/basic module matching. |
| Monorepos are slow to scan | Medium | Medium | Respect config dirs and ignore globs; avoid persistent cache in V1 unless needed. |
| Git diff parsing misses staged/unstaged nuance | Medium | Low | Document V1 behavior; add explicit flag later if needed. |
| Dynamic className patterns are hard to parse | High | Low | Extract only simple static tokens; do not overclaim. |

## Algorithmic Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| False positives annoy developers | Medium | High | Conservative thresholds; suppress ambiguous cases; show evidence. |
| False negatives miss many real cases | Medium | Medium | Accept early; add regressions from dogfood. |
| Similar visual components are intentional variants | Medium | High | Lower confidence for distinct names/props; wording says "inspect," not "must." |
| Shared component ranking picks wrong source | Medium | High | Require multiple evidence signals; include confidence and candidate path. |
| Usage count overvalues old bad components | Medium | Medium | Combine usage with structure and path; do not rank by usage alone. |
| Single-screen source-of-truth misses are ignored | Medium | Low | V1 prioritizes repeated local patches; add later only if signal demands it. |

## UX Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Output is too verbose | Medium | Medium | Default to one concise warning with evidence bullets and prompt. |
| Developers do not know what to do next | Low | High | Include explicit recommendation and AI-ready prompt. |
| Confidence looks like false precision | Medium | Medium | Explain confidence as warning strength; show evidence. |
| CLI workflow is too manual | Medium | Low | Accept for MVP; integration waits until signal is proven. |

## Validation Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Prompt-only baseline performs equally well | Medium | High | Run benchmark early; abandon product if true. |
| Existing linters catch same problems | Low-medium | High | Compare against lint/static tools in evaluation. |
| Engineers disagree on correct shared component | Medium | Medium | Track agreement; ambiguous cases should suppress warnings. |
| Real repos lack clear shared component structure | Medium | Medium | Test on multiple repos before building integrations. |
| AI ignores generated prompt | Medium | High | Measure controlled tasks; improve prompt wording only if detection is useful. |

## Product Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scope expands into architecture platform | High | High | Enforce V1 question: does this help Claude change shared component? |
| Tool becomes reportware | Medium | Medium | Output must include next action, not just analysis. |
| Requires manual annotations to work | Medium | High | V1 must work from code evidence; annotations are not allowed. |
| Too React-specific | High | Low | Accept for V1; prove signal before generalizing. |

