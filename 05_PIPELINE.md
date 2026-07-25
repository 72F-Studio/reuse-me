# Analysis Pipeline

## Pipeline Summary

```text
Repository discovery
-> Component indexing
-> Diff analysis
-> Similarity detection
-> Candidate ranking
-> Confidence calculation
-> Warning generation
-> Output formatting
```

Each stage should have one responsibility and be independently testable.

## 1. Repository Discovery

Responsibility:

- locate Git repository root
- load optional config
- find source files
- apply ignore rules

Inputs:

- current working directory
- optional `component-intent.json`

Outputs:

- repository root
- analyzer config
- file list

Failure behavior:

- outside Git repo: clear error
- invalid config: clear error
- no TSX/JSX files: no warnings

## 2. Component Indexing

Responsibility:

- parse repository TSX/JSX files
- extract components
- extract imports/exports
- extract JSX fingerprints
- extract style tokens
- classify likely role
- compute import counts

Inputs:

- file list
- config

Outputs:

- `ComponentInventory`

Important rule:

Indexing should not produce warnings. It only describes components.

## 3. Diff Analysis

Responsibility:

- read Git diff
- identify changed UI files
- parse changed files
- extract changed UI signals
- classify changed files as likely leaf/shared/unknown

Inputs:

- Git diff
- component inventory
- config

Outputs:

- changed UI signals

Important rule:

No warning should be emitted for ignored/generated/test/story files.

## 4. Repeated Local Pattern Detection

Responsibility:

- detect repeated JSX structures across changed leaf files
- detect repeated style/class tokens
- detect repeated local markup that resembles shared-component behavior

Inputs:

- changed UI signals

Outputs:

- repeated local pattern groups

Important rule:

This stage should be conservative. One changed leaf file usually should not warn.

## 5. Similarity Detection

Responsibility:

- compare repeated local patterns against likely shared components
- compute overlap scores
- collect evidence for matches

Inputs:

- repeated local patterns
- component inventory

Outputs:

- similarity results

Signals:

- JSX structure overlap
- style token overlap
- component name similarity
- prop similarity
- usage proximity

## 6. Candidate Ranking

Responsibility:

- rank likely source-of-truth components
- penalize poor candidates
- detect ambiguity

Inputs:

- similarity results
- component metadata

Outputs:

- candidate rankings

Ranking should prefer:

- broadly reused shared components
- candidates imported near changed files
- candidates with structural overlap
- candidates in shared component directories

Ranking should penalize:

- page/screen files
- low-usage components
- feature-specific components
- ambiguous ties

## 7. Confidence Calculation

Responsibility:

- turn ranking and evidence into warning confidence
- decide whether to suppress, note, warn, or strong-warn

Inputs:

- candidate ranking
- repeated pattern evidence
- ambiguity signals

Outputs:

- confidence score

Guideline:

Confidence should explain itself through contributors and penalties.

## 8. Warning Generation

Responsibility:

- create actionable warnings
- include evidence
- include recommendation
- include AI-ready prompt

Inputs:

- confidence score
- top candidate
- changed files
- evidence

Outputs:

- `SourceOfTruthWarning[]`

Warning must answer:

```text
What changed locally?
Which shared component should be inspected?
Why?
What should the developer or AI do next?
```

## 9. Output Formatting

Responsibility:

- format analysis result for humans or machines

Modes:

- text
- JSON
- Markdown

Inputs:

- `AnalysisResult`

Outputs:

- stdout content

Important rule:

Reporters must not contain analysis logic.

