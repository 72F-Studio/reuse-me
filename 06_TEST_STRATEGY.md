# Test Strategy

## Goals

Tests should prove:

- parser behavior is stable
- component classification is explainable
- source-of-truth warnings fire on intended cases
- false positives are suppressed
- output is stable enough for developers and future integrations

## Unit Tests

### Config

Test:

- defaults load
- user config merges
- invalid config errors clearly
- ignore globs apply

### Git/Diff

Test:

- changed TSX files detected
- deleted files skipped
- non-UI files ignored
- generated/test/story files ignored

### Parser

Test:

- function components
- arrow components
- default exports
- named exports
- imports
- JSX fragments
- nested JSX
- className string literals
- simple template literals
- dynamic className safely skipped

### Inventory

Test:

- import counts
- likely shared classification
- likely leaf classification
- unknown classification

### Similarity

Test:

- JSX overlap
- style token overlap
- name similarity
- prop similarity
- deterministic scoring

### Confidence

Test:

- repeated change increases confidence
- ambiguity decreases confidence
- no candidate yields no warning
- threshold boundaries

### Output

Test:

- text output includes evidence and prompt
- JSON schema stable
- Markdown renders readable report

## Integration Tests

Run the CLI against fixture repositories.

### Positive Fixture: Simple Shared Component

Scenario:

- `SettingsSection` exists in shared components
- three screens duplicate settings section markup

Expected:

- one warning
- `SettingsSection` ranked first
- confidence >= warning threshold

### Negative Fixture: One-Off Local Change

Scenario:

- one screen changes route-specific UI

Expected:

- no warning

### Negative Fixture: Generated Files

Scenario:

- generated TSX files changed

Expected:

- ignored
- no warning

### Negative Fixture: Ambiguous Candidates

Scenario:

- two shared components match equally

Expected:

- no default warning or low-confidence note only

### Negative Fixture: Test/Story Changes

Scenario:

- only `.test.tsx` or `.stories.tsx` changed

Expected:

- no warning

## Regression Tests

Every false positive or false negative found during dogfooding should become a fixture.

Regression fixture names should describe behavior:

```text
does-not-warn-on-copy-only-change
warns-on-repeated-empty-state
suppresses-ambiguous-card-components
```

## False-Positive Tests

Required false-positive classes:

- local one-off route UI
- generated files
- copy-only changes
- formatting-only changes
- story/test changes
- intentionally distinct components
- ambiguous candidates

## False-Negative Tests

Required true-positive classes:

- repeated section markup
- repeated empty state
- repeated error state
- repeated class token group
- repeated local wrapper matching shared component

## Performance Tests

V1 does not need heavy optimization, but should avoid being annoying.

Test on synthetic repo:

- 500 TSX files
- 1,000 components
- 20 changed files

Target:

```text
complete under 5 seconds on typical developer laptop
```

If performance fails, first optimize file scanning and parsing. Do not add a persistent cache in V1 unless absolutely necessary.

## Manual Tests

Manual test checklist before release:

1. Run on fixture repo with known warning.
2. Run on repo with no UI changes.
3. Run with invalid config.
4. Run with JSON output.
5. Run with Markdown output.
6. Paste generated prompt into Claude and verify it is understandable.

