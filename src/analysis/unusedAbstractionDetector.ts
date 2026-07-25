import type { AbstractionCandidate } from "../model/abstractionCandidate";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type { UnusedAbstractionFinding } from "../model/repositoryHealthFinding";
import type { RoleFact } from "../model/role";

// Finds shared candidates with no observed usage.
// This stage emits health findings only and does not recommend deletion.
export class UnusedAbstractionDetector {
  detect(
    knowledge: RepositoryKnowledge,
    roles: RoleFact[],
    candidates: AbstractionCandidate[]
  ): UnusedAbstractionFinding[] {
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

function isShared(candidate: AbstractionCandidate, roles: RoleFact[]): boolean {
  return roles.some(
    (role) =>
      role.path === candidate.path &&
      role.role === "shared" &&
      (role.name === undefined || role.name === candidate.name)
  );
}
