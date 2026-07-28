import { CandidateDiscovery } from "../analysis/candidateDiscovery";
import { RoleAnalyzer } from "../analysis/roleAnalyzer";
import { findDesignTokens } from "../analysis/designTokenSource";
import type {
  InventoryComponent,
  InventoryResult,
  InventoryToken
} from "../model/inventoryResult";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";

// Lists what a repository already has to build with.
//
// The auditing modes are corrective: they find the third copy of a button
// after it has been written. This one is preventive. Handed to a coding agent
// before it writes UI, it removes the excuse for re-implementation — the
// agent cannot reuse a component it does not know exists, and asking it to
// read the whole component directory costs more context than it saves.
//
// Only shared abstractions are listed. Local screens are noise here.
//
// A file's role belongs to the file, so every declaration inside a shared file
// inherits "shared" — including the private helpers a reader would never call
// from elsewhere. Listing all of them turned a context-window budget into a
// dump: on a mid-sized repository this ran to thousands of entries and a
// quarter-megabyte of text, injected before every single write. So the list is
// ranked by how much the repository itself relies on each declaration and cut
// to the top slice. An agent about to build a button needs the components that
// are demonstrably load-bearing, not an index of the codebase.
const COMPONENT_LIMIT = 40;
const TOKEN_LIMIT = 80;

export class InventoryRunner {
  constructor(
    private readonly roleAnalyzer = new RoleAnalyzer(),
    private readonly candidateDiscovery = new CandidateDiscovery()
  ) {}

  run(knowledge: RepositoryKnowledge): InventoryResult {
    const roles = this.roleAnalyzer.analyze(knowledge);
    const exported = exportedNames(knowledge);
    const components: InventoryComponent[] = this.candidateDiscovery
      .discover(knowledge, roles)
      .filter(
        (candidate) =>
          exported.get(candidate.path)?.has(candidate.name) === true &&
          roles.some(
            (role) =>
              role.path === candidate.path &&
              role.role === "shared" &&
              (role.name === undefined || role.name === candidate.name)
          )
      )
      .map((candidate) => ({
        path: candidate.path,
        name: candidate.name,
        referenceCount:
          knowledge
            .usageForPath(candidate.path)
            ?.declarationReferences.find(
              (entry) => entry.name === candidate.name
            )?.referenceCount ?? 0
      }))
      .sort(
        (a, b) =>
          b.referenceCount - a.referenceCount ||
          a.path.localeCompare(b.path) ||
          a.name.localeCompare(b.name)
      );

    const tokens: InventoryToken[] = dedupeTokens(
      findDesignTokens(knowledge.context)
    );

    return {
      mode: "inventory",
      components: components.slice(0, COMPONENT_LIMIT),
      tokens: tokens.slice(0, TOKEN_LIMIT),
      // The counts stay honest about the whole repository even when the lists
      // above are cut, so a reader can tell "this is all of it" from "this is
      // the top of it".
      metadata: {
        componentCount: components.length,
        tokenCount: tokens.length
      }
    };
  }
}

// Declarations a file actually offers to the rest of the repository.
function exportedNames(
  knowledge: RepositoryKnowledge
): Map<string, Set<string>> {
  const byPath = new Map<string, Set<string>>();

  for (const facts of knowledge.allFacts()) {
    const names = new Set<string>();

    for (const declaration of facts.declarations) {
      if (declaration.name !== undefined && declaration.visibility === "exported") {
        names.add(declaration.name);
      }
    }

    byPath.set(facts.path, names);
  }

  return byPath;
}

function dedupeTokens(tokens: InventoryToken[]): InventoryToken[] {
  const byName = new Map<string, InventoryToken>();

  for (const token of tokens) {
    if (!byName.has(token.name)) {
      byName.set(token.name, token);
    }
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}
