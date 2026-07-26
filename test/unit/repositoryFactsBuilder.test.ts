import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { RepositoryFactsBuilder } from "../../src/extractors/typescript-react/repositoryFactsBuilder";
import { SourceFileParser } from "../../src/extractors/typescript-react/sourceFileParser";
import type { UiFile } from "../../src/extractors/typescript-react/uiFile";

const tempDirs: string[] = [];

function createTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "reuse-me-"));
  tempDirs.push(directory);
  return directory;
}

function createUiFile(relativePath: string, sourceText: string): UiFile {
  const directory = createTempDir();
  const filePath = join(directory, relativePath);

  writeFileSync(filePath, sourceText);

  return {
    path: filePath,
    framework: "react",
    kind: "component"
  };
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("RepositoryFactsBuilder", () => {
  const parser = new SourceFileParser();
  const builder = new RepositoryFactsBuilder();

  it("extracts a default import", () => {
    const parsedSource = parser.parse(
      createUiFile(
        "DefaultImport.tsx",
        'import React from "react"; export default function App() { return null; }'
      )
    );

    expect(builder.build(parsedSource).imports).toContainEqual({
      sourceModule: "react",
      kind: "default",
      localName: "React"
    });
  });

  it("extracts a named import", () => {
    const parsedSource = parser.parse(
      createUiFile(
        "NamedImport.tsx",
        'import { useState as state } from "react"; export default function App() { return null; }'
      )
    );

    expect(builder.build(parsedSource).imports).toContainEqual({
      sourceModule: "react",
      kind: "named",
      localName: "state",
      importedName: "useState"
    });
  });

  it("extracts a namespace import", () => {
    const parsedSource = parser.parse(
      createUiFile(
        "NamespaceImport.tsx",
        'import * as React from "react"; export default function App() { return null; }'
      )
    );

    expect(builder.build(parsedSource).imports).toContainEqual({
      sourceModule: "react",
      kind: "namespace",
      localName: "React"
    });
  });

  it("extracts a re-export source as an import relationship", () => {
    const parsedSource = parser.parse(
      createUiFile(
        "ReExport.tsx",
        'export { Button as PrimaryButton } from "@/components/Button";'
      )
    );

    expect(builder.build(parsedSource).imports).toContainEqual({
      sourceModule: "@/components/Button",
      kind: "named",
      localName: "PrimaryButton",
      importedName: "Button"
    });
  });

  it("extracts a default export", () => {
    const parsedSource = parser.parse(
      createUiFile(
        "DefaultExport.tsx",
        "function App() { return null; } export default App;"
      )
    );

    expect(builder.build(parsedSource).exports).toContainEqual({
      kind: "default",
      exportedName: "default",
      localName: "App"
    });
  });

  it("extracts a named export", () => {
    const parsedSource = parser.parse(
      createUiFile(
        "NamedExport.tsx",
        "export function Button() { return null; }"
      )
    );

    expect(builder.build(parsedSource).exports).toContainEqual({
      kind: "named",
      exportedName: "Button",
      localName: "Button"
    });
  });

  it("extracts a function component declaration", () => {
    const parsedSource = parser.parse(
      createUiFile(
        "FunctionComponent.tsx",
        "export function Button() { return <button />; }"
      )
    );

    expect(builder.build(parsedSource).declarations).toContainEqual({
      kind: "declaration",
      name: "Button",
      visibility: "exported"
    });
  });

  it("extracts an arrow component declaration", () => {
    const parsedSource = parser.parse(
      createUiFile(
        "ArrowComponent.tsx",
        "export const Card = () => <section />;"
      )
    );

    expect(builder.build(parsedSource).declarations).toContainEqual({
      kind: "declaration",
      name: "Card",
      visibility: "exported"
    });
  });

  it("extracts a default exported component declaration", () => {
    const parsedSource = parser.parse(
      createUiFile(
        "DefaultComponent.tsx",
        "export default function Button() { return <button />; }"
      )
    );

    expect(builder.build(parsedSource).declarations).toContainEqual({
      kind: "declaration",
      name: "Button",
      visibility: "exported"
    });
  });

  it("handles an anonymous default export safely", () => {
    const parsedSource = parser.parse(
      createUiFile(
        "AnonymousDefault.tsx",
        "export default function () { return <button />; }"
      )
    );

    expect(builder.build(parsedSource).declarations).toContainEqual({
      kind: "declaration",
      name: undefined,
      visibility: "exported"
    });
  });

  it("handles parse failures gracefully", () => {
    const parsedSource = parser.parse(
      createUiFile("Broken.tsx", "export function Broken( { return <div />; }")
    );

    expect(builder.build(parsedSource)).toEqual({
      path: parsedSource.path,
      imports: [],
      exports: [],
      declarations: [],
      features: []
    });
  });
});
