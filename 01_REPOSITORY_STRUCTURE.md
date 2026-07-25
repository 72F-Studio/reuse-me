# Repository Structure

## Goal

Keep the repository small, boring, and easy for a coding agent to modify.

V1 is a local CLI that analyzes React/TSX diffs and emits source-of-truth warnings. The layout should support that only.

## Technology Choices

| Need | Choice | Why |
|---|---|---|
| Runtime | Node.js | Natural fit for TypeScript/JSX tooling and CLI distribution. |
| Language | TypeScript | Safer internal models, easier AST work, clear interfaces. |
| CLI parsing | `commander` | Small, familiar, enough for V1 flags. |
| TS/JS parsing | `ts-morph` | Higher-level wrapper over TypeScript compiler API, faster to build. |
| Tests | Vitest | Fast TypeScript-friendly unit/integration tests. |
| Formatting/linting | Prettier + ESLint | Standard, low-friction quality baseline. |
| Package manager | npm | Lowest assumption, widely supported. |
| Build | `tsup` | Simple CLI bundling to ESM/CJS if needed. |

No database.  
No server.  
No model calls.  
No framework runtime.

## Proposed Layout

```text
component-intent-audit/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── tsup.config.ts
├── README.md
├── src/
│   ├── cli.ts
│   ├── index.ts
│   ├── config/
│   │   ├── defaults.ts
│   │   └── loadConfig.ts
│   ├── git/
│   │   ├── diffReader.ts
│   │   └── repoRoot.ts
│   ├── parser/
│   │   ├── sourceFileParser.ts
│   │   ├── jsxExtractor.ts
│   │   └── importExportExtractor.ts
│   ├── inventory/
│   │   ├── buildInventory.ts
│   │   └── classifyComponent.ts
│   ├── analysis/
│   │   ├── changedJsx.ts
│   │   ├── similarity.ts
│   │   ├── rankCandidates.ts
│   │   ├── confidence.ts
│   │   └── generateWarnings.ts
│   ├── output/
│   │   ├── textReporter.ts
│   │   ├── jsonReporter.ts
│   │   └── markdownReporter.ts
│   └── model/
│       ├── config.ts
│       ├── component.ts
│       ├── diff.ts
│       ├── similarity.ts
│       └── warning.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│       ├── simple-shared-component/
│       ├── no-warning-local-change/
│       ├── ambiguous-candidates/
│       └── generated-files/
└── docs/
    └── examples.md
```

## Module Boundaries

| Area | Responsibility |
|---|---|
| `cli` | User-facing command, flags, exit codes. |
| `config` | Defaults and optional project config. |
| `git` | Repository root and diff reading. |
| `parser` | TypeScript/JSX parsing only. No heuristics. |
| `inventory` | Repository component inventory and classification. |
| `analysis` | Heuristics, similarity, ranking, warning creation. |
| `output` | Formatting only. No analysis logic. |
| `model` | Shared TypeScript interfaces. |

## Naming

- Use nouns for model files: `component.ts`, `warning.ts`.
- Use verbs for pipeline functions: `buildInventory.ts`, `rankCandidates.ts`.
- Keep each file focused on one responsibility.

## Distribution

V1 target:

```bash
npx component-intent-audit --diff
```

Local development:

```bash
npm install
npm test
npm run build
npm run dev -- --diff
```

## What Not To Add

- `server/`
- database migrations
- web app
- editor extension
- agent plugin
- persistent cache
- telemetry
- auth
- cloud config

These do not help V1 prove whether source-of-truth warnings improve AI-generated UI changes.

