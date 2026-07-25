import { describe, expect, it } from "vitest";

import { CandidateRanker } from "../../src/analysis/candidateRanker";
import { ChangedFactsProjector } from "../../src/analysis/changedFactsProjector";
import { ChangedPatternDetector } from "../../src/analysis/changedPatternDetector";
import { ChangeAnalysisResultAssembler } from "../../src/analysis/changeAnalysisResultAssembler";
import { ConfidenceCalculator } from "../../src/analysis/confidenceCalculator";
import { RepositoryFactsIndexBuilder } from "../../src/analysis/repositoryFactsIndexBuilder";
import { SimilarityScorer } from "../../src/analysis/similarityScorer";
import { SourceOfTruthWarningGenerator } from "../../src/analysis/sourceOfTruthWarningGenerator";
import { defaultConfig } from "../../src/config/defaults";
import { RepositoryKnowledgeAssembler } from "../../src/knowledge/repositoryKnowledgeAssembler";
import type { AbstractionCandidate } from "../../src/model/abstractionCandidate";
import type { ChangedFile } from "../../src/model/diff";
import type { RepositoryContext } from "../../src/model/repository";
import type { RepositoryFacts } from "../../src/model/repositoryFacts";
import type { RoleFact } from "../../src/model/role";
import type { SourceArtifact } from "../../src/model/sourceArtifact";
import type { UsageFact } from "../../src/model/usage";

const indexBuilder = new RepositoryFactsIndexBuilder();
const assembler = new RepositoryKnowledgeAssembler();

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
    roleHints: [{ role: "local", reason: "local source directory" }]
  };
}

describe("change analysis branch", () => {
  it("projects changed UI files onto repository facts", () => {
    const knowledge = assembler.assemble({
      context,
      sourceArtifacts: [artifact("src/pages/A.tsx")],
      factsIndex: indexBuilder.build([facts("src/pages/A.tsx")]),
      relationships: [],
      usage: []
    });
    const changedFiles: ChangedFile[] = [
      { path: "src/pages/A.tsx", status: "modified" },
      { path: "README.md", status: "modified" }
    ];
    const changedArtifacts = [artifact("src/pages/A.tsx")];

    expect(
      new ChangedFactsProjector().project(
        knowledge,
        changedFiles,
        changedArtifacts
      )
    ).toEqual([
      {
        path: "src/pages/A.tsx",
        status: "modified",
        artifact: changedArtifacts[0],
        facts: facts("src/pages/A.tsx")
      }
    ]);
  });

  it("detects repeated changed local patterns and ignores shared files", () => {
    const roles: RoleFact[] = [
      {
        scope: "file",
        path: "src/pages/A.tsx",
        role: "local",
        reasons: []
      },
      {
        scope: "file",
        path: "src/pages/B.tsx",
        role: "local",
        reasons: []
      },
      {
        scope: "file",
        path: "src/components/Button.tsx",
        role: "shared",
        reasons: []
      }
    ];

    expect(
      new ChangedPatternDetector().detect(
        [
          { path: "src/pages/A.tsx", status: "modified", facts: facts("src/pages/A.tsx") },
          { path: "src/pages/B.tsx", status: "modified", facts: facts("src/pages/B.tsx") },
          {
            path: "src/components/Button.tsx",
            status: "modified",
            facts: facts("src/components/Button.tsx")
          }
        ],
        roles
      )
    ).toEqual([
      {
        id: "changed-pattern-1",
        sourcePaths: ["src/pages/A.tsx", "src/pages/B.tsx"],
        features: [
          { category: "structure", key: "intrinsic", value: "button" },
          { category: "style", key: "className", value: "primary" }
        ],
        names: []
      }
    ]);
  });

  it("generates source-of-truth warnings above threshold and packages results", () => {
    const candidate: AbstractionCandidate = {
      path: "src/components/Button.tsx",
      name: "Button",
      evidence: ["shared role"]
    };
    const usage: UsageFact[] = [
      {
        path: "src/components/Button.tsx",
        fileReferenceCount: 2,
        declarationReferences: []
      }
    ];
    const roles: RoleFact[] = [
      {
        scope: "file",
        path: "src/components/Button.tsx",
        role: "shared",
        reasons: []
      }
    ];
    const knowledge = assembler.assemble({
      context,
      sourceArtifacts: [artifact("src/components/Button.tsx")],
      factsIndex: indexBuilder.build([facts("src/components/Button.tsx")]),
      relationships: [],
      usage
    });
    const pattern = {
      id: "changed-pattern-1",
      sourcePaths: ["src/pages/A.tsx", "src/pages/B.tsx"],
      features: [
        { category: "structure" as const, key: "intrinsic", value: "button" },
        { category: "style" as const, key: "className", value: "primary" }
      ],
      names: ["Button"]
    };
    const similarities = new SimilarityScorer().score(
      [pattern],
      [candidate],
      knowledge
    );
    const rankings = new CandidateRanker().rank(similarities, roles, usage);
    const confidence = new ConfidenceCalculator().calculate(rankings, [pattern]);
    const changedFacts = [
      { path: "src/pages/A.tsx", status: "modified" as const },
      { path: "src/pages/B.tsx", status: "modified" as const }
    ];
    const warnings = new SourceOfTruthWarningGenerator().generate(
      context,
      [pattern],
      rankings,
      confidence,
      changedFacts
    );

    expect(warnings).toEqual([
      {
        changedFiles: ["src/pages/A.tsx", "src/pages/B.tsx"],
        candidatePath: "src/components/Button.tsx",
        candidateName: "Button",
        confidence: 1,
        evidence: ["similarity score", "usage evidence", "shared role"]
      }
    ]);
    expect(new ChangeAnalysisResultAssembler().assemble(changedFacts, warnings)).toEqual({
      mode: "change",
      warnings,
      metadata: {
        changedFileCount: 2,
        warningCount: 1
      }
    });
  });

  it("suppresses warnings below threshold", () => {
    expect(
      new SourceOfTruthWarningGenerator().generate(
        context,
        [{ id: "p", sourcePaths: ["a", "b"], features: [], names: [] }],
        [
          {
            patternId: "p",
            candidate: {
              path: "src/components/Button.tsx",
              name: "Button",
              evidence: []
            },
            rank: 1,
            score: 0.2,
            candidateFeatureCount: 5,
            reasons: []
          }
        ],
        [
          {
            patternId: "p",
            candidatePath: "src/components/Button.tsx",
            candidateName: "Button",
            score: 0.2,
            reasons: []
          }
        ],
        []
      )
    ).toEqual([]);
  });
});
