import { describe, expect, it } from "vitest";

import { RepositoryKnowledgeAssembler } from "../../src/knowledge/repositoryKnowledgeAssembler";
import { RepositoryFactsIndexBuilder } from "../../src/analysis/repositoryFactsIndexBuilder";
import { defaultConfig } from "../../src/config/defaults";
import type { RelationshipFact } from "../../src/model/relationship";
import type { RepositoryContext } from "../../src/model/repository";
import type { RepositoryFacts } from "../../src/model/repositoryFacts";
import type { SourceArtifact } from "../../src/model/sourceArtifact";
import type { UsageFact } from "../../src/model/usage";

const assembler = new RepositoryKnowledgeAssembler();
const indexBuilder = new RepositoryFactsIndexBuilder();

const context: RepositoryContext = {
  rootPath: "/repo",
  config: defaultConfig
};

const sourceArtifacts: SourceArtifact[] = [
  {
    path: "src/components/Button.tsx",
    extractorId: "test",
    language: { id: "typescript", name: "TypeScript" },
    roleHints: [{ role: "shared", reason: "shared source directory" }]
  }
];

const facts: RepositoryFacts = {
  path: "src/components/Button.tsx",
  imports: [
    {
      sourceModule: "react",
      kind: "namespace",
      localName: "React"
    }
  ],
  exports: [
    {
      kind: "named",
      exportedName: "Button",
      localName: "Button"
    }
  ],
  declarations: [
    {
      kind: "declaration",
      name: "Button",
      visibility: "exported"
    }
  ],
  features: []
};

const relationships: RelationshipFact[] = [
  {
    importerPath: "src/pages/BillingPage.tsx",
    sourceModule: "../components/Button",
    importKind: "named",
    localName: "Button",
    importedName: "Button",
    resolution: "resolved",
    targetPath: "src/components/Button.tsx",
    targetExportName: "Button",
    targetDeclarationName: "Button"
  }
];

const usage: UsageFact[] = [
  {
    path: "src/components/Button.tsx",
    fileReferenceCount: 1,
    declarationReferences: [
      {
        name: "Button",
        referenceCount: 1
      }
    ]
  }
];

describe("RepositoryKnowledgeAssembler", () => {
  it("packages repository knowledge behind query methods", () => {
    const knowledge = assembler.assemble({
      context,
      sourceArtifacts,
      factsIndex: indexBuilder.build([facts]),
      relationships,
      usage
    });

    expect(knowledge.context).toBe(context);
    expect(knowledge.sourceArtifacts()).toBe(sourceArtifacts);
    expect(knowledge.sourceFiles()).toBe(sourceArtifacts);
    expect(knowledge.files()).toBe(sourceArtifacts);
    expect(knowledge.artifactForPath("src/components/Button.tsx")).toBe(
      sourceArtifacts[0]
    );
    expect(knowledge.factsForPath("src/components/Button.tsx")).toBe(facts);
    expect(knowledge.allFacts()).toEqual([facts]);
    expect(knowledge.declarationsByName("Button")).toHaveLength(1);
    expect(knowledge.exportsByName("Button")).toHaveLength(1);
    expect(knowledge.importsBySource("react")).toHaveLength(1);
    expect(knowledge.relationships()).toBe(relationships);
    expect(knowledge.relationshipsForPath("src/components/Button.tsx")).toEqual(
      relationships
    );
    expect(knowledge.usage()).toBe(usage);
    expect(knowledge.usageForPath("src/components/Button.tsx")).toBe(usage[0]);
  });

  it("returns empty query results when knowledge is empty", () => {
    const knowledge = assembler.assemble({
      context,
      sourceArtifacts: [],
      factsIndex: indexBuilder.build([]),
      relationships: [],
      usage: []
    });

    expect(knowledge.sourceFiles()).toEqual([]);
    expect(knowledge.files()).toEqual([]);
    expect(knowledge.factsForPath("missing.tsx")).toBeUndefined();
    expect(knowledge.allFacts()).toEqual([]);
    expect(knowledge.declarationsByName("Button")).toEqual([]);
    expect(knowledge.exportsByName("Button")).toEqual([]);
    expect(knowledge.importsBySource("react")).toEqual([]);
    expect(knowledge.relationships()).toEqual([]);
    expect(knowledge.relationshipsForPath("missing.tsx")).toEqual([]);
    expect(knowledge.usage()).toEqual([]);
    expect(knowledge.usageForPath("missing.tsx")).toBeUndefined();
  });
});
