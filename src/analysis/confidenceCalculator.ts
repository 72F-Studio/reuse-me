import type { ConfidenceScore } from "../model/confidence";
import type { ObservedPattern } from "../model/observedPattern";
import type { CandidateRanking } from "../model/ranking";

// Converts ranked candidate evidence into bounded confidence scores.
// Mode-specific stages decide whether a score becomes a warning or finding.
export class ConfidenceCalculator {
  calculate(
    rankings: CandidateRanking[],
    patterns: ObservedPattern[]
  ): ConfidenceScore[] {
    const grouped = groupByPattern(rankings);
    const scores: ConfidenceScore[] = [];

    for (const [patternId, patternRankings] of grouped.entries()) {
      const top = patternRankings.find((ranking) => ranking.rank === 1);

      if (top === undefined) {
        continue;
      }

      const runnerUp = patternRankings.find((ranking) => ranking.rank === 2);
      const pattern = patterns.find((entry) => entry.id === patternId);
      const ambiguityPenalty =
        runnerUp !== undefined && top.score - runnerUp.score < 0.15 ? 0.2 : 0;
      const weakPatternPenalty =
        pattern !== undefined && pattern.sourcePaths.length < 2 ? 0.2 : 0;
      // Containment rewards a candidate whose whole shape reappears in the
      // pattern. A candidate with a single feature is contained in almost
      // anything, so it must not score as a confident match on that basis
      // alone. Two features is already specific enough to mean something —
      // a button with one element and one class is a real component.
      const thinCandidatePenalty = top.candidateFeatureCount < 2 ? 0.3 : 0;
      const score = clamp(
        top.score - ambiguityPenalty - weakPatternPenalty - thinCandidatePenalty
      );

      scores.push({
        patternId,
        candidatePath: top.candidate.path,
        candidateName: top.candidate.name,
        score,
        reasons: [
          ...top.reasons,
          ...(ambiguityPenalty > 0 ? ["ambiguous candidates"] : []),
          ...(weakPatternPenalty > 0 ? ["weak pattern evidence"] : []),
          ...(thinCandidatePenalty > 0 ? ["thin candidate evidence"] : [])
        ]
      });
    }

    return scores;
  }
}

function groupByPattern(
  rankings: CandidateRanking[]
): Map<string, CandidateRanking[]> {
  const grouped = new Map<string, CandidateRanking[]>();

  for (const ranking of rankings) {
    grouped.set(ranking.patternId, [
      ...(grouped.get(ranking.patternId) ?? []),
      ranking
    ]);
  }

  return grouped;
}

function clamp(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}
