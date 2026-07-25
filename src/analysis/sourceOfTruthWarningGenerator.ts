import type { ChangedFacts } from "../model/changedFacts";
import type { ConfidenceScore } from "../model/confidence";
import type { ObservedPattern } from "../model/observedPattern";
import type { CandidateRanking } from "../model/ranking";
import type { RepositoryContext } from "../model/repository";
import type { SourceOfTruthWarning } from "../model/sourceOfTruthWarning";

// Generates change-analysis warnings from prior reasoning outputs.
// This stage applies threshold policy only and performs no new analysis.
export class SourceOfTruthWarningGenerator {
  generate(
    context: RepositoryContext,
    patterns: ObservedPattern[],
    rankings: CandidateRanking[],
    confidenceScores: ConfidenceScore[],
    changedFacts: ChangedFacts[]
  ): SourceOfTruthWarning[] {
    const warnings: SourceOfTruthWarning[] = [];

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

      warnings.push({
        changedFiles: pattern.sourcePaths.filter((path) =>
          changedFacts.some((changed) => changed.path === path)
        ),
        candidatePath: ranking.candidate.path,
        candidateName: ranking.candidate.name,
        confidence: confidence.score,
        evidence: confidence.reasons
      });
    }

    return warnings;
  }
}
