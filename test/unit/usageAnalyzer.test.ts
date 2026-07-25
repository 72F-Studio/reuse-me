import { describe, expect, it } from "vitest";

import { RepositoryFactsIndexBuilder } from "../../src/analysis/repositoryFactsIndexBuilder";
import { UsageAnalyzer } from "../../src/analysis/usageAnalyzer";
import type { RelationshipFact } from "../../src/model/relationship";
import type { RepositoryFacts } from "../../src/model/repositoryFacts";

const indexBuilder = new RepositoryFactsIndexBuilder();
const analyzer = new UsageAnalyzer();

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

function relationship(overrides: Partial<RelationshipFact>): RelationshipFact {
  return {
    importerPath: "src/pages/BillingPage.tsx",
    sourceModule: "../components/Button",
    importKind: "named",
    localName: "Button",
    importedName: "Button",
    resolution: "resolved",
    targetPath: "src/components/Button.tsx",
    targetExportName: "Button",
    ...overrides
  };
}

describe("UsageAnalyzer", () => {
  it("counts single file usage", () => {
    const index = indexBuilder.build([
      facts({ path: "src/components/Button.tsx" }),
      facts({ path: "src/pages/BillingPage.tsx" })
    ]);

    expect(analyzer.analyze(index, [relationship({})])).toEqual([
      {
        path: "src/components/Button.tsx",
        fileReferenceCount: 1,
        declarationReferences: []
      },
      {
        path: "src/pages/BillingPage.tsx",
        fileReferenceCount: 0,
        declarationReferences: []
      }
    ]);
  });

  it("counts multiple file usages", () => {
    const index = indexBuilder.build([
      facts({ path: "src/components/Button.tsx" }),
      facts({ path: "src/pages/BillingPage.tsx" }),
      facts({ path: "src/pages/CheckoutPage.tsx" })
    ]);

    expect(
      analyzer.analyze(index, [
        relationship({ importerPath: "src/pages/BillingPage.tsx" }),
        relationship({ importerPath: "src/pages/CheckoutPage.tsx" })
      ])[0]
    ).toEqual({
      path: "src/components/Button.tsx",
      fileReferenceCount: 2,
      declarationReferences: []
    });
  });

  it("preserves zero usage files", () => {
    const index = indexBuilder.build([
      facts({ path: "src/components/Button.tsx" })
    ]);

    expect(analyzer.analyze(index, [])).toEqual([
      {
        path: "src/components/Button.tsx",
        fileReferenceCount: 0,
        declarationReferences: []
      }
    ]);
  });

  it("counts declaration usage when relationships identify declarations", () => {
    const index = indexBuilder.build([
      facts({
        path: "src/components/Button.tsx",
        declarations: [
          {
            kind: "declaration",
            name: "Button",
            visibility: "exported"
          }
        ]
      }),
      facts({ path: "src/pages/BillingPage.tsx" })
    ]);

    expect(
      analyzer.analyze(index, [
        relationship({ targetDeclarationName: "Button" })
      ])
    ).toEqual([
      {
        path: "src/components/Button.tsx",
        fileReferenceCount: 1,
        declarationReferences: [
          {
            name: "Button",
            referenceCount: 1
          }
        ]
      },
      {
        path: "src/pages/BillingPage.tsx",
        fileReferenceCount: 0,
        declarationReferences: []
      }
    ]);
  });

  it("handles cyclic relationships safely", () => {
    const index = indexBuilder.build([
      facts({ path: "src/components/A.tsx" }),
      facts({ path: "src/components/B.tsx" })
    ]);

    expect(
      analyzer.analyze(index, [
        relationship({
          importerPath: "src/components/A.tsx",
          targetPath: "src/components/B.tsx"
        }),
        relationship({
          importerPath: "src/components/B.tsx",
          targetPath: "src/components/A.tsx"
        })
      ])
    ).toEqual([
      {
        path: "src/components/A.tsx",
        fileReferenceCount: 1,
        declarationReferences: []
      },
      {
        path: "src/components/B.tsx",
        fileReferenceCount: 1,
        declarationReferences: []
      }
    ]);
  });
});
