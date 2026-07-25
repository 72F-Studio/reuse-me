# Implementation Phases

Each phase should produce working software and take small steps. Prefer stopping points that can be demonstrated from the CLI or tests.

## Phase 0: Project Skeleton

Time: 1-2 hours

Artifact:

```bash
component-intent-audit --help
```

Includes:

- package setup
- TypeScript config
- Vitest config
- CLI entrypoint
- placeholder command

Test:

- CLI prints help
- unit test runner works

## Phase 1: Repository And Diff Reading

Time: 1-2 hours

Artifact:

```bash
component-intent-audit --diff --json
```

Prints changed TSX/JSX files and diff metadata.

Includes:

- find Git root
- read changed files
- filter JSX/TSX
- basic JSON output

Test:

- fixture repo with changed TSX files
- fixture repo with non-UI changes ignored

## Phase 2: Parse Components

Time: 2-3 hours

Artifact:

CLI can list discovered components in changed files and shared dirs.

Includes:

- parse TSX
- extract imports
- extract exports
- detect component declarations
- extract basic JSX fingerprints
- extract className tokens

Test:

- unit tests for parser fixtures

## Phase 3: Build Component Inventory

Time: 2-3 hours

Artifact:

CLI can print component inventory:

```text
Component, path, imports, exported, likelyRole
```

Includes:

- scan source files
- count imports
- classify likely shared vs likely leaf
- apply config dirs

Test:

- fixture with shared component imported by screens
- classification expectations

## Phase 4: Detect Repeated Local UI Changes

Time: 2-3 hours

Artifact:

CLI can detect repeated JSX/class changes across multiple changed leaf screens.

Includes:

- changed JSX extraction
- repeated class token detection
- repeated JSX shape detection
- suppress tests/stories/generated files

Test:

- positive fixture with repeated local patches
- negative fixture with single local change

## Phase 5: Rank Shared Component Candidates

Time: 2-3 hours

Artifact:

CLI can suggest likely shared component candidates for repeated local changes.

Includes:

- similarity scoring
- usage scoring
- path scoring
- candidate ranking

Test:

- fixture where `SettingsSection` should rank first
- ambiguous candidates produce low confidence

## Phase 6: Confidence And Warning Generation

Time: 2-3 hours

Artifact:

CLI emits source-of-truth warnings.

Includes:

- confidence calculation
- warning threshold
- evidence bullets
- recommendation
- AI-ready prompt

Test:

- strong warning fixture
- no-warning fixture
- ambiguous fixture

## Phase 7: Output Modes

Time: 1-2 hours

Artifact:

```bash
component-intent-audit --diff
component-intent-audit --diff --json
component-intent-audit --diff --markdown
```

Includes:

- text reporter
- JSON reporter
- Markdown reporter
- stable output schemas

Test:

- snapshot tests for each output mode

## Phase 8: Config And Ignore Rules

Time: 1-2 hours

Artifact:

Tool respects optional `component-intent.json`.

Includes:

- shared component dirs
- screen dirs
- ignore globs
- confidence threshold

Test:

- config overrides defaults
- ignored files excluded

## Phase 9: End-To-End Fixture Tests

Time: 2-3 hours

Artifact:

Full pipeline tested against fixture repositories.

Includes:

- positive missed shared component
- no warning for local one-off
- generated files ignored
- ambiguous candidates suppressed

Test:

- integration tests run CLI against fixture repos

## Phase 10: Dogfood And Tune

Time: variable, keep first pass under 3 hours

Artifact:

Run against 1-2 real repos and record false positives/negatives.

Includes:

- tune thresholds
- improve evidence wording
- document known limitations

Test:

- manual review of warnings

