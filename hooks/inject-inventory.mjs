#!/usr/bin/env node
// PreToolUse hook: tell the agent what already exists, before it writes.
//
// This is the preventive half. Auditing finds the third copy of a button
// after it is written; this runs first and removes the excuse, because an
// agent cannot reuse a component it does not know about, and reading the
// whole component directory costs more context than it saves.
//
// Wire it to Write|Edit. It emits the inventory as additional context and
// never blocks: a hook that stops work because a helper failed is worse than
// the duplication it prevents.
//
//   {
//     "hooks": {
//       "PreToolUse": [
//         {
//           "matcher": "Write|Edit",
//           "hooks": [{ "type": "command",
//                       "command": "node /abs/path/hooks/inject-inventory.mjs" }]
//         }
//       ]
//     }
//   }

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_EXTENSIONS = [
  ".tsx", ".jsx", ".ts", ".js", ".vue", ".svelte",
  ".kt", ".kts", ".swift", ".dart", ".java", ".cs",
  ".css", ".scss"
];

function readInput() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

function locateCli() {
  if (process.env.COMPONENT_INTENT_AUDIT_BIN) {
    return process.env.COMPONENT_INTENT_AUDIT_BIN;
  }

  const bundled = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "dist",
    "cli.js"
  );

  return existsSync(bundled) ? bundled : null;
}

const input = readInput();
const filePath = input?.tool_input?.file_path ?? "";

// Only UI-ish source files. Editing a README should not drag a component
// inventory into the conversation.
if (!SOURCE_EXTENSIONS.some((extension) => filePath.endsWith(extension))) {
  process.exit(0);
}

const cli = locateCli();

if (cli === null) {
  process.exit(0);
}

let inventory;

try {
  inventory = execFileSync(process.execPath, [cli, "--inventory"], {
    cwd: input?.cwd ?? process.cwd(),
    encoding: "utf8",
    timeout: 15000,
    stdio: ["ignore", "pipe", "ignore"]
  }).trim();
} catch {
  // Analyzer unavailable or repository unreadable. Stay silent rather than
  // interrupting the write.
  process.exit(0);
}

if (inventory === "" || inventory.startsWith("No shared components found.\n\nNo design tokens")) {
  process.exit(0);
}

const context = [
  "Existing shared components and design tokens in this repository.",
  "Reuse them instead of writing new one-off implementations.",
  "If a component you need genuinely does not exist, add it to the shared",
  "location rather than inlining it in a screen.",
  "",
  inventory
].join("\n");

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: context
    }
  })
);
