#!/usr/bin/env node
// Measures how much context the report saves against reading the source it
// summarises, across real public repositories rather than this one.
//
// Usage: npm run benchmark:context
//
// Repositories are shallow-cloned at pinned tags into a gitignored cache, so
// the numbers are reproducible by anyone with network access. Without network
// the script says so and exits 0 rather than failing a build.
//
// The denominator is every source file the analyzer can read, which is what an
// agent would otherwise open to answer the questions the report answers. It is
// not "the whole repository": READMEs, lockfiles and images are excluded from
// both sides.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readDirSafe, sourceBytes } from "./lib/sourceBytes.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(repoRoot, "dist", "cli.js");
const corpus = JSON.parse(
  readFileSync(join(repoRoot, "benchmarks", "corpus.json"), "utf8")
);
const cacheRoot = join(repoRoot, corpus.cacheDirectory);

if (!existsSync(cli)) {
  console.error("dist/cli.js is missing. Run npm run build first.");
  process.exit(1);
}

mkdirSync(cacheRoot, { recursive: true });

function ensureClone(repository) {
  const target = join(cacheRoot, repository.name);

  if (existsSync(join(target, ".git"))) {
    return target;
  }

  try {
    execFileSync(
      "git",
      [
        "clone",
        "--depth",
        "1",
        "--branch",
        repository.ref,
        "--quiet",
        repository.repo,
        target
      ],
      { stdio: ["ignore", "ignore", "pipe"], timeout: 180000 }
    );

    return target;
  } catch {
    return null;
  }
}

function resolvedCommit(path) {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: path,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "unknown";
  }
}

const rows = [];
const skipped = [];

for (const repository of corpus.repositories) {
  const path = ensureClone(repository);

  if (path === null) {
    skipped.push(repository.name);
    continue;
  }

  let report;
  const started = process.hrtime.bigint();

  try {
    report = execFileSync(process.execPath, [cli, "--health", "--json"], {
      cwd: path,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      timeout: 300000
    });
  } catch (error) {
    // --health never exits non-zero for findings, so anything here is a real
    // failure worth surfacing rather than hiding behind a skip.
    console.error(`${repository.name}: analyzer failed: ${error.message}`);
    process.exitCode = 1;
    continue;
  }

  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  const parsed = JSON.parse(report);

  rows.push({
    name: repository.name,
    language: repository.language,
    commit: resolvedCommit(path),
    sourceBytes: sourceBytes(path),
    sourceFileCount: parsed.repository?.sourceFileCount ?? 0,
    reportBytes: Buffer.byteLength(report, "utf8"),
    findingCount: parsed.metadata?.findingCount ?? 0,
    elapsedMs
  });
}

if (rows.length === 0) {
  console.log("");
  console.log("Corpus unavailable — could not clone any repository.");
  console.log("This benchmark needs network access on first run.");
  console.log("");
  process.exit(0);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)}K`;
const pad = (value, width) => String(value).padEnd(width);
const columns = [42, 25, 8, 9, 9, 9, 8];

console.log("");
console.log("Context saved against reading the source");
console.log("");
console.log(
  pad("Repository", columns[0]) +
    pad("Language", columns[1]) +
    pad("Files", columns[2]) +
    pad("Source", columns[3]) +
    pad("Report", columns[4]) +
    pad("Ratio", columns[5]) +
    pad("Time", columns[6])
);
console.log("-".repeat(columns.reduce((sum, width) => sum + width, 0)));

for (const row of rows) {
  console.log(
    pad(`${row.name} @ ${row.commit}`, columns[0]) +
      pad(row.language, columns[1]) +
      pad(row.sourceFileCount, columns[2]) +
      pad(kb(row.sourceBytes), columns[3]) +
      pad(kb(row.reportBytes), columns[4]) +
      pad(`${(row.sourceBytes / row.reportBytes).toFixed(1)}x`, columns[5]) +
      pad(`${row.elapsedMs.toFixed(0)}ms`, columns[6])
  );
}

const totalSource = rows.reduce((sum, row) => sum + row.sourceBytes, 0);
const totalReport = rows.reduce((sum, row) => sum + row.reportBytes, 0);
const ratios = rows.map((row) => row.sourceBytes / row.reportBytes);
const median = [...ratios].sort((a, b) => a - b)[Math.floor(ratios.length / 2)];

console.log("");
console.log(
  `Median ${median.toFixed(1)}x smaller across ${rows.length} repositories ` +
    `(range ${Math.min(...ratios).toFixed(1)}x–${Math.max(...ratios).toFixed(1)}x).`
);
console.log(
  `Corpus totals: ${kb(totalSource)} of source summarised into ${kb(totalReport)}.`
);
console.log(
  "The report is capped per finding kind, so the ratio improves with repository size."
);

if (skipped.length > 0) {
  console.log("");
  console.log(`Skipped (clone failed): ${skipped.join(", ")}.`);
}

console.log("");
