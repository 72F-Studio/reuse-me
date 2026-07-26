import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { RepositoryStructureAnalyzer } from "../../src/analysis/repositoryStructureAnalyzer";
import { defaultConfig } from "../../src/config/defaults";

const tempDirs: string[] = [];

function writeFixture(root: string, path: string, source = ""): void {
  const absolutePath = join(root, path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, source);
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("RepositoryStructureAnalyzer", () => {
  it("returns generic repository data and path-level findings", () => {
    const root = mkdtempSync(join(tmpdir(), "reuse-me-"));
    tempDirs.push(root);
    writeFixture(root, "app/src/main/kotlin/HomeScreen.kt");
    writeFixture(root, "core/src/main/kotlin/HomeScreen.kt");
    writeFixture(root, "build.gradle.kts");
    writeFixture(root, "core/build.gradle.kts");

    const result = new RepositoryStructureAnalyzer().analyze({
      rootPath: root,
      config: defaultConfig
    });

    expect(result.summary).toMatchObject({
      fileCount: 4,
      sourceFileCount: 2,
      topLevelDirectories: ["app", "core"]
    });
    expect(result.findings.map((finding) => finding.title)).toContain(
      "Duplicate source filename: HomeScreen.kt"
    );
    expect(result.findings.map((finding) => finding.title)).toContain(
      "Multiple project manifests detected"
    );
  });
});
