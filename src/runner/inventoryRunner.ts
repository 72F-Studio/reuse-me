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
export class InventoryRunner {
  constructor(
    private readonly roleAnalyzer = new RoleAnalyzer(),
    private readonly candidateDiscovery = new CandidateDiscovery()
  ) {}

  run(knowledge: RepositoryKnowledge): InventoryResult {
    const roles = this.roleAnalyzer.analyze(knowledge);
    const components: InventoryComponent[] = this.candidateDiscovery
      .discover(knowledge, roles)
      .filter((candidate) =>
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
      }));

    const tokens: InventoryToken[] = dedupeTokens(
      findDesignTokens(knowledge.context)
    );

    return {
      mode: "inventory",
      components,
      tokens,
      metadata: {
        componentCount: components.length,
        tokenCount: tokens.length
      }
    };
  }
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
