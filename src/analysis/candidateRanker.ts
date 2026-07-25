import type { CandidateRanking } from "../model/ranking";
import type { RoleFact } from "../model/role";
import type { SimilarityResult } from "../model/similarity";
import type { UsageFact } from "../model/usage";

// Orders candidate matches for each observed pattern.
// This stage ranks only and does not apply confidence thresholds.
export class CandidateRanker {
  rank(
    similarities: SimilarityResult[],
    roles: RoleFact[],
    usage: UsageFact[]
  ): CandidateRanking[] {
    const grouped = groupByPattern(similarities);
    const rankings: CandidateRanking[] = [];

    for (const [patternId, results] of grouped.entries()) {
      const sorted = [...results].sort((a, b) => compareResults(a, b, roles, usage));

      sorted.forEach((result, index) => {
        rankings.push({
          patternId,
          candidate: result.candidate,
          rank: index + 1,
          score: result.score,
          candidateFeatureCount: result.evidence.candidateFeatureCount,
          reasons: reasonsFor(result, roles, usage)
        });
      });
    }

    return rankings;
  }
}

function groupByPattern(
  similarities: SimilarityResult[]
): Map<string, SimilarityResult[]> {
  const grouped = new Map<string, SimilarityResult[]>();

  for (const similarity of similarities) {
    grouped.set(similarity.patternId, [
      ...(grouped.get(similarity.patternId) ?? []),
      similarity
    ]);
  }

  return grouped;
}

function compareResults(
  left: SimilarityResult,
  right: SimilarityResult,
  roles: RoleFact[],
  usage: UsageFact[]
): number {
  return (
    right.score - left.score ||
    usageCount(right, usage) - usageCount(left, usage) ||
    roleWeight(right, roles) - roleWeight(left, roles) ||
    `${left.candidate.path}:${left.candidate.name}`.localeCompare(
      `${right.candidate.path}:${right.candidate.name}`
    )
  );
}

function reasonsFor(
  result: SimilarityResult,
  roles: RoleFact[],
  usage: UsageFact[]
): string[] {
  return [
    "similarity score",
    ...(usageCount(result, usage) > 0 ? ["usage evidence"] : []),
    ...(roleWeight(result, roles) > 0 ? ["shared role"] : [])
  ];
}

function usageCount(result: SimilarityResult, usage: UsageFact[]): number {
  return (
    usage.find((usageFact) => usageFact.path === result.candidate.path)
      ?.fileReferenceCount ?? 0
  );
}

function roleWeight(result: SimilarityResult, roles: RoleFact[]): number {
  return roles.some(
    (role) =>
      role.path === result.candidate.path &&
      role.role === "shared" &&
      (role.name === undefined || role.name === result.candidate.name)
  )
    ? 1
    : 0;
}
