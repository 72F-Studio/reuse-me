import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Extensions the analyzer can read. Mirrors LANGUAGE_BY_EXTENSION in
// src/discovery/languageDetector.ts, which is the source of truth;
// test/unit/benchmarkSourceBytes.test.ts fails if the two drift apart.
export const SOURCE_EXTENSIONS = [
  ".kt", ".kts", ".java", ".cs", ".go", ".rs", ".py", ".rb", ".php",
  ".c", ".h", ".cc", ".cpp", ".cxx", ".hpp", ".scala",
  ".tsx", ".ts", ".jsx", ".js", ".swift", ".dart", ".vue"
];

// Directories that hold dependencies or build output rather than the source an
// agent would read.
const IGNORED_DIRECTORIES = new Set([
  ".git", ".gradle", ".idea", ".next", ".nuxt", ".svelte-kit",
  "build", "coverage", "dist", "node_modules", "out", "target", "vendor"
]);

export function readDirSafe(directory) {
  try {
    return readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}

// Total bytes of source the analyzer can read under a directory. This is the
// denominator for context savings: what an agent would otherwise open to
// answer the questions the report answers, excluding READMEs, lockfiles and
// binary assets from both sides of the comparison.
export function sourceBytes(directory) {
  let total = 0;

  for (const entry of readDirSafe(directory)) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        total += sourceBytes(join(directory, entry.name));
      }

      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) {
      try {
        total += statSync(join(directory, entry.name)).size;
      } catch {
        // Unreadable file: skip it rather than abandoning the measurement.
      }
    }
  }

  return total;
}
