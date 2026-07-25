import type { AbstractionCandidate } from "../model/abstractionCandidate";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type { RoleFact } from "../model/role";

// Projects repository declarations into governing abstraction candidates.
// This stage does not compare candidates to patterns or rank them.
export class CandidateDiscovery {
  discover(
    knowledge: RepositoryKnowledge,
    roles: RoleFact[]
  ): AbstractionCandidate[] {
    const candidates: AbstractionCandidate[] = [];

    for (const facts of knowledge.allFacts()) {
      for (const declaration of facts.declarations) {
        if (declaration.name === undefined) {
          continue;
        }

        const role = findRole(roles, facts.path, declaration.name);
        const usage = knowledge
          .usageForPath(facts.path)
          ?.declarationReferences.find((entry) => entry.name === declaration.name);

        if (role?.role !== "shared" && (usage?.referenceCount ?? 0) === 0) {
          continue;
        }

        candidates.push({
          path: facts.path,
          name: declaration.name,
          evidence: [
            ...(role?.role === "shared" ? ["shared role"] : []),
            ...((usage?.referenceCount ?? 0) > 0 ? ["referenced declaration"] : [])
          ]
        });
      }
    }

    return candidates.sort((a, b) => `${a.path}:${a.name}`.localeCompare(`${b.path}:${b.name}`));
  }
}

function findRole(
  roles: RoleFact[],
  path: string,
  name: string
): RoleFact | undefined {
  return roles.find(
    (role) =>
      role.scope === "declaration" && role.path === path && role.name === name
  );
}
