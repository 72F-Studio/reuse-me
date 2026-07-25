import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ChangeAnalysisRunner } from "../../src/runner/changeAnalysisRunner";
import { KnowledgePipelineRunner } from "../../src/runner/knowledgePipelineRunner";
import { RepositoryHealthRunner } from "../../src/runner/repositoryHealthRunner";

const tempDirs: string[] = [];

function createRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "component-intent-audit-"));
  tempDirs.push(root);
  mkdirSync(join(root, ".git"));
  writeFixture(
    root,
    "src/components/Button.tsx",
    `export function Button() { return <button className="primary" />; }`
  );
  writeFixture(
    root,
    "src/pages/A.tsx",
    `export function A() { return <button className="primary" />; }`
  );
  writeFixture(
    root,
    "src/pages/B.tsx",
    `export function B() { return <button className="primary" />; }`
  );

  return root;
}

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

describe("mode runners", () => {
  it("runs change analysis from shared repository knowledge", () => {
    const root = createRepo();
    const knowledge = new KnowledgePipelineRunner().run(root);
    const result = new ChangeAnalysisRunner().run(knowledge, [
      { path: "src/pages/A.tsx", status: "modified" },
      { path: "src/pages/B.tsx", status: "modified" }
    ]);

    expect(result.warnings).toEqual([
      {
        changedFiles: ["src/pages/A.tsx", "src/pages/B.tsx"],
        candidatePath: "src/components/Button.tsx",
        candidateName: "Button",
        confidence: 0.8,
        evidence: ["similarity score", "shared role"]
      }
    ]);
  });

  it("runs repository health without Git changes", () => {
    const root = createRepo();
    const construction = new KnowledgePipelineRunner().construct(root);

    if (construction.status !== "ready") {
      throw new Error("Expected ready repository knowledge");
    }

    const result = new RepositoryHealthRunner().run(construction.knowledge, {
      capabilities: construction.capabilities,
      repositoryStructure: construction.repositoryStructure
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("Expected ready repository health result");
    }

    expect(result.competingImplementations).toEqual([
      {
        kind: "competing-implementation",
        sourcePaths: ["src/pages/A.tsx", "src/pages/B.tsx"],
        candidatePath: "src/components/Button.tsx",
        candidateName: "Button",
        confidence: 0.8,
        evidence: ["similarity score", "shared role"]
      }
    ]);
    expect(result.missingAbstractions).toEqual([]);
  });

  it("reports limited repositories when no source extractor can produce facts", () => {
    const root = mkdtempSync(join(tmpdir(), "component-intent-audit-"));
    tempDirs.push(root);
    mkdirSync(join(root, ".git"));
    writeFixture(root, "README.md", "# Notes");

    expect(new KnowledgePipelineRunner().construct(root)).toMatchObject({
      status: "limited",
      detectedLanguages: [],
      registeredExtractors: [
        {
          id: "typescript-react",
          name: "TypeScript React Provider"
        },
        {
          id: "generic-declarations",
          name: "Generic Declaration Provider"
        }
      ],
      capabilities: [
        { id: "repository-structure", status: "available" },
        { id: "repository-heuristics", status: "available" },
        { id: "declaration-extraction", status: "missing" },
        { id: "ui-extraction", status: "missing" }
      ],
      repositoryStructure: {
        summary: {
          fileCount: 1,
          sourceFileCount: 0
        }
      }
    });
  });
});
