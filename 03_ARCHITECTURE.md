# V1 Architecture

## Overview

V1 is a local CLI.

It reads the working tree and Git diff, builds an in-memory component inventory, applies detection heuristics, and prints warnings.

No server.  
No database.  
No model calls.  
No background daemon.

## Pipeline

```text
Git diff
-> changed file detection
-> TSX parse
-> component inventory
-> screen/shared classification
-> changed JSX extraction
-> repeated local pattern detection
-> candidate shared component ranking
-> warning generation
```

## Components

### CLI Entrypoint

Responsible for:

- parsing flags
- locating repository root
- loading optional config
- choosing output format

Commands:

```bash
component-intent-audit --diff
component-intent-audit --json
component-intent-audit --markdown
```

### Git Diff Reader

Responsible for:

- listing changed files
- reading changed hunks
- filtering to TSX/JSX files

Uses local Git only.

### Source Parser

Responsible for:

- parsing React/TSX files
- extracting imports and exports
- identifying component declarations
- extracting JSX trees
- extracting `className` and inline style signals

Preferred tooling:

- Node.js
- TypeScript compiler API or `ts-morph`

### Component Inventory

In-memory index of:

- component file path
- exported component names
- import count
- importing files
- JSX structure fingerprints
- class/style tokens
- likely role: shared component or leaf screen

### Detection Engine

Applies heuristics from `04_DETECTION_HEURISTICS.md`.

Outputs zero or more warning candidates.

### Reporter

Formats warnings as:

- plain text
- JSON
- Markdown

Plain text is the default.

## Configuration

Optional file:

```json
{
  "sharedComponentDirs": [
    "src/components",
    "src/ui",
    "src/design-system"
  ],
  "screenDirs": [
    "src/screens",
    "src/pages",
    "src/routes"
  ],
  "ignore": [
    "**/*.test.tsx",
    "**/*.stories.tsx"
  ]
}
```

The tool should run without config using defaults.

## Non-Architecture

V1 should not include:

- persistence
- graph database
- telemetry
- cloud sync
- editor plugin
- GitHub app
- LLM prompt execution
- auto-fix engine

The architecture should stay disposable until the detection signal is validated.

