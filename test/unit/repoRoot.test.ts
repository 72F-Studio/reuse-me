import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { CONFIG_FILENAME } from "../../src/config/loadConfig";
import {
  discoverRepositoryContext,
  findRepositoryRoot
} from "../../src/git/repoRoot";
import { defaultConfig } from "../../src/config/defaults";

const tempDirs: string[] = [];

function createTempDir(): string {
  const directory = fs.mkdtempSync(join(tmpdir(), "component-intent-audit-"));
  tempDirs.push(directory);
  return directory;
}

function createGitRepo(rootPath: string): void {
  fs.mkdirSync(join(rootPath, ".git"));
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("findRepositoryRoot", () => {
  it("finds the repository root from the root directory", () => {
    const rootPath = createTempDir();
    createGitRepo(rootPath);

    expect(findRepositoryRoot(rootPath)).toBe(rootPath);
  });

  it("finds the repository root from a nested directory", () => {
    const rootPath = createTempDir();
    const nestedPath = join(rootPath, "src", "components", "settings");

    createGitRepo(rootPath);
    fs.mkdirSync(nestedPath, { recursive: true });

    expect(findRepositoryRoot(nestedPath)).toBe(rootPath);
  });

  it("throws a clear error when no git repository exists", () => {
    const nestedPath = "/component-intent-audit-no-git/nested/deeper";

    expect(() => findRepositoryRoot(nestedPath)).toThrow(
      `No Git repository found from "${nestedPath}"`
    );
    expect(() => findRepositoryRoot(nestedPath)).toThrow(dirname(nestedPath));
  });
});

describe("discoverRepositoryContext", () => {
  it("loads configuration relative to repository root", () => {
    const rootPath = createTempDir();
    const nestedPath = join(rootPath, "app", "routes");

    createGitRepo(rootPath);
    fs.mkdirSync(nestedPath, { recursive: true });
    fs.writeFileSync(
      join(rootPath, CONFIG_FILENAME),
      JSON.stringify({
        localSourceDirs: ["app/routes"]
      })
    );

    expect(discoverRepositoryContext(nestedPath)).toEqual({
      rootPath,
      config: {
        ...defaultConfig,
        localSourceDirs: ["app/routes"]
      }
    });
  });

  it("returns default config when repository root has no config file", () => {
    const rootPath = createTempDir();

    createGitRepo(rootPath);

    expect(discoverRepositoryContext(rootPath)).toEqual({
      rootPath,
      config: defaultConfig
    });
  });
});
