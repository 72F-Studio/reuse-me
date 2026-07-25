import { describe, expect, it } from "vitest";

import { RepositoryFactsIndexBuilder } from "../../src/analysis/repositoryFactsIndexBuilder";
import type { RepositoryFacts } from "../../src/model/repositoryFacts";

const builder = new RepositoryFactsIndexBuilder();

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

describe("RepositoryFactsIndexBuilder", () => {
  it("retrieves facts by path", () => {
    const fileFacts = facts({ path: "src/components/Button.tsx" });
    const index = builder.build([fileFacts]);

    expect(index.allFacts()).toEqual([fileFacts]);
    expect(index.byPath("src/components/Button.tsx")).toBe(fileFacts);
    expect(index.byPath("src/components/Missing.tsx")).toBeUndefined();
  });

  it("retrieves declarations by name", () => {
    const index = builder.build([
      facts({
        declarations: [
          {
            kind: "declaration",
            name: "Button",
            visibility: "exported"
          }
        ]
      })
    ]);

    expect(index.declarationsByName("Button")).toEqual([
      {
        path: "src/components/Button.tsx",
        declaration: {
          kind: "declaration",
          name: "Button",
          visibility: "exported"
        }
      }
    ]);
  });

  it("retrieves exports by name", () => {
    const index = builder.build([
      facts({
        exports: [
          {
            kind: "named",
            exportedName: "Button",
            localName: "Button"
          }
        ]
      })
    ]);

    expect(index.exportsByName("Button")).toEqual([
      {
        path: "src/components/Button.tsx",
        exportFact: {
          kind: "named",
          exportedName: "Button",
          localName: "Button"
        }
      }
    ]);
  });

  it("retrieves imports by source module", () => {
    const index = builder.build([
      facts({
        path: "src/pages/BillingPage.tsx",
        imports: [
          {
            sourceModule: "../components/Button",
            kind: "default",
            localName: "Button"
          }
        ]
      })
    ]);

    expect(index.importsBySource("../components/Button")).toEqual([
      {
        path: "src/pages/BillingPage.tsx",
        importFact: {
          sourceModule: "../components/Button",
          kind: "default",
          localName: "Button"
        }
      }
    ]);
  });

  it("preserves ambiguous names", () => {
    const index = builder.build([
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
      facts({
        path: "src/legacy/Button.tsx",
        declarations: [
          {
            kind: "declaration",
            name: "Button",
            visibility: "exported"
          }
        ]
      })
    ]);

    expect(index.declarationsByName("Button")).toHaveLength(2);
  });

  it("handles empty fact collections", () => {
    const index = builder.build([]);

    expect(index.byPath("src/components/Button.tsx")).toBeUndefined();
    expect(index.declarationsByName("Button")).toEqual([]);
    expect(index.exportsByName("Button")).toEqual([]);
    expect(index.importsBySource("../components/Button")).toEqual([]);
  });
});
