import { dirname, join, normalize } from "node:path/posix";

import type { RelationshipFact } from "../../model/relationship";
import type { ExportFact, RepositoryFacts } from "../../model/repositoryFacts";
import type { RepositoryFactsIndex } from "../../model/repositoryFactsIndex";

const SOURCE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"] as const;

// Resolves repository-local import/export relationships from indexed facts.
// This stage derives dependency evidence only.
export class RelationshipAnalyzer {
  analyze(index: RepositoryFactsIndex): RelationshipFact[] {
    const relationships: RelationshipFact[] = [];

    for (const facts of index.allFacts()) {
      for (const importFact of facts.imports) {
        if (!isRepositoryLocalImport(importFact.sourceModule)) {
          continue;
        }

        const targetFacts = resolveTargetFacts(index, facts.path, importFact.sourceModule);

        if (targetFacts === undefined) {
          relationships.push({
            importerPath: facts.path,
            sourceModule: importFact.sourceModule,
            importKind: importFact.kind,
            localName: importFact.localName,
            importedName: importFact.importedName,
            resolution: "unresolved"
          });
          continue;
        }

        const exportMatches = findExportMatches(targetFacts, importFact);

        if (exportMatches.length !== 1) {
          relationships.push({
            importerPath: facts.path,
            sourceModule: importFact.sourceModule,
            importKind: importFact.kind,
            localName: importFact.localName,
            importedName: importFact.importedName,
            resolution: exportMatches.length === 0 ? "unresolved" : "ambiguous",
            targetPath: targetFacts.path
          });
          continue;
        }

        const exportFact = exportMatches[0];

        relationships.push({
          importerPath: facts.path,
          sourceModule: importFact.sourceModule,
          importKind: importFact.kind,
          localName: importFact.localName,
          importedName: importFact.importedName,
          resolution: "resolved",
          targetPath: targetFacts.path,
          targetExportName: exportFact.exportedName,
          targetDeclarationName: findTargetDeclarationName(targetFacts, exportFact)
        });
      }
    }

    return relationships;
  }
}

function resolveTargetFacts(
  index: RepositoryFactsIndex,
  importerPath: string,
  sourceModule: string
): RepositoryFacts | undefined {
  const candidates = resolveBasePaths(importerPath, sourceModule).flatMap(
    candidatePathsForBase
  );

  for (const candidate of candidates) {
    const facts = index.byPath(candidate);

    if (facts !== undefined) {
      return facts;
    }
  }

  return undefined;
}

function isRepositoryLocalImport(sourceModule: string): boolean {
  return sourceModule.startsWith(".") || sourceModule.startsWith("@/");
}

function resolveBasePaths(importerPath: string, sourceModule: string): string[] {
  if (sourceModule.startsWith("@/")) {
    return [normalize(join("src", sourceModule.slice(2)))];
  }

  return [normalize(join(dirname(importerPath), sourceModule))];
}

function candidatePathsForBase(basePath: string): string[] {
  return [
    basePath,
    ...SOURCE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => `${basePath}/index${extension}`)
  ];
}

function findExportMatches(
  facts: RepositoryFacts,
  importFact: {
    kind: "default" | "named" | "namespace";
    importedName?: string;
  }
): ExportFact[] {
  if (importFact.kind === "namespace") {
    return facts.exports;
  }

  if (importFact.kind === "default") {
    return facts.exports.filter((exportFact) => exportFact.kind === "default");
  }

  return facts.exports.filter(
    (exportFact) => exportFact.exportedName === importFact.importedName
  );
}

function findTargetDeclarationName(
  facts: RepositoryFacts,
  exportFact: ExportFact
): string | undefined {
  const name = exportFact.localName;

  if (name === undefined) {
    return undefined;
  }

  const declarations = facts.declarations.filter(
    (declaration) => declaration.name === name
  );

  return declarations.length === 1 ? name : undefined;
}
