import type { ConfidenceScore } from "../model/confidence";
import type { ObservedPattern } from "../model/observedPattern";
import type { RepositoryContext } from "../model/repository";
import type { MissingAbstractionFinding } from "../model/repositoryHealthFinding";

// Creates health findings for repeated local patterns without a strong candidate.
// This stage does not propose an implementation.
export class MissingAbstractionDetector {
  detect(
    context: RepositoryContext,
    patterns: ObservedPattern[],
    confidenceScores: ConfidenceScore[]
  ): MissingAbstractionFinding[] {
    return patterns
      .filter((pattern) => pattern.sourcePaths.length >= 2)
      .filter((pattern) => {
        const confidence = confidenceScores.find(
          (score) => score.patternId === pattern.id
        );

        return (
          confidence === undefined ||
          confidence.score < context.config.warningThreshold
        );
      })
      .map((pattern) => ({
        kind: "missing-abstraction",
        sourcePaths: pattern.sourcePaths,
        evidence: ["repeated local pattern without strong candidate"]
      }));
  }
}
