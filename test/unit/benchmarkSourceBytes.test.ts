import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// @ts-expect-error - plain ESM helper shared with the benchmark scripts
import { SOURCE_EXTENSIONS } from "../../scripts/lib/sourceBytes.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// The benchmark measures context savings against "source the analyzer can
// read", so it needs the same extension list the analyzer uses. That list is
// therefore written down twice, which is exactly the duplication this project
// exists to complain about. Since the benchmark is a plain ESM script and the
// analyzer is TypeScript, this test is the seam that keeps the copy honest:
// if someone teaches the analyzer a new language, the published numbers cannot
// silently keep excluding it.
describe("benchmark source extensions", () => {
  it("matches the analyzer's language table", () => {
    const detector = readFileSync(
      join(repoRoot, "src/discovery/languageDetector.ts"),
      "utf8"
    );
    const table = detector.slice(
      detector.indexOf("LANGUAGE_BY_EXTENSION"),
      detector.indexOf("};", detector.indexOf("LANGUAGE_BY_EXTENSION"))
    );
    const analyzerExtensions = [...table.matchAll(/"(\.[a-z]+)":/gu)].map(
      ([, extension]) => extension
    );

    expect(analyzerExtensions.length).toBeGreaterThan(15);
    expect([...SOURCE_EXTENSIONS].sort()).toEqual(
      [...new Set(analyzerExtensions)].sort()
    );
  });
});
