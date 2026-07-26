# Prevention

Auditing is corrective: it finds the third copy of a button after it has been
written. Prevention runs at the moment the code is produced.

Two CLI modes and two hooks.

## The modes

### `--inventory`

Lists what the repository already has to build with. Shared components and
design tokens only; local screens are noise here. It is the smallest output
the tool produces, because it is meant to fit in a model's context at the
moment it is about to build something.

```
$ reuse-me --inventory
Shared components — reuse these instead of re-implementing:
  Button — src/components/Button.tsx (3 references)
  Card — src/components/Card.tsx (7 references)

Design tokens — reference these instead of hardcoding values:
  brand-primary = #3b82f6 — src/styles/variables.css
  spacing-small = 8.dp — ui/theme/Theme.kt
```

An agent cannot reuse a component it does not know exists, and asking it to
read the whole component directory costs more context than it saves.

### `--check <paths...>`

Checks named files against the abstractions that already exist.

```
$ reuse-me --check src/screens/Login.tsx
Source-of-truth warning: src/screens/Login.tsx ->
  src/components/Button.tsx (Button), confidence 1
$ echo $?
2
```

This is a different question from `--diff`. Change analysis asks whether
several changed files repeat *each other*, and needs at least two of them
before it says anything. An agent writes one file at a time, so a check that
needs a second copy before it speaks arrives exactly one duplication too late.
`--check` treats a single file as a pattern in its own right and compares it
against the inventory.

Paths may be absolute or repository-relative.

### Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Ran, nothing to report |
| 1 | Could not run: bad usage, unreadable repository |
| 2 | Ran, found something |

The split matters for hooks: only code 2 should ever interrupt someone's work.
A missing binary or an unreadable checkout must not be reported as a code
problem.

## The hooks

Both live in [`hooks/`](../hooks) and read the standard hook JSON on stdin.
Point them at an absolute path, and set `REUSE_ME_BIN` if the
CLI is not beside them in `dist/`.

### `inject-inventory.mjs` — PreToolUse

Before a write to a UI source file, injects the inventory as additional
context with an instruction to reuse rather than re-implement. Editing a
README does not trigger it. It never blocks: a hook that stops work because a
helper failed is worse than the duplication it prevents.

### `check-write.mjs` — PostToolUse

After a write, runs `--check` on the file. If the file re-implements something
that already exists, it exits 2 and puts the finding on stderr, which the
agent receives as a blocking error it has to answer for.

Set `REUSE_ME_ADVISORY=1` to report without blocking.

### Wiring

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node /absolute/path/to/hooks/inject-inventory.mjs"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node /absolute/path/to/hooks/check-write.mjs"
          }
        ]
      }
    ]
  }
}
```

The same file is in [`hooks/settings.example.json`](../hooks/settings.example.json).

## Limits worth knowing before you enable blocking

- The check is a heuristic over static evidence, so it can be wrong. Start
  with `REUSE_ME_ADVISORY=1` and see what it says about your
  repository before letting it block writes.
- It runs the full analysis per write, roughly 200ms on a small repository and
  proportional to repository size. There is no caching yet.
- A genuinely new variant of an existing component will be flagged. That is
  the intended prompt — either extend the shared component or accept the
  warning — but it is a prompt, not a verdict.
- Hook payload shapes differ between agent runtimes. These two target Claude
  Code's `tool_input.file_path`; other runtimes may need the field name
  changed.
