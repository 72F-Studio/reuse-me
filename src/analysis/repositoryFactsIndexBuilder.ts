import type { RepositoryFacts } from "../model/repositoryFacts";
import type {
  IndexedDeclaration,
  IndexedExport,
  IndexedImport,
  RepositoryFactsIndex
} from "../model/repositoryFactsIndex";

// Builds lookup indexes from repository facts.
// This stage derives query structure only and adds no semantic interpretation.
export class RepositoryFactsIndexBuilder {
  build(facts: RepositoryFacts[]): RepositoryFactsIndex {
    const factsByPath = new Map<string, RepositoryFacts>();
    const declarationsByName = new Map<string, IndexedDeclaration[]>();
    const exportsByName = new Map<string, IndexedExport[]>();
    const importsBySource = new Map<string, IndexedImport[]>();

    for (const fileFacts of facts) {
      factsByPath.set(fileFacts.path, fileFacts);

      for (const declaration of fileFacts.declarations) {
        if (declaration.name !== undefined) {
          append(declarationsByName, declaration.name, {
            path: fileFacts.path,
            declaration
          });
        }
      }

      for (const exportFact of fileFacts.exports) {
        append(exportsByName, exportFact.exportedName, {
          path: fileFacts.path,
          exportFact
        });
      }

      for (const importFact of fileFacts.imports) {
        append(importsBySource, importFact.sourceModule, {
          path: fileFacts.path,
          importFact
        });
      }
    }

    return {
      allFacts: () => facts,
      byPath: (path) => factsByPath.get(path),
      declarationsByName: (name) => declarationsByName.get(name) ?? [],
      exportsByName: (name) => exportsByName.get(name) ?? [],
      importsBySource: (sourceModule) => importsBySource.get(sourceModule) ?? []
    };
  }
}

function append<Value>(
  map: Map<string, Value[]>,
  key: string,
  value: Value
): void {
  map.set(key, [...(map.get(key) ?? []), value]);
}
