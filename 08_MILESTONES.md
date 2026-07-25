# Milestones

Each milestone ends with demonstrable software.

## Milestone 1: CLI Skeleton

Demo:

```bash
component-intent-audit --help
component-intent-audit --version
npm test
```

Includes:

- package setup
- CLI entrypoint
- test runner
- build script

Done when:

- project installs cleanly
- CLI runs locally
- tests pass

## Milestone 2: Diff Reader

Demo:

```bash
component-intent-audit --diff --json
```

Shows changed TSX/JSX files.

Includes:

- Git root detection
- changed file reading
- UI file filtering
- ignore rules

Done when:

- changed UI files are listed
- non-UI files ignored
- generated/test/story files ignored

## Milestone 3: Component Inventory

Demo:

```bash
component-intent-audit --inventory
```

Shows components, paths, import counts, and likely roles.

Includes:

- TSX parsing
- imports/exports extraction
- component detection
- JSX/style extraction
- shared/leaf classification

Done when:

- fixture repository inventory is correct
- likely shared component classification works

## Milestone 4: Repeated Local Pattern Detection

Demo:

```bash
component-intent-audit --diff --json
```

Shows repeated UI signals in changed leaf files.

Includes:

- changed JSX/style signals
- repeated structure detection
- repeated class token detection

Done when:

- positive fixture detects repeated screen patches
- one-off local change does not trigger

## Milestone 5: Candidate Ranking

Demo:

```bash
component-intent-audit --diff --json
```

Shows ranked shared component candidates for repeated local patterns.

Includes:

- similarity scoring
- usage scoring
- candidate ranking
- ambiguity detection

Done when:

- expected shared component ranks first in positive fixture
- ambiguous fixture is marked ambiguous

## Milestone 6: Source-of-Truth Warning

Demo:

```bash
component-intent-audit --diff
```

Shows final actionable warning with evidence and AI prompt.

Includes:

- confidence calculation
- warning threshold
- evidence bullets
- recommendation
- prompt snippet
- text reporter

Done when:

- positive fixture emits a useful warning
- negative fixtures emit no warning

## Milestone 7: Output Modes And Config

Demo:

```bash
component-intent-audit --diff
component-intent-audit --diff --json
component-intent-audit --diff --markdown
```

Includes:

- JSON reporter
- Markdown reporter
- optional config file
- threshold config
- ignore config

Done when:

- output modes have snapshot tests
- config overrides defaults

## Milestone 8: Fixture Regression Suite

Demo:

```bash
npm test
```

Includes:

- positive fixture
- local one-off fixture
- generated file fixture
- ambiguous candidate fixture
- story/test fixture

Done when:

- end-to-end tests cover true positives and false positives

## Milestone 9: Dogfood Build

Demo:

Run on one real React repo and show:

- warnings
- no-warning cases
- false positives
- threshold notes

Includes:

- README quickstart
- example output
- limitations
- dogfood notes

Done when:

- at least one real repo has been tested
- findings are recorded
- tool is ready for engineer evaluation

