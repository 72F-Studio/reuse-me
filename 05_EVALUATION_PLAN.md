# Evaluation Plan

## Goal

Prove or disprove:

```text
Explicit shared-component guidance improves AI-generated UI changes.
```

The product works only if it changes behavior, not if it produces plausible reports.

## Benchmarks

### Benchmark 1: Historical Diff Audit

Use prior PRs or commits where reviewers requested shared-component reuse.

Measure:

- did the tool flag the issue?
- was the suggested component correct?
- would the warning have been actionable before review?

Success:

```text
>=60% recall on known missed-reuse cases
>=70% precision on emitted warnings
```

### Benchmark 2: Controlled AI Tasks

Create UI change tasks in repos with known shared components.

Run each task in two conditions:

1. Claude receives task only.
2. Claude receives task plus tool output.

Measure:

- whether Claude edits shared component
- whether it patches screens locally
- number of prompt iterations
- review quality

Success:

```text
>=30% increase in correct shared-component edits
```

### Benchmark 3: Prompt-Only Baseline

Compare against a simple instruction:

```text
Before editing screens, look for an existing shared component and modify that instead.
```

Success requires tool output to outperform prompt-only.

If prompt-only performs equally well, do not build product.

### Benchmark 4: Existing Linter Baseline

Compare warnings against:

- ESLint rules
- duplicate-code tools
- design-system lint rules if present
- existing CI checks

Success requires the tool to catch useful cases not already caught by existing tools.

### Benchmark 5: Human Reviewer Comparison

Ask experienced engineers to review the same diffs.

Compare:

- tool warnings vs reviewer comments
- missed warnings
- false positives
- usefulness ratings

Success:

```text
>=70% of tool warnings rated useful/actionable
<=20% rated noisy/wrong
```

## Primary Success Metrics

Ranked:

1. More AI-generated patches modify shared components instead of screens.
2. Fewer duplicated local UI implementations are introduced.
3. Fewer reviewer comments say "use the shared component."
4. Fewer follow-up prompts are needed to redirect AI.
5. Engineers rate warnings as actionable.

## Failure Criteria

Abandon or pivot if:

1. Prompt-only performs as well as tool-guided output.
2. Existing linters catch the same issues.
3. Engineers rate fewer than 50% of warnings useful.
4. False positives exceed 30%.
5. AI ignores or misuses the recommendation.
6. Most warnings require manual repo annotations.
7. Detection works only on toy examples.
8. Suggested components are often wrong.
9. Reviewers still need to explain the same source-of-truth issue.
10. The tool is slower than simply asking a senior engineer.

## Evaluation Dataset

Minimum dataset:

- 3 real React repositories
- 10-20 AI-generated UI tasks
- 20 historical PRs or diffs
- at least 2 experienced reviewers per repo

Avoid only testing on examples designed for the tool.

## Reporting

Report:

- precision
- recall on known missed-reuse cases
- AI shared-component edit rate
- prompt iteration count
- reviewer usefulness rating
- false-positive examples
- false-negative examples

Do not hide failures. False negatives and false positives decide whether V2 is worth building.

