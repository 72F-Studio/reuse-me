# MVP Spec

## Product

A CLI that analyzes a React/TypeScript diff and detects when local screen-level UI changes likely belong in an existing shared component.

Working name:

```text
component-intent-audit
```

Primary command:

```bash
component-intent-audit --diff
```

## User Story

As a developer using Claude, I want to know when Claude patched multiple screens instead of changing the shared component, so I can redirect it before the code review cycle.

## V1 Scope

V1 supports:

- React
- TypeScript / TSX
- Git diffs
- component import/export analysis
- JSX structure comparison
- className/style similarity
- simple path-based classification of screens vs shared components
- plain-text and JSON output

V1 does not support:

- Vue/Svelte/Angular
- backend source-of-truth detection
- design-token enforcement
- auto-fixes
- PR comments
- editor integration
- model calls
- persistent repository memory

## Primary Flow

1. Developer or AI produces a local diff.
2. Developer runs:

   ```bash
   component-intent-audit --diff
   ```

3. Tool identifies changed TSX files.
4. Tool detects repeated or shared-component-like UI changes in leaf screens.
5. Tool ranks likely shared components.
6. Tool emits source-of-truth warning with evidence and an AI-ready prompt.

## Example Output

```text
SOURCE-OF-TRUTH WARNING

Changed files:
- src/screens/BillingSettings.tsx
- src/screens/TeamSettings.tsx
- src/screens/ProfileSettings.tsx

Likely shared component:
- src/components/settings/SettingsSection.tsx

Confidence: 0.78

Why:
- 3 changed leaf screens introduced similar JSX structure.
- The same className tokens already appear in SettingsSection.
- SettingsSection is imported by 14 files.
- The changed files already render settings-section-like markup.

Recommendation:
Inspect SettingsSection and move the repeated behavior there unless these screens have a distinct product reason to diverge.

Prompt for Claude:
Do not patch each screen independently. Inspect src/components/settings/SettingsSection.tsx and make this behavior reusable there unless there is a distinct product reason not to.
```

## Assumptions To Challenge

| Assumption | How V1 Tests It |
|---|---|
| Existing shared components are discoverable from code structure. | Compare warnings against engineer judgment. |
| AI agents improve when given source-of-truth hints. | A/B tasks with and without tool output. |
| Static heuristics are enough for useful signal. | Measure false positives and useful warnings. |
| Developers want suggestions before PR review. | Observe whether they run/paste output. |
| This is better than a prompt rule. | Compare against "look for shared components first." |

## Out Of Scope Until Proven

Anything not needed for this exact warning is out of scope.

That includes:

- repository-wide architectural health
- concept graphs
- intent ledgers
- AI conversations
- dashboards
- history trend analysis
- multi-framework support

