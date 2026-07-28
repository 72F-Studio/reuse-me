import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { KnowledgePipelineRunner } from "../../src/runner/knowledgePipelineRunner";

const tempDirs: string[] = [];

function writeFixture(root: string, path: string, source: string): void {
  const absolutePath = join(root, path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, source);
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("GenericDeclarationsExtractor", () => {
  it("extracts declarations and resolves imports across common languages", () => {
    const root = mkdtempSync(join(tmpdir(), "reuse-me-"));
    tempDirs.push(root);
    mkdirSync(join(root, ".git"));
    writeFixture(
      root,
      "app/src/main/kotlin/com/example/Foo.kt",
      "package com.example\nclass Foo"
    );
    writeFixture(
      root,
      "app/src/main/kotlin/com/example/Bar.kt",
      "package com.example\nimport com.example.Foo\nclass Bar(val foo: Foo)"
    );
    writeFixture(root, "pkg/models.py", "class User:\n    pass\n");
    writeFixture(root, "pkg/service.py", "from pkg.models import User\n");

    const result = new KnowledgePipelineRunner().construct(root);

    expect(result.status).toBe("ready");

    if (result.status !== "ready") {
      throw new Error("Expected ready repository knowledge");
    }

    expect(result.capabilities).toContainEqual({
      id: "declaration-extraction",
      name: "Declaration extraction",
      status: "available",
      reason: "Generic Declaration Provider"
    });
    expect(result.capabilities).toContainEqual({
      id: "ui-extraction",
      name: "UI extraction",
      status: "missing",
      reason: "no knowledge provider contributes this intelligence"
    });
    expect(result.knowledge.declarationsByName("Foo")).toHaveLength(1);
    expect(result.knowledge.declarationsByName("User")).toHaveLength(1);
    expect(result.knowledge.relationships()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          importerPath: "app/src/main/kotlin/com/example/Bar.kt",
          sourceModule: "com.example.Foo",
          resolution: "resolved",
          targetPath: "app/src/main/kotlin/com/example/Foo.kt",
          targetDeclarationName: "Foo"
        }),
        expect.objectContaining({
          importerPath: "pkg/service.py",
          sourceModule: "pkg.models",
          resolution: "resolved",
          targetPath: "pkg/models.py",
          targetDeclarationName: "User"
        })
      ])
    );
    expect(
      result.knowledge.usageForPath("app/src/main/kotlin/com/example/Foo.kt")
        ?.fileReferenceCount
    ).toBe(1);
    expect(result.knowledge.usageForPath("pkg/models.py")?.fileReferenceCount).toBe(
      1
    );
  });

  // Kotlin, Java, C#, Scala, Go and Swift let a file use a sibling in the same
  // package with no import statement. Counting imports alone reported those
  // repositories as having almost no internal references.
  it("counts a same-package reference that no import statement records", () => {
    const root = mkdtempSync(join(tmpdir(), "reuse-me-scope-"));
    tempDirs.push(root);
    mkdirSync(join(root, ".git"));
    writeFixture(
      root,
      "app/src/main/kotlin/com/example/ui/PrimaryButton.kt",
      "package com.example.ui\n\nclass PrimaryButton\n"
    );
    writeFixture(
      root,
      "app/src/main/kotlin/com/example/ui/LoginScreen.kt",
      "package com.example.ui\n\nclass LoginScreen {\n    val button = PrimaryButton()\n}\n"
    );

    const result = new KnowledgePipelineRunner().construct(root);

    if (result.status !== "ready") {
      throw new Error("Expected ready repository knowledge");
    }

    expect(
      result.knowledge.usageForPath(
        "app/src/main/kotlin/com/example/ui/PrimaryButton.kt"
      )?.fileReferenceCount
    ).toBe(1);
  });

  it("does not count a framework import as an unresolved repository import", () => {
    const root = mkdtempSync(join(tmpdir(), "reuse-me-external-"));
    tempDirs.push(root);
    mkdirSync(join(root, ".git"));
    writeFixture(
      root,
      "app/src/main/kotlin/com/example/ui/Screen.kt",
      "package com.example.ui\n\nimport androidx.compose.material3.Button\n\nclass Screen\n"
    );

    const result = new KnowledgePipelineRunner().construct(root);

    if (result.status !== "ready") {
      throw new Error("Expected ready repository knowledge");
    }

    expect(
      result.knowledge
        .relationships()
        .find((relationship) => relationship.sourceModule.startsWith("androidx"))
        ?.resolution
    ).toBe("external");
  });
});
