import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// This repository ships the same skill file to several agent runtimes that
// each insist on their own directory. That is a shared component copied into
// three places, which is the exact drift the analyzer exists to report, and
// all three copies had already diverged before this guard existed.
//
// There is no build step to generate them, so the guard is the cheapest thing
// that keeps them honest: one canonical file, and a test that fails when a
// copy drifts.
const CANONICAL_SKILL = "skills/component-intent-audit/SKILL.md";
const SKILL_COPIES = [
  ".swival/skills/component-intent-audit/SKILL.md",
  ".openclaw/skills/component-intent-audit/SKILL.md"
];

function read(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("agent adapter files", () => {
  it("keeps every copied skill file identical to the canonical one", () => {
    const canonical = read(CANONICAL_SKILL);

    for (const copy of SKILL_COPIES) {
      expect(
        read(copy),
        `${copy} has drifted from ${CANONICAL_SKILL}; copy the canonical file over it`
      ).toBe(canonical);
    }
  });

  it("documents every finding kind the reporters can emit", () => {
    const skill = read(CANONICAL_SKILL);
    const kinds = [
      "competing-implementation",
      "missing-abstraction",
      "unused-abstraction",
      "untokenized-value"
    ];

    for (const kind of kinds) {
      expect(skill, `${CANONICAL_SKILL} does not mention ${kind}`).toContain(
        kind
      );
    }
  });
});
