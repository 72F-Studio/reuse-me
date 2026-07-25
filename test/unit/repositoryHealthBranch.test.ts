import { describe, expect, it } from "vitest";

import { CompetingImplementationDetector } from "../../src/analysis/competingImplementationDetector";
import { MissingAbstractionDetector } from "../../src/analysis/missingAbstractionDetector";
import { RepositoryFactsIndexBuilder } from "../../src/analysis/repositoryFactsIndexBuilder";
import { RepositoryHealthResultAssembler } from "../../src/analysis/repositoryHealthResultAssembler";
import { RepositoryPatternDetector } from "../../src/analysis/repositoryPatternDetector";
import { UnusedAbstractionDetector } from "../../src/analysis/unusedAbstractionDetector";
import { defaultConfig } from "../../src/config/defaults";
import { RepositoryKnowledgeAssembler } from "../../src/knowledge/repositoryKnowledgeAssembler";
import type { AbstractionCandidate } from "../../src/model/abstractionCandidate";
import type { ConfidenceScore } from "../../src/model/confidence";
import type { ObservedPattern } from "../../src/model/observedPattern";
import type { CandidateRanking } from "../../src/model/ranking";
import type { RelationshipFact } from "../../src/model/relationship";
import type { RepositoryContext } from "../../src/model/repository";
import type { RepositoryFacts } from "../../src/model/repositoryFacts";
import type { RepositoryKnowledge } from "../../src/model/repositoryKnowledge";
import type { RoleFact } from "../../src/model/role";
import type { SourceArtifact } from "../../src/model/sourceArtifact";
import type { UsageFact } from "../../src/model/usage";
import { RepositoryHealthRunner } from "../../src/runner/repositoryHealthRunner";

const indexBuilder = new RepositoryFactsIndexBuilder();
const assembler = new RepositoryKnowledgeAssembler();
const capabilities = [
  {
    id: "repository-structure",
    name: "Repository structure",
    status: "available" as const,
    reason: "built-in"
  }
];
const repositoryStructure = {
  summary: {
    rootPath: "/repo",
    fileCount: 1,
    directoryCount: 1,
    sourceFileCount: 1,
    topLevelDirectories: ["src"]
  },
  findings: []
};
const intelligence = {
  areas: [
    {
      id: "repository-structure",
      name: "Repository Structure",
      coverage: "complete" as const,
      confidence: "high" as const,
      reason: "built-in repository intelligence"
    }
  ],
  unavailable: [],
  providers: [{ id: "built-in", name: "Built-in Repository Intelligence" }]
};

const context: RepositoryContext = {
  rootPath: "/repo",
  config: {
    ...defaultConfig,
    warningThreshold: 0.7
  }
};

function facts(path: string): RepositoryFacts {
  return {
    path,
    imports: [],
    exports: [],
    declarations: [],
    features: [
      { category: "structure", key: "intrinsic", value: "button" },
      { category: "style", key: "className", value: "primary" }
    ]
  };
}

function artifact(path: string): SourceArtifact {
  return {
    path,
    extractorId: "test",
    language: { id: "typescript", name: "TypeScript" },
    roleHints: []
  };
}

function knowledge(
  repositoryFacts: RepositoryFacts[],
  usage: UsageFact[] = [],
  relationships: RelationshipFact[] = []
): RepositoryKnowledge {
  return assembler.assemble({
    context,
    sourceArtifacts: repositoryFacts.map((entry) => artifact(entry.path)),
    factsIndex: indexBuilder.build(repositoryFacts),
    relationships,
    usage
  });
}

describe("repository health branch", () => {
  it("detects repeated repository-wide local patterns and ignores shared files", () => {
    const roles: RoleFact[] = [
      { scope: "file", path: "src/pages/A.tsx", role: "local", reasons: [] },
      { scope: "file", path: "src/pages/B.tsx", role: "local", reasons: [] },
      {
        scope: "file",
        path: "src/components/Button.tsx",
        role: "shared",
        reasons: []
      }
    ];

    expect(
      new RepositoryPatternDetector().detect(
        knowledge([
          facts("src/pages/A.tsx"),
          facts("src/pages/B.tsx"),
          facts("src/components/Button.tsx")
        ]),
        roles
      )
    ).toEqual([
      {
        id: "repository-pattern-1",
        sourcePaths: ["src/pages/A.tsx", "src/pages/B.tsx"],
        features: [
          { category: "structure", key: "intrinsic", value: "button" },
          { category: "style", key: "className", value: "primary" }
        ],
        names: ["button"]
      }
    ]);
  });

  it("detects unused shared abstractions conservatively", () => {
    const candidate: AbstractionCandidate = {
      path: "src/components/Button.tsx",
      name: "Button",
      evidence: ["shared role"]
    };

    expect(
      new UnusedAbstractionDetector().detect(
        knowledge([facts("src/components/Button.tsx")]),
        [
          {
            scope: "file",
            path: "src/components/Button.tsx",
            role: "shared",
            reasons: []
          }
        ],
        [candidate]
      )
    ).toEqual([
      {
        kind: "unused-abstraction",
        candidatePath: "src/components/Button.tsx",
        candidateName: "Button",
        evidence: ["shared candidate has zero references"]
      }
    ]);
  });

  it("creates competing implementation findings above threshold", () => {
    const pattern: ObservedPattern = {
      id: "repository-pattern-1",
      sourcePaths: ["src/pages/A.tsx", "src/pages/B.tsx"],
      features: [],
      names: []
    };
    const ranking: CandidateRanking = {
      patternId: "repository-pattern-1",
      candidate: {
        path: "src/components/Button.tsx",
        name: "Button",
        evidence: []
      },
      rank: 1,
      score: 0.9,
      candidateFeatureCount: 5,
      reasons: ["similarity score"]
    };
    const confidence: ConfidenceScore = {
      patternId: "repository-pattern-1",
      candidatePath: "src/components/Button.tsx",
      candidateName: "Button",
      score: 0.9,
      reasons: ["similarity score"]
    };

    expect(
      new CompetingImplementationDetector().detect(
        context,
        [pattern],
        [ranking],
        [confidence]
      )
    ).toEqual([
      {
        kind: "competing-implementation",
        sourcePaths: ["src/pages/A.tsx", "src/pages/B.tsx"],
        candidatePath: "src/components/Button.tsx",
        candidateName: "Button",
        confidence: 0.9,
        evidence: ["similarity score"]
      }
    ]);
  });

  it("creates missing abstraction findings when no strong candidate exists", () => {
    const pattern: ObservedPattern = {
      id: "repository-pattern-1",
      sourcePaths: ["src/pages/A.tsx", "src/pages/B.tsx"],
      features: [],
      names: []
    };

    expect(
      new MissingAbstractionDetector().detect(context, [pattern], [])
    ).toEqual([
      {
        kind: "missing-abstraction",
        sourcePaths: ["src/pages/A.tsx", "src/pages/B.tsx"],
        evidence: ["repeated local pattern without strong candidate"]
      }
    ]);
  });

  it("packages repository health results", () => {
    expect(
      new RepositoryHealthResultAssembler().assemble({
        capabilities,
        intelligence,
        repositoryStructure,
        semanticSummary: {
          declarationCount: 1,
          importCount: 0,
          relationshipCount: 0,
          resolvedRelationshipCount: 0,
          referencedFileCount: 0
        },
        intelligenceSignals: {
          topReferencedFiles: [],
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
        missingAbstractions: []
      })
    ).toEqual({
      mode: "health",
      status: "ready",
      capabilities,
      intelligence,
      repository: repositoryStructure.summary,
      repositoryHeuristics: [],
      intelligenceSignals: {
        topReferencedFiles: [],
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
    });
  });

  it("summarizes intelligence signals for agents", () => {
    const result = new RepositoryHealthRunner().run(
      knowledge(
        [
          {
            ...facts("src/local/A.ts"),
            imports: [
              {
                sourceModule: "../shared/Button",
                kind: "named",
                localName: "Button",
                importedName: "Button"
              },
              {
                sourceModule: "../missing/Missing",
                kind: "named",
                localName: "Missing",
                importedName: "Missing"
              }
            ]
          },
          {
            ...facts("src/shared/Button.ts"),
            declarations: [
              { kind: "declaration", name: "Button", visibility: "exported" }
            ]
          },
          {
            ...facts("src/other/Button.ts"),
            declarations: [
              { kind: "declaration", name: "Button", visibility: "exported" }
            ]
          }
        ],
        [
          {
            path: "src/shared/Button.ts",
            fileReferenceCount: 1,
            declarationReferences: [{ name: "Button", referenceCount: 1 }]
          }
        ],
        [
          {
            importerPath: "src/local/A.ts",
            sourceModule: "react",
            importKind: "named",
            localName: "useMemo",
            importedName: "useMemo",
            resolution: "unresolved"
          },
          {
            importerPath: "src/local/A.ts",
            sourceModule: "../missing/Missing",
            importKind: "named",
            localName: "Missing",
            importedName: "Missing",
            resolution: "unresolved"
          }
        ]
      ),
      {
        capabilities: [
          ...capabilities,
          {
            id: "declaration-extraction",
            name: "Declaration extraction",
            status: "available" as const,
            reason: "Generic Declaration Provider"
          }
        ],
        repositoryStructure
      }
    );

    expect(result.status).toBe("ready");

    if (result.status !== "ready") {
      throw new Error("Expected ready repository health result");
    }

    expect(result.intelligenceSignals.topReferencedFiles[0]).toMatchObject({
      path: "src/shared/Button.ts",
      referenceCount: 1
    });
    expect(result.intelligenceSignals.duplicateDeclarations).toEqual([
      {
        name: "Button",
        paths: ["src/other/Button.ts", "src/shared/Button.ts"]
      }
    ]);
    expect(result.intelligenceSignals.unresolvedImports).toEqual([
      {
        sourceModule: "../missing/Missing",
        importerCount: 1,
        sampleImporters: ["src/local/A.ts"]
      }
    ]);
    expect(result.intelligence.areas).toContainEqual(
      expect.objectContaining({
        id: "relationship-analysis",
        coverage: "partial",
        confidence: "low"
      })
    );
  });
});
