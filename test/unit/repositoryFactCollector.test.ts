import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { defaultConfig } from "../../src/config/defaults";
import { RepositoryFactCollector } from "../../src/extractors/typescript-react/repositoryFactCollector";
import type { RepositoryContext } from "../../src/model/repository";
import type { SourceFileCandidate } from "../../src/extractors/typescript-react/sourceFileCandidate";

const tempDirs: string[] = [];
const collector = new RepositoryFactCollector();

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "component-intent-audit-"));
  tempDirs.push(directory);
  return directory;
}

function writeFixture(rootPath: string, path: string, source: string): void {
  const absolutePath = join(rootPath, path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, source);
}

function context(rootPath: string): RepositoryContext {
  return {
    rootPath,
    config: defaultConfig
  };
}

function candidate(path: string): SourceFileCandidate {
  return {
    path,
    discoveredFrom: "sharedSourceDir"
  };
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("RepositoryFactCollector", () => {
  it("builds repository facts for discovered source files", () => {
    const rootPath = createTempDir();
    writeFixture(
      rootPath,
      "src/components/Button.tsx",
      `
        import { cx } from "../cx";
        export function Button() {
          return <button className={cx("primary")} />;
        }
      `
    );

    expect(
      collector.collect(context(rootPath), [candidate("src/components/Button.tsx")])
    ).toEqual([
      {
        path: "src/components/Button.tsx",
        imports: [
          {
            sourceModule: "../cx",
            kind: "named",
            localName: "cx",
            importedName: "cx"
          }
        ],
        exports: [
          {
            kind: "named",
            exportedName: "Button",
            localName: "Button"
          }
        ],
        declarations: [
          {
            kind: "declaration",
            name: "Button",
            visibility: "exported"
          }
        ],
        features: []
      }
    ]);
  });

  it("handles empty candidate lists", () => {
    const rootPath = createTempDir();

    expect(collector.collect(context(rootPath), [])).toEqual([]);
  });

  it("handles parse failures without crashing", () => {
    const rootPath = createTempDir();
    writeFixture(rootPath, "src/components/Broken.tsx", "export function Broken(");

    expect(
      collector.collect(context(rootPath), [candidate("src/components/Broken.tsx")])
    ).toEqual([
      {
        path: "src/components/Broken.tsx",
        imports: [],
        exports: [],
        declarations: [],
        features: []
      }
    ]);
  });
});
