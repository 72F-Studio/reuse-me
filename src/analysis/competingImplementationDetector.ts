import type { ConfidenceScore } from "../model/confidence";
import type { ObservedPattern } from "../model/observedPattern";
import type { CandidateRanking } from "../model/ranking";
import type { RepositoryContext } from "../model/repository";
import type { CompetingImplementationFinding } from "../model/repositoryHealthFinding";

// Creates health findings for local patterns that match existing abstractions.
// This stage applies health threshold policy only.
export class CompetingImplementationDetector {
  detect(
    context: RepositoryContext,
    patterns: ObservedPattern[],
    rankings: CandidateRanking[],
    confidenceScores: ConfidenceScore[]
  ): CompetingImplementationFinding[] {
    const findings: CompetingImplementationFinding[] = [];

    for (const confidence of confidenceScores) {
      if (confidence.score < context.config.warningThreshold) {
        continue;
      }

      const pattern = patterns.find((entry) => entry.id === confidence.patternId);
      const ranking = rankings.find(
        (entry) => entry.patternId === confidence.patternId && entry.rank === 1
      );

      if (pattern === undefined || ranking === undefined) {
        continue;
      }

      findings.push({
        kind: "competing-implementation",
        sourcePaths: pattern.sourcePaths,
        candidatePath: ranking.candidate.path,
        candidateName: ranking.candidate.name,
        confidence: confidence.score,
        evidence: confidence.reasons
      });
    }

    return findings;
  }
}
