import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { SourceFileParser } from "../../src/extractors/typescript-react/sourceFileParser";
import { StyleTokenExtractor } from "../../src/extractors/typescript-react/styleTokenExtractor";
import type { ParsedSource } from "../../src/extractors/typescript-react/parsedSource";
import type { RepositoryFacts } from "../../src/model/repositoryFacts";

const tempDirs: string[] = [];
const extractor = new StyleTokenExtractor();

function parsed(sourceText: string): ParsedSource {
  const directory = mkdtempSync(join(tmpdir(), "reuse-me-"));
  const path = join(directory, "Component.tsx");
  tempDirs.push(directory);
  writeFileSync(path, sourceText);

  return new SourceFileParser().parse({
    path,
    framework: "react",
    kind: "component"
  });
}

function emptyFacts(): RepositoryFacts {
  return {
    path: "src/components/Button.tsx",
    imports: [],
    exports: [],
    declarations: [],
    features: []
  };
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("StyleTokenExtractor", () => {
  it("extracts static className string tokens", () => {
    expect(
      extractor.enrich(
        parsed(`export function Button() { return <button className="primary large" />; }`),
        emptyFacts()
      ).features
    ).toEqual([
      { category: "style", key: "className", value: "primary" },
      { category: "style", key: "className", value: "large" }
    ]);
  });

  it("skips dynamic className expressions", () => {
    expect(
      extractor.enrich(
        parsed(`export function Button() { return <button className={name} />; }`),
        emptyFacts()
      ).features
    ).toEqual([]);
  });

  it("extracts simple inline style keys", () => {
    expect(
      extractor.enrich(
        parsed(`export function Button() { return <button style={{ color: "red", marginTop: 4 }} />; }`),
        emptyFacts()
      ).features
    ).toEqual([
      { category: "style", key: "styleKey", value: "color" },
      { category: "style", key: "styleKey", value: "marginTop" }
    ]);
  });

  it("handles files without styles", () => {
    expect(
      extractor.enrich(
        parsed(`export function Button() { return <button />; }`),
        emptyFacts()
      ).features
    ).toEqual([]);
  });

  it("handles parse failures gracefully", () => {
    expect(
      extractor.enrich(
        {
          path: "src/components/Broken.tsx",
          sourceText: "export function Broken(",
          ast: null,
          parseError: {
            message: "broken",
            diagnostics: ["broken"]
          }
        },
        emptyFacts()
      ).features
    ).toEqual([]);
  });
});
