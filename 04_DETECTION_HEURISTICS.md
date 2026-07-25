# Detection Heuristics

This is the core of V1.

The system should answer one question:

```text
Does this diff appear to patch leaf screens where an existing shared component should probably be changed instead?
```

The tool should not claim certainty. It should produce evidence-backed warnings.

## 1. Identify Candidate Shared Components

A file is more likely to contain shared components when it has one or more of these signals:

| Signal | Meaning |
|---|---|
| Located under `components`, `ui`, `design-system`, `shared`, `common` | path suggests reuse |
| Exported component is imported by multiple files | actual reuse |
| Has Storybook story | design-system or reusable component |
| Has tests focused on props/variants | reusable API surface |
| Accepts generic props like `title`, `description`, `children`, `actions`, `variant`, `size` | configurable component |
| Does not import route/page-specific modules | lower-level component |
| File name is generic rather than feature-specific | possible shared abstraction |

Negative signals:

| Signal | Meaning |
|---|---|
| Located under `pages`, `routes`, `screens`, `views` | likely leaf screen |
| Imports route params, loaders, API calls, or feature-specific stores | likely leaf |
| Component name includes page/screen/view | likely leaf |
| Imported by zero or one file | less likely source of truth |

## 2. Distinguish Screens From Reusable Components

A changed file is treated as a likely screen/leaf when:

- path matches screen/page/route conventions
- it is imported by router/navigation code
- it imports many shared components but is rarely imported itself
- it contains data fetching or route-specific state
- it composes multiple UI sections
- its component name ends with `Page`, `Screen`, `View`, `Route`, `Panel`

A file is treated as likely reusable when:

- it is imported by multiple files
- it exports a generic component
- it receives display data through props
- it has variants
- it has no route ownership
- it appears in Storybook or component tests

Ambiguous files should lower confidence, not force classification.

## 3. Detect Repeated Local UI Changes

Warn only when the diff shows evidence of local repetition.

Signals:

| Signal | Example |
|---|---|
| Same or similar JSX subtree added to multiple changed files | repeated wrappers, headers, sections |
| Same className tokens added in multiple changed files | layout/styling duplicated |
| Same prop pattern repeated | `title`, `description`, `actions` repeated |
| Same conditional UI added across screens | duplicated empty/loading/error state |
| Same markup appears in changed files and existing shared component | likely missed reuse |

Do not warn for:

- one changed leaf file only, unless similarity to a shared component is very high
- pure copy changes
- test updates
- story updates
- intentionally different variants
- generated files

## 4. Rank Candidate Source-of-Truth Components

Candidate score should combine evidence.

Strong positive signals:

| Signal | Weight |
|---|---:|
| candidate imported by one or more changed files | high |
| candidate imported by many files globally | high |
| candidate JSX structure overlaps changed JSX | high |
| candidate class/style tokens overlap changed tokens | medium |
| candidate name semantically matches repeated UI | medium |
| candidate props match repeated literals/structure | medium |
| candidate lives in configured shared component directory | medium |
| candidate has Storybook/test coverage | medium |

Negative signals:

| Signal | Weight |
|---|---:|
| candidate is itself a page/screen | high negative |
| candidate is imported by only one file | medium negative |
| candidate has feature-specific dependencies | medium negative |
| candidate has no JSX similarity | high negative |
| candidate appears deprecated or unused | medium negative |

The top candidate should only be shown when it clears a confidence threshold.

## 5. Confidence Calculation

Confidence is not truth. It is warning strength.

Use a simple bounded score:

```text
confidence =
  repeated_change_score
+ shared_component_score
+ similarity_score
+ usage_score
- ambiguity_penalty
- intentional_variant_penalty
```

Suggested interpretation:

| Confidence | Behavior |
|---:|---|
| < 0.50 | no warning |
| 0.50-0.69 | low-confidence note, JSON only by default |
| 0.70-0.84 | warning |
| >= 0.85 | strong warning |

Confidence should be lowered when:

- only one file changed
- candidate component is ambiguous
- multiple candidates score similarly
- changed files are not clearly screens
- candidate is not currently imported anywhere near changed files
- repeated code is small or trivial

## 6. Warning Generation

A warning requires:

1. at least one changed leaf/screen file
2. evidence of repeated or shared-component-like UI change
3. at least one plausible shared component candidate
4. confidence above threshold
5. a concrete next action

Every warning should include:

- changed files
- likely shared component
- confidence
- evidence bullets
- recommendation
- AI-ready prompt

Do not emit abstract warnings like:

```text
Possible duplication detected.
```

Emit actionable warnings like:

```text
This repeated settings section likely belongs in SettingsSection.
```

## 7. False Positive Reduction

Suppress or lower confidence for:

- files under `__generated__`, `generated`, `.next`, `dist`, `build`
- tests and stories unless explicitly enabled
- CSS-only changes without repeated UI structure
- repeated code smaller than a minimum threshold
- mass formatting changes
- imports-only changes
- copy/text-only changes
- one-off route-specific UI
- components with distinct names and distinct props despite visual similarity

When multiple candidates tie, report uncertainty:

```text
Two possible shared components match this change.
No source-of-truth warning emitted by default.
```

## 8. Evidence Quality

Prefer evidence in this order:

1. candidate already imported by changed files
2. candidate imported broadly
3. JSX structural overlap
4. class/style overlap
5. prop/name similarity
6. path convention
7. Storybook/test existence

Path convention alone should never produce a warning.

## 9. Output Prompt Heuristic

Generated AI prompt should be short and specific:

```text
Do not patch each screen independently. Inspect <component> and make this behavior reusable there unless there is a distinct product reason not to.
```

The prompt should include one component path, not a long report.

## 10. Principle

The tool should be conservative.

Missing some true positives is acceptable in V1. Noisy warnings will kill adoption faster than incomplete coverage.

