import { describe, expect, it } from "vitest";

import { RelationshipAnalyzer } from "../../src/extractors/typescript-react/relationshipAnalyzer";
import { RepositoryFactsIndexBuilder } from "../../src/analysis/repositoryFactsIndexBuilder";
import type { RepositoryFacts } from "../../src/model/repositoryFacts";

const analyzer = new RelationshipAnalyzer();
const indexBuilder = new RepositoryFactsIndexBuilder();

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

describe("RelationshipAnalyzer", () => {
  it("resolves relative imports to repository files", () => {
    const index = indexBuilder.build([
      facts({
        path: "src/pages/BillingPage.tsx",
        imports: [
          {
            sourceModule: "../components/Button",
            kind: "namespace",
            localName: "ButtonModule"
          }
        ]
      }),
      facts({
        path: "src/components/Button.tsx",
        exports: [
          {
            kind: "named",
            exportedName: "Button",
            localName: "Button"
          }
        ]
      })
    ]);

    expect(analyzer.analyze(index)).toEqual([
      {
        importerPath: "src/pages/BillingPage.tsx",
        sourceModule: "../components/Button",
        importKind: "namespace",
        localName: "ButtonModule",
        resolution: "resolved",
        targetPath: "src/components/Button.tsx",
        targetExportName: "Button"
      }
    ]);
  });

  it("resolves common @/ imports to src files", () => {
    const index = indexBuilder.build([
      facts({
        path: "src/pages/BillingPage.tsx",
        imports: [
          {
            sourceModule: "@/components/Button",
            kind: "named",
            localName: "Button",
            importedName: "Button"
          }
        ]
      }),
      facts({
        path: "src/components/Button.tsx",
        exports: [
          {
            kind: "named",
            exportedName: "Button",
            localName: "Button"
          }
        ]
      })
    ]);

    expect(analyzer.analyze(index)).toEqual([
      {
        importerPath: "src/pages/BillingPage.tsx",
        sourceModule: "@/components/Button",
        importKind: "named",
        localName: "Button",
        importedName: "Button",
        resolution: "resolved",
        targetPath: "src/components/Button.tsx",
        targetExportName: "Button"
      }
    ]);
  });

  it("links named imports to named exports and declarations", () => {
    const index = indexBuilder.build([
      facts({
        path: "src/pages/BillingPage.tsx",
        imports: [
          {
            sourceModule: "../components/Button",
            kind: "named",
            localName: "Button",
            importedName: "Button"
          }
        ]
      }),
      facts({
        path: "src/components/Button.tsx",
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
        ]
      })
    ]);

    expect(analyzer.analyze(index)).toEqual([
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
    ]);
  });

  it("links default imports to default exports and declarations", () => {
    const index = indexBuilder.build([
      facts({
        path: "src/pages/BillingPage.tsx",
        imports: [
          {
            sourceModule: "../components/Button",
            kind: "default",
            localName: "Button"
          }
        ]
      }),
      facts({
        path: "src/components/Button.tsx",
        exports: [
          {
            kind: "default",
            exportedName: "default",
            localName: "Button"
          }
        ],
        declarations: [
          {
            kind: "declaration",
            name: "Button",
            visibility: "exported"
          }
        ]
      })
    ]);

    expect(analyzer.analyze(index)).toEqual([
      {
        importerPath: "src/pages/BillingPage.tsx",
        sourceModule: "../components/Button",
        importKind: "default",
        localName: "Button",
        resolution: "resolved",
        targetPath: "src/components/Button.tsx",
        targetExportName: "default",
        targetDeclarationName: "Button"
      }
    ]);
  });

  it("handles unresolved imports safely", () => {
    const index = indexBuilder.build([
      facts({
        path: "src/pages/BillingPage.tsx",
        imports: [
          {
            sourceModule: "../components/Missing",
            kind: "named",
            localName: "Missing",
            importedName: "Missing"
          }
        ]
      })
    ]);

    expect(analyzer.analyze(index)).toEqual([
      {
        importerPath: "src/pages/BillingPage.tsx",
        sourceModule: "../components/Missing",
        importKind: "named",
        localName: "Missing",
        importedName: "Missing",
        resolution: "unresolved"
      }
    ]);
  });

  it("handles ambiguous exports conservatively", () => {
    const index = indexBuilder.build([
      facts({
        path: "src/pages/BillingPage.tsx",
        imports: [
          {
            sourceModule: "../components/Button",
            kind: "named",
            localName: "Button",
            importedName: "Button"
          }
        ]
      }),
      facts({
        path: "src/components/Button.tsx",
        exports: [
          {
            kind: "named",
            exportedName: "Button",
            localName: "PrimaryButton"
          },
          {
            kind: "named",
            exportedName: "Button",
            localName: "LegacyButton"
          }
        ]
      })
    ]);

    expect(analyzer.analyze(index)).toEqual([
      {
        importerPath: "src/pages/BillingPage.tsx",
        sourceModule: "../components/Button",
        importKind: "named",
        localName: "Button",
        importedName: "Button",
        resolution: "ambiguous",
        targetPath: "src/components/Button.tsx"
      }
    ]);
  });

  it("skips package imports", () => {
    const index = indexBuilder.build([
      facts({
        path: "src/pages/BillingPage.tsx",
        imports: [
          {
            sourceModule: "react",
            kind: "namespace",
            localName: "React"
          }
        ]
      })
    ]);

    expect(analyzer.analyze(index)).toEqual([]);
  });
});
