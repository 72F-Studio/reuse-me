import { describe, expect, it } from "vitest";

import { CandidateDiscovery } from "../../src/analysis/candidateDiscovery";
import { CandidateRanker } from "../../src/analysis/candidateRanker";
import { ConfidenceCalculator } from "../../src/analysis/confidenceCalculator";
import { RepositoryFactsIndexBuilder } from "../../src/analysis/repositoryFactsIndexBuilder";
import { RoleAnalyzer } from "../../src/analysis/roleAnalyzer";
import { SimilarityScorer } from "../../src/analysis/similarityScorer";
import { RepositoryKnowledgeAssembler } from "../../src/knowledge/repositoryKnowledgeAssembler";
import { defaultConfig } from "../../src/config/defaults";
import type { AbstractionCandidate } from "../../src/model/abstractionCandidate";
import type { ObservedPattern } from "../../src/model/observedPattern";
import type { RepositoryContext } from "../../src/model/repository";
import type { RepositoryFacts } from "../../src/model/repositoryFacts";
import type { RepositoryKnowledge } from "../../src/model/repositoryKnowledge";
import type { RelationshipFact } from "../../src/model/relationship";
import type { RoleFact } from "../../src/model/role";
import type { SimilarityResult } from "../../src/model/similarity";
import type { SourceArtifact } from "../../src/model/sourceArtifact";
import type { UsageFact } from "../../src/model/usage";

const indexBuilder = new RepositoryFactsIndexBuilder();
const assembler = new RepositoryKnowledgeAssembler();

function context(): RepositoryContext {
  return {
    rootPath: "/repo",
    config: {
      ...defaultConfig,
      sharedSourceDirs: ["src/components"],
      localSourceDirs: ["src/pages"]
    }
  };
}

function facts(overrides: Partial<RepositoryFacts>): RepositoryFacts {
  return {
    path: "src/components/Button.tsx",
    imports: [],
    exports: [],
    declarations: [],
    features: [],
    ...overrides
  };
}

function knowledge(
  repositoryFacts: RepositoryFacts[],
  usage: UsageFact[] = [],
  relationships: RelationshipFact[] = [],
  sourceArtifacts: SourceArtifact[] = artifactsFor(repositoryFacts)
): RepositoryKnowledge {
  return assembler.assemble({
    context: context(),
    sourceArtifacts,
    factsIndex: indexBuilder.build(repositoryFacts),
    relationships,
    usage
  });
}

function artifact(
  path: string,
  role: "shared" | "local" | "unknown" = "unknown",
  reason = `${role} source`
): SourceArtifact {
  return {
    path,
    extractorId: "test",
    language: { id: "typescript", name: "TypeScript" },
    roleHints: role === "unknown" ? [] : [{ role, reason }]
  };
}

function artifactsFor(repositoryFacts: RepositoryFacts[]): SourceArtifact[] {
  return repositoryFacts.map((entry) => artifact(entry.path));
}

describe("shared reasoning", () => {
  it("classifies file and declaration roles from paths and usage", () => {
    const roleAnalyzer = new RoleAnalyzer();
    const result = roleAnalyzer.analyze(
      knowledge(
        [
          facts({
            path: "src/components/Button.tsx",
            declarations: [
              { kind: "declaration", name: "Button", visibility: "exported" }
            ]
          }),
          facts({ path: "src/pages/BillingPage.tsx" }),
          facts({ path: "src/features/Badge.tsx" })
        ],
        [],
        [],
        [
          artifact(
            "src/components/Button.tsx",
            "shared",
            "shared source directory"
          ),
          artifact("src/pages/BillingPage.tsx", "local", "local source directory"),
          artifact("src/features/Badge.tsx")
        ]
      )
    );

    expect(result).toContainEqual({
      scope: "file",
      path: "src/components/Button.tsx",
      role: "shared",
      reasons: ["shared source directory"]
    });
    expect(result).toContainEqual({
      scope: "declaration",
      path: "src/components/Button.tsx",
      name: "Button",
      role: "shared",
      reasons: ["shared source directory"]
    });
    expect(result).toContainEqual({
      scope: "file",
      path: "src/pages/BillingPage.tsx",
      role: "local",
      reasons: ["local source directory"]
    });
    expect(result).toContainEqual({
      scope: "file",
      path: "src/features/Badge.tsx",
      role: "unknown",
      reasons: []
    });
  });

  it("projects shared and reused declarations into abstraction candidates", () => {
    const candidateDiscovery = new CandidateDiscovery();
    const repositoryFacts = [
      facts({
        path: "src/components/Button.tsx",
        declarations: [
          { kind: "declaration", name: "Button", visibility: "exported" }
        ]
      }),
      facts({
        path: "src/features/Card.tsx",
        declarations: [
          { kind: "declaration", name: "Card", visibility: "exported" }
        ]
      }),
      facts({
        path: "src/pages/Local.tsx",
        declarations: [
          { kind: "declaration", name: "Local", visibility: "local" }
        ]
      })
    ];
    const repoKnowledge = knowledge(
      repositoryFacts,
      [
        {
          path: "src/features/Card.tsx",
          fileReferenceCount: 1,
          declarationReferences: [{ name: "Card", referenceCount: 1 }]
        }
      ],
      [],
      [
        artifact("src/components/Button.tsx", "shared", "shared source directory"),
        artifact("src/features/Card.tsx"),
        artifact("src/pages/Local.tsx", "local", "local source directory")
      ]
    );
    const roles: RoleFact[] = [
      ...new RoleAnalyzer().analyze(repoKnowledge),
      {
        scope: "declaration",
        path: "src/features/Card.tsx",
        name: "Card",
        role: "unknown",
        reasons: []
      }
    ];

    expect(candidateDiscovery.discover(repoKnowledge, roles)).toEqual([
      {
        path: "src/components/Button.tsx",
        name: "Button",
        evidence: ["shared role"]
      },
      {
        path: "src/features/Card.tsx",
        name: "Card",
        evidence: ["referenced declaration"]
      }
    ]);
  });

  it("scores, ranks, and calculates confidence for candidate matches", () => {
    const candidate: AbstractionCandidate = {
      path: "src/components/Button.tsx",
      name: "Button",
      evidence: ["shared role"]
    };
    const pattern: ObservedPattern = {
      id: "pattern-1",
      sourcePaths: ["src/pages/A.tsx", "src/pages/B.tsx"],
      features: [
        { category: "structure", key: "intrinsic", value: "button" },
        { category: "structure", key: "component", value: "Icon" },
        { category: "style", key: "className", value: "primary" }
      ],
      names: ["Button"]
    };
    const repoKnowledge = knowledge([
      facts({
        path: "src/components/Button.tsx",
        features: [
          { category: "structure", key: "intrinsic", value: "button" },
          { category: "structure", key: "component", value: "Icon" },
          { category: "style", key: "className", value: "primary" }
        ]
      })
    ]);

    const similarities = new SimilarityScorer().score(
      [pattern],
      [candidate],
      repoKnowledge
    );
    const rankings = new CandidateRanker().rank(
      similarities,
      [
        {
          scope: "file",
          path: "src/components/Button.tsx",
          role: "shared",
          reasons: ["shared source directory"]
        }
      ],
      [
        {
          path: "src/components/Button.tsx",
          fileReferenceCount: 2,
          declarationReferences: []
        }
      ]
    );

    expect(similarities).toEqual<SimilarityResult[]>([
      {
        patternId: "pattern-1",
        candidate,
        score: 1,
        evidence: {
          structureOverlap: 1,
          styleOverlap: 1,
          nameOverlap: 1
        }
      }
    ]);
    expect(rankings[0]).toMatchObject({
      patternId: "pattern-1",
      candidate,
      rank: 1,
      score: 1
    });
    expect(new ConfidenceCalculator().calculate(rankings, [pattern])).toEqual([
      {
        patternId: "pattern-1",
        candidatePath: "src/components/Button.tsx",
        candidateName: "Button",
        score: 1,
        reasons: ["similarity score", "usage evidence", "shared role"]
      }
    ]);
  });

  it("penalizes ambiguous rankings and weak patterns", () => {
    const pattern: ObservedPattern = {
      id: "pattern-1",
      sourcePaths: ["src/pages/A.tsx"],
      features: [],
      names: []
    };

    expect(
      new ConfidenceCalculator().calculate(
        [
          {
            patternId: "pattern-1",
            candidate: {
              path: "src/components/Button.tsx",
              name: "Button",
              evidence: []
            },
            rank: 1,
            score: 0.8,
            reasons: ["similarity score"]
          },
          {
            patternId: "pattern-1",
            candidate: {
              path: "src/components/Link.tsx",
              name: "Link",
              evidence: []
            },
            rank: 2,
            score: 0.7,
            reasons: ["similarity score"]
          }
        ],
        [pattern]
      )
    ).toEqual([
      {
        patternId: "pattern-1",
        candidatePath: "src/components/Button.tsx",
        candidateName: "Button",
        score: 0.4,
        reasons: [
          "similarity score",
          "ambiguous candidates",
          "weak pattern evidence"
        ]
      }
    ]);
  });
});
