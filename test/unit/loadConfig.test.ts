import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { defaultConfig } from "../../src/config/defaults";
import { CONFIG_FILENAME, loadConfig } from "../../src/config/loadConfig";

const tempDirs: string[] = [];

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "reuse-me-"));
  tempDirs.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("loadConfig", () => {
  it("falls back to defaults when config is missing", () => {
    const directory = createTempDir();

    expect(loadConfig(directory)).toEqual(defaultConfig);
  });

  it("merges partial configuration with defaults", () => {
    const directory = createTempDir();

    writeFileSync(
      join(directory, CONFIG_FILENAME),
      JSON.stringify({
        localSourceDirs: ["app/routes"],
        warningThreshold: 0.75
      })
    );

    expect(loadConfig(directory)).toEqual({
      ...defaultConfig,
      localSourceDirs: ["app/routes"],
      warningThreshold: 0.75
    });
  });

  it("throws a clear error for invalid configuration", () => {
    const directory = createTempDir();

    writeFileSync(
      join(directory, CONFIG_FILENAME),
      JSON.stringify({
        warningThreshold: "high"
      })
    );

    expect(() => loadConfig(directory)).toThrow(
      `"warningThreshold" must be a number`
    );
  });

  it("rejects unknown fields", () => {
    const directory = createTempDir();

    writeFileSync(
      join(directory, CONFIG_FILENAME),
      JSON.stringify({
        mysteryField: true
      })
    );

    expect(() => loadConfig(directory)).toThrow(`unknown field(s): mysteryField`);
  });

  it("throws a clear error for malformed JSON", () => {
    const directory = createTempDir();

    writeFileSync(join(directory, CONFIG_FILENAME), "{ invalid");

    expect(() => loadConfig(directory)).toThrow(
      `Invalid configuration in ${CONFIG_FILENAME}`
    );
  });

  it("loads from a directory without requiring git", () => {
    const root = createTempDir();
    const nested = join(root, "nested");

    mkdirSync(nested);
    writeFileSync(
      join(root, CONFIG_FILENAME),
      JSON.stringify({
        sharedSourceDirs: ["app/ui"]
      })
    );

    expect(loadConfig(nested)).toEqual(defaultConfig);
    expect(loadConfig(root)).toEqual({
      ...defaultConfig,
      sharedSourceDirs: ["app/ui"]
    });
  });

  it("maps legacy source directory fields to generic config", () => {
    const directory = createTempDir();

    writeFileSync(
      join(directory, CONFIG_FILENAME),
      JSON.stringify({
        sharedComponentDirs: ["legacy/ui"],
        screenDirs: ["legacy/routes"]
      })
    );

    expect(loadConfig(directory)).toEqual({
      ...defaultConfig,
      sharedSourceDirs: ["legacy/ui"],
      localSourceDirs: ["legacy/routes"]
    });
  });
});
