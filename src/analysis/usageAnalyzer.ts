import type { RelationshipFact } from "../model/relationship";
import type { RepositoryFactsIndex } from "../model/repositoryFactsIndex";
import type { DeclarationUsageFact, UsageFact } from "../model/usage";

// Derives repository usage counts from resolved relationship facts.
// This stage counts references only and performs no role classification.
export class UsageAnalyzer {
  analyze(
    index: RepositoryFactsIndex,
    relationships: RelationshipFact[]
  ): UsageFact[] {
    const usageByPath = new Map<string, UsageFact>();

    for (const facts of index.allFacts()) {
      usageByPath.set(facts.path, {
        path: facts.path,
        fileReferenceCount: 0,
        declarationReferences: namedDeclarations(facts.declarations)
      });
    }

    for (const relationship of relationships) {
      if (
        relationship.resolution !== "resolved" ||
        relationship.targetPath === undefined ||
        relationship.targetPath === relationship.importerPath
      ) {
        continue;
      }

      const usage = usageByPath.get(relationship.targetPath);

      if (usage === undefined) {
        continue;
      }

      usage.fileReferenceCount += 1;

      if (relationship.targetDeclarationName !== undefined) {
        incrementDeclarationReference(
          usage.declarationReferences,
          relationship.targetDeclarationName
        );
      }
    }

    return [...usageByPath.values()].sort((a, b) => a.path.localeCompare(b.path));
  }
}

function namedDeclarations(
  declarations: { name?: string }[]
): DeclarationUsageFact[] {
  return declarations
    .filter((declaration): declaration is { name: string } => declaration.name !== undefined)
    .map((declaration) => ({
      name: declaration.name,
      referenceCount: 0
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function incrementDeclarationReference(
  declarations: DeclarationUsageFact[],
  name: string
): void {
  const declaration = declarations.find((entry) => entry.name === name);

  if (declaration !== undefined) {
    declaration.referenceCount += 1;
  }
}
