import { describe, expect, it } from "vitest";

import { JsonReporter } from "../../src/reporter/jsonReporter";
import { MarkdownReporter } from "../../src/reporter/markdownReporter";
import { TextReporter } from "../../src/reporter/textReporter";
import type { ChangeAnalysisResult } from "../../src/model/changeAnalysisResult";
import type { RepositoryHealthResult } from "../../src/model/repositoryHealthResult";

const capabilities = [
  {
    id: "repository-structure",
    name: "Repository structure",
    status: "available" as const,
    reason: "built-in"
  },
  {
    id: "repository-heuristics",
    name: "Repository heuristics",
    status: "available" as const,
    reason: "built-in"
  }
];

const repository = {
  fileCount: 3,
  directoryCount: 2,
  sourceFileCount: 3,
  topLevelDirectories: ["src"]
};

const intelligence = {
  areas: [
    {
      id: "repository-structure",
      name: "Repository Structure",
      coverage: "complete" as const,
      confidence: "high" as const,
      reason: "built-in repository intelligence"
    },
    {
      id: "declaration-analysis",
      name: "Declaration Analysis",
      coverage: "partial" as const,
      confidence: "medium" as const,
      reason: "Generic Declaration Provider knowledge provider"
    },
    {
      id: "ui-semantics",
      name: "UI Semantics",
      coverage: "unavailable" as const,
      confidence: "not-available" as const,
      reason: "no UI knowledge provider installed"
    }
  ],
  unavailable: [
    {
      name: "UI Semantics",
      reason: "no UI knowledge provider installed"
    }
  ],
  providers: [
    { id: "built-in", name: "Built-in Repository Intelligence" },
    { id: "generic-declaration-provider", name: "Generic Declaration Provider" }
  ]
};

const changeResult: ChangeAnalysisResult = {
  mode: "change",
  warnings: [
    {
      changedFiles: ["src/pages/A.tsx", "src/pages/B.tsx"],
      candidatePath: "src/components/Button.tsx",
      candidateName: "Button",
      confidence: 0.9,
      evidence: ["similarity score"]
    }
  ],
  metadata: {
    changedFileCount: 2,
    warningCount: 1
  }
};

const healthResult: RepositoryHealthResult = {
  mode: "health",
  status: "ready",
  capabilities,
  intelligence,
  repository,
  repositoryHeuristics: [],
  intelligenceSignals: {
    topReferencedFiles: [
      {
        path: "src/components/Button.tsx",
        referenceCount: 3,
        topDeclarations: [{ name: "Button", referenceCount: 3 }]
      }
    ],
    unresolvedImports: [],
    duplicateDeclarations: []
  },
  unusedAbstractions: [
    {
      kind: "unused-abstraction",
      candidatePath: "src/components/Button.tsx",
      candidateName: "Button",
      evidence: []
    }
  ],
  competingImplementations: [],
  missingAbstractions: [],
  metadata: {
    findingCount: 1,
    declarationCount: 1,
    importCount: 0,
    relationshipCount: 0,
    resolvedRelationshipCount: 0,
    referencedFileCount: 0
  }
};

const limitedHealthResult: RepositoryHealthResult = {
  mode: "health",
  status: "limited",
  detectedLanguages: [{ id: "kotlin", name: "Kotlin" }],
  registeredExtractors: [
    {
      id: "typescript-react",
      name: "TypeScript React Provider",
      languages: [
        { id: "typescript", name: "TypeScript" },
        { id: "javascript", name: "JavaScript" }
      ]
    }
  ],
  capabilities: [
    ...capabilities,
    {
      id: "declaration-extraction",
      name: "Declaration extraction",
      status: "missing",
      reason: "no knowledge provider contributes this intelligence"
    },
    {
      id: "ui-extraction",
      name: "UI extraction",
      status: "missing",
      reason: "no knowledge provider contributes this intelligence"
    }
  ],
  intelligence,
  repository,
  repositoryHeuristics: [
    {
      kind: "repository-heuristic",
      title: "Duplicate source filename: HomeScreen.kt",
      paths: ["app/HomeScreen.kt", "core/HomeScreen.kt"],
      evidence: ["2 files share the same leaf filename"]
    }
  ],
  metadata: {
    findingCount: 1
  }
};

describe("reporters", () => {
  it("renders text output for change and health results", () => {
    expect(new TextReporter().render(changeResult)).toContain(
      "Source-of-truth warning"
    );
    expect(new TextReporter().render(healthResult)).toContain(
      "Unused abstraction"
    );
    expect(new TextReporter().render(healthResult)).toContain(
      "Top referenced file"
    );
  });

  it("renders empty text output", () => {
    expect(
      new TextReporter().render({
        mode: "change",
        warnings: [],
        metadata: { changedFileCount: 0, warningCount: 0 }
      })
    ).toBe("No source-of-truth warnings.");
    expect(
      new TextReporter().render({
        mode: "health",
        status: "ready",
        capabilities,
        intelligence,
        repository,
        repositoryHeuristics: [],
        intelligenceSignals: {
          topReferencedFiles: [],
          unresolvedImports: [],
          duplicateDeclarations: []
        },
        unusedAbstractions: [],
        competingImplementations: [],
        missingAbstractions: [],
        metadata: {
          findingCount: 0,
          declarationCount: 0,
          importCount: 0,
          relationshipCount: 0,
          resolvedRelationshipCount: 0,
          referencedFileCount: 0
        }
      })
    ).toContain("No repository health findings.");
  });

  it("renders JSON output", () => {
    expect(JSON.parse(new JsonReporter().render(changeResult))).toEqual(
      changeResult
    );
    expect(JSON.parse(new JsonReporter().render(healthResult))).toEqual(
      healthResult
    );
    expect(
      JSON.parse(new JsonReporter().render(limitedHealthResult))
    ).toEqual(limitedHealthResult);
  });

  it("renders Markdown output for change and health results", () => {
    expect(new MarkdownReporter().render(changeResult)).toContain(
      "## Change Analysis"
    );
    expect(new MarkdownReporter().render(healthResult)).toContain(
      "## RRR Health"
    );
  });

  it("renders limited repository output", () => {
    expect(new TextReporter().render(limitedHealthResult)).toContain(
      "Knowledge Sources"
    );
    expect(new MarkdownReporter().render(limitedHealthResult)).toContain(
      "Unavailable Intelligence"
    );
  });
});
