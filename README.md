# component-intent-audit

**AI coding agents keep rebuilding the button you already have.**

Ask an agent for a settings screen and it writes a button inline. Ask for a
checkout screen and it writes that button again, slightly different. Nothing
is broken, no test fails, and six months later a brand colour change is a
forty-file archaeology exercise instead of one token edit.

This is a local, deterministic CLI that finds those re-implementations — in
any language, with no model calls.

## Before / after

An agent writes a third screen that looks like this:

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

`component-intent-audit --health` says:

```
Competing implementation: ui/screens/LoginScreen.kt, ui/screens/ProfileScreen.kt,
  ui/screens/SignupScreen.kt -> ui/components/PrimaryButton.kt (PrimaryButton),
  confidence 0.8
```

There is no Kotlin plugin. There is no Compose plugin. The same run finds the
same story in SwiftUI, Flutter and React.

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

At real repository scale, on this repository's own `src/`:

| | |
| --- | --- |
| Source an agent would read to answer the same questions | 176K |
| Report | 14K |
| **Ratio** | **12.3x smaller** |

On the toy examples above the report is *larger* than the source, because it
is a fixed-shape summary. The ratio only becomes favourable at real size. The
benchmark prints both rather than quoting the flattering one.

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

## The other half: tokens

A duplicated button matters less if its colour was hardcoded in all four
places to begin with. The same run reports design values written as literals:

```
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
export COMPONENT_INTENT_AUDIT_BIN=/absolute/path/to/dist/cli.js
```

See [docs/agent-portability.md](docs/agent-portability.md).

## Configuration

Optional `component-intent.json`. Missing fields inherit defaults; unknown
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
npm test           # 120 tests
npm run benchmark  # cross-language corpus + scale measurement
npx tsc --noEmit
```

Design notes and research live in [docs/](docs). The architecture audit that
drove the current rework is
[docs/planning/PRODUCT_ARCHITECTURE_AUDIT.md](docs/planning/PRODUCT_ARCHITECTURE_AUDIT.md).

## License

MIT
