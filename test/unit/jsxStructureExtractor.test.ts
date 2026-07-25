import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach } from "vitest";
import { describe, expect, it } from "vitest";

import { JsxStructureExtractor } from "../../src/extractors/typescript-react/jsxStructureExtractor";
import { RepositoryFactsBuilder } from "../../src/extractors/typescript-react/repositoryFactsBuilder";
import { SourceFileParser } from "../../src/extractors/typescript-react/sourceFileParser";
import type { ParsedSource } from "../../src/extractors/typescript-react/parsedSource";
import type { RepositoryFacts } from "../../src/model/repositoryFacts";
import type { UiFile } from "../../src/extractors/typescript-react/uiFile";

const extractor = new JsxStructureExtractor();
const builder = new RepositoryFactsBuilder();
const tempDirs: string[] = [];

function parsed(sourceText: string): ParsedSource {
  const parser = new SourceFileParser();
  const uiFile: UiFile = {
    path: "test/unit/fixtures/Component.tsx",
    framework: "react",
    kind: "component"
  };

  return parser.parse({
    ...uiFile,
    path: createVirtualFile(sourceText)
  });
}

function createVirtualFile(sourceText: string): string {
  const directory = mkdtempSync(join(tmpdir(), "component-intent-audit-"));
  const path = join(directory, "Component.tsx");
  tempDirs.push(directory);
  writeFileSync(path, sourceText);
  return path;
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

describe("JsxStructureExtractor", () => {
  afterEach(() => {
    for (const directory of tempDirs.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("extracts intrinsic JSX elements", () => {
    expect(
      extractor.enrich(
        parsed("export function Button() { return <button />; }"),
        emptyFacts()
      ).features
    ).toEqual([{ category: "structure", key: "intrinsic", value: "button" }]);
  });

  it("extracts component JSX elements", () => {
    expect(
      extractor.enrich(
        parsed("export function Page() { return <Button />; }"),
        emptyFacts()
      ).features
    ).toEqual([{ category: "structure", key: "component", value: "Button" }]);
  });

  it("handles nested JSX", () => {
    expect(
      extractor.enrich(
        parsed("export function Page() { return <section><Button /></section>; }"),
        emptyFacts()
      ).features
    ).toEqual([
      { category: "structure", key: "intrinsic", value: "section" },
      { category: "structure", key: "component", value: "Button" }
    ]);
  });

  it("handles files without JSX", () => {
    const source = parsed("export const value = 1;");

    expect(extractor.enrich(source, builder.build(source)).features).toEqual([]);
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
