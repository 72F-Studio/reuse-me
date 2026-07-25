import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { defaultConfig } from "../../src/config/defaults";
import { SourceFileDiscovery } from "../../src/extractors/typescript-react/sourceFileDiscovery";
import type { RepositoryContext } from "../../src/model/repository";

const tempDirs: string[] = [];
const discovery = new SourceFileDiscovery();

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "component-intent-audit-"));
  tempDirs.push(directory);
  return directory;
}

function writeFixture(rootPath: string, path: string): void {
  const absolutePath = join(rootPath, path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, "export const value = 1;");
}

function context(rootPath: string): RepositoryContext {
  return {
    rootPath,
    config: {
      ...defaultConfig,
      sharedSourceDirs: ["src/components"],
      localSourceDirs: ["src/pages"],
      ignore: ["**/*.test.tsx", "**/generated/**"]
    }
  };
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("SourceFileDiscovery", () => {
  it("discovers source files from shared component directories", () => {
    const rootPath = createTempDir();
    writeFixture(rootPath, "src/components/Button.tsx");

    expect(discovery.discover(context(rootPath))).toEqual([
      {
        path: "src/components/Button.tsx",
        discoveredFrom: "sharedSourceDir"
      }
    ]);
  });

  it("discovers source files from screen directories", () => {
    const rootPath = createTempDir();
    writeFixture(rootPath, "src/pages/BillingPage.tsx");

    expect(discovery.discover(context(rootPath))).toEqual([
      {
        path: "src/pages/BillingPage.tsx",
        discoveredFrom: "localSourceDir"
      }
    ]);
  });

  it("ignores configured patterns", () => {
    const rootPath = createTempDir();
    writeFixture(rootPath, "src/components/Button.tsx");
    writeFixture(rootPath, "src/components/Button.test.tsx");
    writeFixture(rootPath, "src/components/generated/Icon.tsx");

    expect(discovery.discover(context(rootPath))).toEqual([
      {
        path: "src/components/Button.tsx",
        discoveredFrom: "sharedSourceDir"
      }
    ]);
  });

  it("ignores unsupported files", () => {
    const rootPath = createTempDir();
    writeFixture(rootPath, "src/components/Button.css");

    expect(discovery.discover(context(rootPath))).toEqual([]);
  });

  it("handles missing configured directories safely", () => {
    const rootPath = createTempDir();

    expect(discovery.discover(context(rootPath))).toEqual([]);
  });
});
