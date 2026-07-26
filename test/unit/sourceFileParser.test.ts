import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { SourceFileParser } from "../../src/extractors/typescript-react/sourceFileParser";
import type { UiFile } from "../../src/extractors/typescript-react/uiFile";

const tempDirs: string[] = [];

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "reuse-me-"));
  tempDirs.push(directory);
  return directory;
}

function createUiFile(
  relativePath: string,
  sourceText: string,
  kind: UiFile["kind"] = "component",
  framework: UiFile["framework"] = "react"
): UiFile {
  const directory = createTempDir();
  const filePath = join(directory, relativePath);

  writeFileSync(filePath, sourceText);

  return {
    path: filePath,
    kind,
    framework
  };
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("SourceFileParser", () => {
  const parser = new SourceFileParser();

  it("parses valid source", () => {
    const uiFile = createUiFile(
      "Button.tsx",
      'export function Button() { return <button>Click</button>; }'
    );

    const parsedSource = parser.parse(uiFile);

    expect(parsedSource.path).toBe(uiFile.path);
    expect(parsedSource.sourceText).toContain("Button");
    expect(parsedSource.ast).not.toBeNull();
    expect(parsedSource.parseError).toBeNull();
  });

  it("represents invalid source safely", () => {
    const uiFile = createUiFile(
      "Broken.tsx",
      "export function Broken( { return <div />; }"
    );

    const parsedSource = parser.parse(uiFile);

    expect(parsedSource.path).toBe(uiFile.path);
    expect(parsedSource.ast).toBeNull();
    expect(parsedSource.parseError).not.toBeNull();
    expect(parsedSource.parseError?.diagnostics.length).toBeGreaterThan(0);
  });

  it("parses an empty file", () => {
    const uiFile = createUiFile("Empty.tsx", "");

    const parsedSource = parser.parse(uiFile);

    expect(parsedSource.sourceText).toBe("");
    expect(parsedSource.ast).not.toBeNull();
    expect(parsedSource.parseError).toBeNull();
  });

  it("represents unsupported syntax safely", () => {
    const uiFile = createUiFile(
      "Unsupported.tsx",
      "export function Unsupported() { return <% not-tsx %>; }"
    );

    const parsedSource = parser.parse(uiFile);

    expect(parsedSource.ast).toBeNull();
    expect(parsedSource.parseError).not.toBeNull();
    expect(parsedSource.parseError?.message.length).toBeGreaterThan(0);
  });
});
