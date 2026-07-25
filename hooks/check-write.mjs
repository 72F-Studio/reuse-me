#!/usr/bin/env node
// PostToolUse hook: check what was just written against what already exists.
//
// The inventory hook is advice and an agent may ignore it. This one is the
// consequence: if the file that was just written re-implements a shared
// component, exit 2 and put the finding on stderr, which the agent receives
// as a blocking error it has to answer for.
//
// Wire it to Write|Edit:
//
//   {
//     "hooks": {
//       "PostToolUse": [
//         {
//           "matcher": "Write|Edit",
//           "hooks": [{ "type": "command",
//                       "command": "node /abs/path/hooks/check-write.mjs" }]
//         }
//       ]
//     }
//   }
//
// Set COMPONENT_INTENT_AUDIT_ADVISORY=1 to report without blocking.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_EXTENSIONS = [
  ".tsx", ".jsx", ".ts", ".js", ".vue", ".svelte",
  ".kt", ".kts", ".swift", ".dart", ".java", ".cs"
];

// The analyzer's own exit code for "ran fine, found something".
const EXIT_FINDINGS = 2;

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

if (!SOURCE_EXTENSIONS.some((extension) => filePath.endsWith(extension))) {
  process.exit(0);
}

const cli = locateCli();

if (cli === null) {
  process.exit(0);
}

let findings = "";
let foundDrift = false;

try {
  execFileSync(process.execPath, [cli, "--check", filePath], {
    cwd: input?.cwd ?? process.cwd(),
    encoding: "utf8",
    timeout: 30000,
    stdio: ["ignore", "pipe", "ignore"]
  });
} catch (error) {
  // Only the analyzer's findings exit code means drift. Any other failure is
  // an environment problem and must not be reported as a code problem.
  if (error?.status !== EXIT_FINDINGS) {
    process.exit(0);
  }

  findings = String(error.stdout ?? "").trim();
  foundDrift = true;
}

if (!foundDrift || findings === "") {
  process.exit(0);
}

const message = [
  `${filePath} re-implements something this repository already has:`,
  "",
  findings,
  "",
  "Import the existing component instead of keeping the inline copy, or, if",
  "it genuinely does not fit, extend the shared component so both callers use",
  "one source of truth. Run `component-intent-audit --inventory` to see what",
  "is available."
].join("\n");

if (process.env.COMPONENT_INTENT_AUDIT_ADVISORY === "1") {
  process.stdout.write(message);
  process.exit(0);
}

process.stderr.write(message);
process.exit(2);
