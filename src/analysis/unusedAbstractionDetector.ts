import type { AbstractionCandidate } from "../model/abstractionCandidate";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type { UnusedAbstractionFinding } from "../model/repositoryHealthFinding";
import type { RoleFact } from "../model/role";

// Fraction of imports that must resolve before "nothing references this" is
// evidence rather than an artefact. Path aliases, framework magic imports and
// unresolvable module systems all produce zero-reference files that are used
// constantly; on a stock Next.js application only 7% of imports resolved, and
// every exported component looked dead.
const MINIMUM_RESOLUTION_RATE = 0.5;

// Finds shared candidates with no observed usage.
// This stage emits health findings only and does not recommend deletion.
export class UnusedAbstractionDetector {
  detect(
    knowledge: RepositoryKnowledge,
    roles: RoleFact[],
    candidates: AbstractionCandidate[]
  ): UnusedAbstractionFinding[] {
    if (!hasReliableGraph(knowledge)) {
      return [];
    }

    return candidates
      .filter((candidate) => isShared(candidate, roles))
      .filter(
        (candidate) =>
          (knowledge.usageForPath(candidate.path)?.fileReferenceCount ?? 0) === 0
      )
      .map((candidate) => ({
        kind: "unused-abstraction",
        candidatePath: candidate.path,
        candidateName: candidate.name,
        evidence: ["shared candidate has zero references"]
      }));
  }
}

// Absence of evidence is only evidence of absence when the graph is good
// enough to have shown the references had they existed.
export function hasReliableGraph(knowledge: RepositoryKnowledge): boolean {
  const relationships = knowledge.relationships();

  if (relationships.length === 0) {
    return false;
  }

  const resolved = relationships.filter(
    (relationship) => relationship.resolution === "resolved"
  ).length;

  return resolved / relationships.length >= MINIMUM_RESOLUTION_RATE;
}

function isShared(candidate: AbstractionCandidate, roles: RoleFact[]): boolean {
  return roles.some(
    (role) =>
      role.path === candidate.path &&
      role.role === "shared" &&
      (role.name === undefined || role.name === candidate.name)
  );
}
