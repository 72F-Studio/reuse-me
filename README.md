# reuse-me

**AI coding agents keep rebuilding the button you already have.**

Ask an agent for a settings screen and it writes a button inline. Ask for a
checkout screen and it writes that button again, slightly different. Nothing
is broken, no test fails, and six months later a brand colour change is a
forty-file archaeology exercise instead of one token edit.

This is a local, deterministic CLI that **stops** those re-implementations
before they are written, and finds the ones already there — in any language,
with no model calls.

## Before / after

An agent writes a third screen. The language changes nothing about the
problem:

```tsx
// src/screens/Profile.tsx
export function Profile() {
  return (
    <div>
      <button className="rounded px-4 py-2" style={{ color: "#3B82F6" }}>
        Profile
      </button>
    </div>
  );
}
```

```kotlin
// ui/screens/ProfileScreen.kt
@Composable
fun ProfileScreen() {
    Column {
        Button(onClick = {}) {
            Text(text = "Profile", color = Color(0xFF3B82F6))
            Spacer(modifier = Modifier.width(8.dp))
        }
    }
}
```

`reuse-me --health` says the same thing about each:

```
Competing implementation: src/screens/Login.tsx, src/screens/Profile.tsx,
  src/screens/Signup.tsx -> src/components/PrimaryButton.tsx (PrimaryButton),
  confidence 0.8

Competing implementation: ui/screens/LoginScreen.kt, ui/screens/ProfileScreen.kt,
  ui/screens/SignupScreen.kt -> ui/components/PrimaryButton.kt (PrimaryButton),
  confidence 0.8
```

One binary, no plugins, no per-language configuration. The same run finds the
same story in Swift, Dart, Java, C#, Go, Python and Vue.

## Prevention, not just diagnosis

Finding the third copy of a button is losing more slowly. The point is that
the third copy never gets written.

**Before the agent writes**, a `PreToolUse` hook tells it what already exists:

```
$ reuse-me --inventory
Shared components — reuse these instead of re-implementing:
  Button — src/components/Button.tsx (3 references)

Design tokens — reference these instead of hardcoding values:
  brand-primary = #3b82f6 — src/styles/variables.css
```

**After it writes**, a `PostToolUse` hook checks the file and blocks on drift:

```
$ reuse-me --check src/screens/Login.tsx
Source-of-truth warning: src/screens/Login.tsx ->
  src/components/Button.tsx (Button), confidence 1
$ echo $?
2
```

`--check` works on a *single* file, unlike `--diff`, which needs two files
repeating each other before it says anything. Agents write one file at a time,
so a check that waits for the second copy arrives one duplication too late.

Both hooks are in [`hooks/`](hooks). Start in advisory mode
(`REUSE_ME_ADVISORY=1`) before letting them block. Full setup and
limits: [docs/prevention.md](docs/prevention.md).

## The numbers

From `npm run benchmark`, against the corpus in [`examples/`](examples):

| Language | Expected | Result | Correct |
| --- | --- | --- | --- |
| Kotlin / Jetpack Compose | drift | drift reported | yes |
| Swift / SwiftUI | drift | drift reported | yes |
| Dart / Flutter | drift | drift reported | yes |
| TypeScript / React | drift | drift reported | yes |
| Kotlin (clean control) | clean | silent | yes |

**4/4 languages detected. 0 false positives on the clean control. ~175ms per
repository.**

### Context saved

From `npm run benchmark:context`, against real public repositories pinned to
tags in [`benchmarks/corpus.json`](benchmarks/corpus.json):

| Repository | Language | Files | Source | Report | Ratio |
| --- | --- | ---: | ---: | ---: | ---: |
| preact `10.25.4` | TypeScript / JavaScript | 238 | 1267K | 15K | 87.2x |
| vue-core `v3.5.13` | TypeScript | 525 | 3898K | 26K | 149.6x |
| requests `v2.32.3` | Python | 36 | 368K | 10K | 38.0x |
| okhttp `5.0.0-alpha.14` | Kotlin / Java | 549 | 4017K | 33K | 120.9x |
| swift-composable-architecture `1.17.1` | Swift | 820 | 2273K | 24K | 94.7x |

**Median 94.7x smaller across 5 repositories (range 38x–150x)**, 11.8MB of
source summarised into 107K, under a second each.

The denominator is every source file the analyzer can read — what an agent
would otherwise open to answer the questions the report answers. READMEs,
lockfiles and binaries are excluded from both sides.

On the toy examples above, the report is *larger* than the source it
describes. The ratio only becomes favourable at real size, and the benchmark
prints both rather than quoting the flattering one.

## Why it works in any language

Component drift is a shape problem, not a syntax problem. Two signals recover
that shape without a per-language parser:

- **Constructed symbols** — Compose `Column(`, SwiftUI `VStack {`, Flutter
  `Container(`, JSX `<button>`. A capitalised identifier applied to arguments
  or a trailing block is the cross-language spelling of "builds a component".
- **Colours and dimensions** — `#3B82F6`, `0xFF3B82F6`, `16dp`, `1.5rem`.
  Identical in Kotlin, Swift, Dart, CSS and TypeScript, and exactly the values
  a design token should own.

Files that share a structural signature form a pattern. A pattern is matched
against shared components by **containment**, not similarity: the question is
whether the local code *contains* everything the shared component is, not
whether the two are the same size. A screen that wraps a copied button in a
card still contains the button.

Roles come from the import graph and from directory names matched anywhere in
a path — `ui/components`, `lib/widgets`, `Sources/DesignSystem`, a top-level
`components/`. Not from a hardcoded `src/components` prefix.

References are not read from import statements alone. JavaScript, Python and
Ruby require an import for every use, so an import-only graph describes them
completely; Kotlin, Java, C#, Scala, Go and Swift do not, and a file using its
neighbour in the same package writes no statement at all. Those references are
counted from the scope itself, which is the difference between "this component
has no callers" and "this analyzer speaks JavaScript". Imports of frameworks
and standard libraries are classed as external rather than unresolved, so a
repository is never judged on how many `androidx` or `react` names it could
not find inside itself.

## The other half: tokens

A duplicated button matters less if its colour was hardcoded in all four
places to begin with. The same run reports design values written as literals:

```
Token bypassed: #3b82f6 hardcoded in src/screens/Login.tsx,
  src/screens/Profile.tsx, src/screens/Signup.tsx
  but declared as --brand-primary
Token bypassed: 0xff3b82f6 hardcoded in ui/screens/LoginScreen.kt,
  ui/screens/ProfileScreen.kt, ui/screens/SignupScreen.kt
  but declared as BrandPrimary
Token candidate: 11px repeated in 14 files with no token declaring it
```

`bypassed` means the repository already names that value and the code wrote
the literal anyway — so changing the token will not change this file, which is
exactly how a design system stops working. `candidate` means the value repeats
often enough to deserve a name.

Token declarations are read by convention from `tailwind.config.*`,
`colors.xml`, `tokens.json`, CSS custom properties, SCSS variables, Compose
theme files and Swift colour extensions.

## What it refuses to do

The tool reports what it cannot see rather than reporting nothing and letting
you infer health:

```
[none] Unused Abstraction Analysis: unavailable
Unused Abstraction Analysis: only 9/133 imports resolved,
  so zero references is not evidence of disuse
```

On a Next.js project that imports through a path alias, almost nothing
resolves, so every component looks dead. Saying "no unused abstractions" there
would be a lie. Silence and "I cannot tell" are different answers, and agents
calibrate on the difference.

## Install

```bash
npm install
npm run build
npm run dev -- --health          # whole repository
npm run dev -- --diff            # current working-tree changes
npm run dev -- --inventory       # what exists, for reuse
npm run dev -- --check src/screens/Login.tsx   # does this duplicate something?
npm run dev -- --health --json   # for agents
npm run dev -- --health --markdown
```

### As an agent skill

The analyzer stays one CLI; agent files only expose instructions or command
aliases. Adapters ship for Claude Code (`.claude-plugin/`, `commands/`,
`skills/`), Codex, Gemini / Antigravity, GitHub Copilot and Copilot CLI,
OpenCode, pi, Hermes, Devin, Cursor, Windsurf, Cline, Kiro, Swival, OpenClaw,
and anything reading `AGENTS.md`.

```bash
export REUSE_ME_BIN=/absolute/path/to/dist/cli.js
```

See [docs/agent-portability.md](docs/agent-portability.md).

## Configuration

Optional `reuse-me.json`. Missing fields inherit defaults; unknown
fields are rejected.

```json
{
  "sharedDirNames": ["components", "ui", "design-system", "widgets"],
  "localDirNames": ["screens", "pages", "routes", "views"],
  "sharedSourceDirs": ["src/design-system"],
  "localSourceDirs": ["src/routes"],
  "ignore": ["**/*.test.tsx", "**/*.stories.tsx"],
  "warningThreshold": 0.7
}
```

`sharedDirNames` / `localDirNames` match a directory name anywhere in a path
and are what makes the defaults work outside JavaScript. `sharedSourceDirs` /
`localSourceDirs` are exact path prefixes for when you need to override.

## Limits

- Static syntax evidence only. Results are review prompts, not proof.
- Detection is heuristic and tuned on planted duplication, not a survey of
  real repositories. The corpus in `examples/` is small and hand-built.
- Generic declaration intelligence is best-effort across common languages; a
  framework-specific provider still reads more.
- No model calls, no autofix, no PR comments.

## Development

```bash
npm test                   # 134 tests
npm run benchmark          # detection across the example corpus
npm run benchmark:context  # context saved on real repositories (needs network)
npx tsc --noEmit
```

Documentation lives in [docs/](docs): [prevention.md](docs/prevention.md) for
the hooks, [agent-portability.md](docs/agent-portability.md) for the adapters.

## License

MIT
