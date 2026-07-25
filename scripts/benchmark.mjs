#!/usr/bin/env node
// Runs the analyzer across the example corpus and reports whether the drift
// claim holds, per language, plus how much context the JSON report saves an
// agent compared with reading the source it summarises.
//
// Usage: npm run benchmark
//
// The corpus is deliberately small and hand-built. These numbers describe
// detection on planted duplication, not a survey of real repositories.

import { execFileSync } from "node:child_process";
import { mkdtempSync, cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(repoRoot, "dist", "cli.js");
const expectations = JSON.parse(
  readFileSync(join(repoRoot, "benchmarks", "expectations.json"), "utf8")
);

// The analyzer resolves its root at the nearest Git repository, so each
// example is copied somewhere it owns rather than analysed in place inside
// this repository's checkout.
function stage(example) {
  const staged = mkdtempSync(join(tmpdir(), "component-intent-audit-bench-"));
  cpSync(join(repoRoot, "examples", example), staged, { recursive: true });
  mkdirSync(join(staged, ".git"));
  return staged;
}

function sourceBytes(directory) {
  let total = 0;

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git") {
      continue;
    }

    const path = join(directory, entry.name);
    total += entry.isDirectory() ? sourceBytes(path) : statSync(path).size;
  }

  return total;
}

const rows = [];
let detected = 0;
let expected = 0;
let falsePositives = 0;

for (const testCase of expectations.cases) {
  const staged = stage(testCase.example);

  try {
    const started = process.hrtime.bigint();
    const output = execFileSync(process.execPath, [cli, "--health", "--json"], {
      cwd: staged,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024
    });
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    const report = JSON.parse(output);
    const findings = [
      ...(report.competingImplementations ?? []),
      ...(report.missingAbstractions ?? [])
    ];
    const foundDrift = findings.length > 0;

    if (testCase.expectDrift) {
      expected += 1;
      if (foundDrift) {
        detected += 1;
      }
    } else if (foundDrift) {
      falsePositives += 1;
    }

    rows.push({
      language: testCase.language,
      expected: testCase.expectDrift ? "drift" : "clean",
      result: foundDrift ? "drift reported" : "silent",
      correct: foundDrift === testCase.expectDrift,
      sourceBytes: sourceBytes(staged),
      reportBytes: Buffer.byteLength(output, "utf8"),
      elapsedMs
    });
  } finally {
    rmSync(staged, { recursive: true, force: true });
  }
}

const pad = (value, width) => String(value).padEnd(width);
const columns = [26, 10, 16, 6, 14, 9];

console.log("");
console.log("Cross-language drift detection");
console.log("");
console.log(
  pad("Language", columns[0]) +
    pad("Expected", columns[1]) +
    pad("Result", columns[2]) +
    pad("OK", columns[3]) +
    pad("Source→report", columns[4]) +
    pad("Time", columns[5])
);
console.log("-".repeat(columns.reduce((sum, width) => sum + width, 0)));

for (const row of rows) {
  console.log(
    pad(row.language, columns[0]) +
      pad(row.expected, columns[1]) +
      pad(row.result, columns[2]) +
      pad(row.correct ? "yes" : "NO", columns[3]) +
      pad(
        `${(row.sourceBytes / 1024).toFixed(1)}K→${(row.reportBytes / 1024).toFixed(1)}K`,
        columns[4]
      ) +
      pad(`${row.elapsedMs.toFixed(0)}ms`, columns[5])
  );
}

console.log("");
console.log(`Detected duplication in ${detected}/${expected} languages.`);
console.log(`False positives on clean repositories: ${falsePositives}.`);
console.log("No per-language plugin: every example goes through one backend.");
console.log("");

// The report is a fixed-shape summary, so on the toy examples above it is
// larger than the source it describes. The ratio only turns favourable at
// real repository size, which is the case worth quoting honestly.
const selfStarted = process.hrtime.bigint();
const selfReport = execFileSync(process.execPath, [cli, "--health", "--json"], {
  cwd: repoRoot,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024
});
const selfElapsedMs = Number(process.hrtime.bigint() - selfStarted) / 1e6;
const selfSourceBytes = sourceBytes(join(repoRoot, "src"));
const selfReportBytes = Buffer.byteLength(selfReport, "utf8");

console.log("At repository scale (this repository, src/ only)");
console.log("");
console.log(`  Source read to answer the same questions: ${(selfSourceBytes / 1024).toFixed(0)}K`);
console.log(`  Report:                                   ${(selfReportBytes / 1024).toFixed(0)}K`);
console.log(`  Ratio:                                    ${(selfSourceBytes / selfReportBytes).toFixed(1)}x smaller`);
console.log(`  Time:                                     ${selfElapsedMs.toFixed(0)}ms`);
console.log("");

process.exitCode = detected === expected && falsePositives === 0 ? 0 : 1;
