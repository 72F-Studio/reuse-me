import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { CONFIG_FILENAME } from "../../src/config/loadConfig";
import {
  discoverRepositoryContext,
  findRepositoryRoot,
  resolveFallbackRoot
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

  it("prefers the git root over a nested manifest", () => {
    const rootPath = createTempDir();
    const nestedPath = join(rootPath, "packages", "web");

    createGitRepo(rootPath);
    fs.mkdirSync(nestedPath, { recursive: true });
    fs.writeFileSync(join(nestedPath, "package.json"), "{}\n");

    expect(findRepositoryRoot(nestedPath)).toBe(rootPath);
  });
});

describe("resolveFallbackRoot", () => {
  it("falls back to the nearest project manifest", () => {
    const rootPath = createTempDir();
    const nestedPath = join(rootPath, "app", "src");

    fs.mkdirSync(nestedPath, { recursive: true });
    fs.writeFileSync(join(rootPath, "pubspec.yaml"), "name: demo\n");

    expect(resolveFallbackRoot(nestedPath)).toBe(rootPath);
  });

  it("recognises manifests from several ecosystems", () => {
    for (const filename of ["go.mod", "Cargo.toml", "pom.xml", "Package.swift"]) {
      const rootPath = createTempDir();
      const nestedPath = join(rootPath, "nested");

      fs.mkdirSync(nestedPath, { recursive: true });
      fs.writeFileSync(join(rootPath, filename), "");

      expect(resolveFallbackRoot(nestedPath)).toBe(rootPath);
    }
  });

  it("falls back to the starting path when nothing marks a root", () => {
    const nestedPath = "/component-intent-audit-no-root/nested/deeper";

    expect(resolveFallbackRoot(nestedPath)).toBe(nestedPath);
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
