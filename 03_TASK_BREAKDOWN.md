# Task Breakdown

## T01: Initialize Package

Objective: Create working TypeScript CLI project.

Files:

- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `tsup.config.ts`
- `src/cli.ts`
- `src/index.ts`

Dependencies: none

Acceptance criteria:

- `npm test` runs
- `npm run build` succeeds
- `component-intent-audit --help` works locally

Manual test:

```bash
npm install
npm test
npm run build
node dist/cli.js --help
```

Estimated complexity: S

## T02: Add Default Configuration Model

Objective: Define config defaults and config interface.

Files:

- `src/model/config.ts`
- `src/config/defaults.ts`

Dependencies: T01

Acceptance criteria:

- default shared dirs, screen dirs, ignore globs, confidence thresholds exist
- config unit test validates defaults

Manual test:

```bash
npm test -- config
```

Estimated complexity: S

## T03: Load Optional Config File

Objective: Load `component-intent.json` from repo root when present.

Files:

- `src/config/loadConfig.ts`
- `src/model/config.ts`
- `test/unit/loadConfig.test.ts`

Dependencies: T02

Acceptance criteria:

- missing config returns defaults
- present config merges with defaults
- invalid JSON produces clear error

Manual test:

```bash
echo '{"screenDirs":["app/routes"]}' > component-intent.json
npm run dev -- --show-config
```

Estimated complexity: S

## T04: Find Git Repository Root

Objective: Determine repository root from current working directory.

Files:

- `src/git/repoRoot.ts`
- `test/unit/repoRoot.test.ts`

Dependencies: T01

Acceptance criteria:

- returns root inside Git repo
- clear error outside Git repo

Manual test:

```bash
npm run dev -- --diff
```

Estimated complexity: S

## T05: Read Changed Files From Git Diff

Objective: List changed files for working tree diff.

Files:

- `src/git/diffReader.ts`
- `src/model/diff.ts`
- `test/integration/diffReader.test.ts`

Dependencies: T04

Acceptance criteria:

- returns changed files
- filters deleted files safely
- can include staged/unstaged if V1 chooses one mode; document behavior

Manual test:

```bash
git diff --name-only
npm run dev -- --diff --json
```

Estimated complexity: M

## T06: Filter UI Files

Objective: Filter changed files to `.tsx` and `.jsx`, excluding ignored patterns.

Files:

- `src/git/diffReader.ts`
- `src/config/defaults.ts`
- `test/unit/diffFilter.test.ts`

Dependencies: T05

Acceptance criteria:

- TSX/JSX included
- tests/stories/generated/build files ignored by default
- config ignore globs respected

Manual test:

```bash
npm run dev -- --diff --json
```

Estimated complexity: S

## T07: Parse Source File

Objective: Parse TSX file using `ts-morph`.

Files:

- `src/parser/sourceFileParser.ts`
- `test/unit/sourceFileParser.test.ts`

Dependencies: T01

Acceptance criteria:

- parses valid TSX
- reports parse failure with file path
- does not crash on unsupported syntax

Manual test:

```bash
npm test -- sourceFileParser
```

Estimated complexity: M

## T08: Extract Imports And Exports

Objective: Extract imported module specifiers and exported component names.

Files:

- `src/parser/importExportExtractor.ts`
- `src/model/component.ts`
- `test/unit/importExportExtractor.test.ts`

Dependencies: T07

Acceptance criteria:

- default exports detected
- named exports detected
- import module paths detected

Manual test:

```bash
npm test -- importExportExtractor
```

Estimated complexity: M

## T09: Detect Component Declarations

Objective: Identify likely React component declarations.

Files:

- `src/parser/sourceFileParser.ts`
- `src/model/component.ts`
- `test/unit/componentDetection.test.ts`

Dependencies: T07

Acceptance criteria:

- function components detected
- arrow function components detected
- exported components linked to file
- non-component helpers ignored where practical

Manual test:

```bash
npm test -- componentDetection
```

Estimated complexity: M

## T10: Extract JSX Fingerprints

Objective: Create stable fingerprints from JSX structure.

Files:

- `src/parser/jsxExtractor.ts`
- `src/model/component.ts`
- `test/unit/jsxExtractor.test.ts`

Dependencies: T07

Acceptance criteria:

- extracts tag/component sequence
- extracts nesting shape summary
- ignores text content by default
- handles fragments

Manual test:

```bash
npm test -- jsxExtractor
```

Estimated complexity: M

## T11: Extract Class And Style Tokens

Objective: Extract static `className` and simple style keys.

Files:

- `src/parser/jsxExtractor.ts`
- `test/unit/styleTokenExtractor.test.ts`

Dependencies: T10

Acceptance criteria:

- extracts string literal className tokens
- extracts template literal static tokens where simple
- extracts inline style property names
- safely skips dynamic expressions

Manual test:

```bash
npm test -- styleTokenExtractor
```

Estimated complexity: M

## T12: Build Component Inventory

Objective: Scan repository and build in-memory component metadata.

Files:

- `src/inventory/buildInventory.ts`
- `src/model/component.ts`
- `test/integration/buildInventory.test.ts`

Dependencies: T08, T09, T10, T11

Acceptance criteria:

- scans configured source dirs
- records components, paths, imports, exports, fingerprints
- computes import counts

Manual test:

```bash
npm run dev -- --inventory --json
```

Estimated complexity: M

## T13: Classify Component Role

Objective: Classify files/components as likely shared, leaf, or unknown.

Files:

- `src/inventory/classifyComponent.ts`
- `test/unit/classifyComponent.test.ts`

Dependencies: T12, T02

Acceptance criteria:

- path-based classification works
- import-count signal works
- ambiguous files classified unknown

Manual test:

```bash
npm run dev -- --inventory
```

Estimated complexity: M

## T14: Extract Changed JSX Signals

Objective: Build changed-file signals from diff and parsed source.

Files:

- `src/analysis/changedJsx.ts`
- `src/model/diff.ts`
- `test/unit/changedJsx.test.ts`

Dependencies: T05, T10, T11

Acceptance criteria:

- changed TSX files produce JSX/style signals
- non-UI changes produce empty signals
- failures are non-fatal

Manual test:

```bash
npm run dev -- --diff --json
```

Estimated complexity: M

## T15: Detect Repeated Local Patterns

Objective: Detect repeated JSX/class/style signals across changed leaf files.

Files:

- `src/analysis/changedJsx.ts`
- `test/unit/repeatedPatterns.test.ts`

Dependencies: T13, T14

Acceptance criteria:

- repeated class tokens across 2+ leaf files detected
- repeated JSX shape across 2+ leaf files detected
- single-file changes do not trigger by default

Manual test:

```bash
npm test -- repeatedPatterns
```

Estimated complexity: M

## T16: Compute Similarity

Objective: Compare changed signals against candidate shared components.

Files:

- `src/analysis/similarity.ts`
- `src/model/similarity.ts`
- `test/unit/similarity.test.ts`

Dependencies: T12, T15

Acceptance criteria:

- class token overlap score
- JSX fingerprint overlap score
- prop/name lightweight score if available
- deterministic output

Manual test:

```bash
npm test -- similarity
```

Estimated complexity: M

## T17: Rank Candidate Components

Objective: Rank likely source-of-truth components.

Files:

- `src/analysis/rankCandidates.ts`
- `test/unit/rankCandidates.test.ts`

Dependencies: T13, T16

Acceptance criteria:

- broadly imported shared component ranks above leaf screen
- imported-by-changed-file boosts rank
- ambiguous tied candidates marked as ambiguous

Manual test:

```bash
npm test -- rankCandidates
```

Estimated complexity: M

## T18: Calculate Confidence

Objective: Convert evidence signals into bounded confidence.

Files:

- `src/analysis/confidence.ts`
- `src/model/warning.ts`
- `test/unit/confidence.test.ts`

Dependencies: T17

Acceptance criteria:

- score in 0-1 range
- repeated local changes increase score
- ambiguity lowers score
- generated/test/story files do not contribute

Manual test:

```bash
npm test -- confidence
```

Estimated complexity: S

## T19: Generate Warnings

Objective: Generate source-of-truth warnings above threshold.

Files:

- `src/analysis/generateWarnings.ts`
- `src/model/warning.ts`
- `test/unit/generateWarnings.test.ts`

Dependencies: T15, T17, T18

Acceptance criteria:

- warning includes changed files, candidate, confidence, evidence, recommendation, prompt
- no warning below threshold
- ambiguous candidate warning suppressed by default

Manual test:

```bash
npm run dev -- --diff
```

Estimated complexity: M

## T20: Text Reporter

Objective: Print useful default warning output.

Files:

- `src/output/textReporter.ts`
- `test/unit/textReporter.test.ts`

Dependencies: T19

Acceptance criteria:

- output matches product spec
- no warnings prints calm success message
- prompt snippet included

Manual test:

```bash
npm run dev -- --diff
```

Estimated complexity: S

## T21: JSON Reporter

Objective: Emit machine-readable warnings.

Files:

- `src/output/jsonReporter.ts`
- `test/unit/jsonReporter.test.ts`

Dependencies: T19

Acceptance criteria:

- stable JSON schema
- includes warnings array
- includes config summary

Manual test:

```bash
npm run dev -- --diff --json
```

Estimated complexity: S

## T22: Markdown Reporter

Objective: Emit Markdown suitable for PR comments/manual sharing.

Files:

- `src/output/markdownReporter.ts`
- `test/unit/markdownReporter.test.ts`

Dependencies: T19

Acceptance criteria:

- valid Markdown
- evidence bullets readable
- prompt snippet fenced

Manual test:

```bash
npm run dev -- --diff --markdown
```

Estimated complexity: S

## T23: End-To-End Positive Fixture

Objective: Add fixture repo where repeated screen patches should warn.

Files:

- `test/fixtures/simple-shared-component/`
- `test/integration/e2ePositive.test.ts`

Dependencies: T20

Acceptance criteria:

- CLI emits one warning
- expected shared component ranks first
- confidence above warning threshold

Manual test:

```bash
npm test -- e2ePositive
```

Estimated complexity: M

## T24: End-To-End Negative Fixtures

Objective: Add fixtures for no-warning cases.

Files:

- `test/fixtures/no-warning-local-change/`
- `test/fixtures/ambiguous-candidates/`
- `test/fixtures/generated-files/`
- `test/integration/e2eNegative.test.ts`

Dependencies: T20

Acceptance criteria:

- local one-off change does not warn
- ambiguous candidates suppressed
- generated files ignored

Manual test:

```bash
npm test -- e2eNegative
```

Estimated complexity: M

## T25: README Usage

Objective: Document install, run, output, and limitations.

Files:

- `README.md`
- `docs/examples.md`

Dependencies: T20, T21, T22

Acceptance criteria:

- quickstart works
- limitations are explicit
- example warning included

Manual test:

```bash
npm run build
node dist/cli.js --help
```

Estimated complexity: S

## T26: Dogfood On Real Repo

Objective: Run on at least one real React repo and record results.

Files:

- `docs/dogfood-notes.md`

Dependencies: T23, T24

Acceptance criteria:

- at least 5 diffs or synthetic tasks reviewed
- false positives documented
- threshold tuning decisions recorded

Manual test:

```bash
npm run dev -- --diff
```

Estimated complexity: M

