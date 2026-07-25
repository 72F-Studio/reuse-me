import type { AbstractionCandidate } from "../model/abstractionCandidate";
import type { FeatureFact } from "../model/featureFact";
import type { ObservedPattern } from "../model/observedPattern";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type { SimilarityResult } from "../model/similarity";

// Scores observed patterns against candidate abstractions using shared evidence.
// This stage compares only; it does not rank or apply thresholds.
export class SimilarityScorer {
  score(
    patterns: ObservedPattern[],
    candidates: AbstractionCandidate[],
    knowledge: RepositoryKnowledge
  ): SimilarityResult[] {
    const results: SimilarityResult[] = [];

    for (const pattern of patterns) {
      for (const candidate of candidates) {
        const facts = knowledge.factsForPath(candidate.path);
        const evidence = {
          structureOverlap: overlap(
            featureIds(pattern.features, "structure"),
            featureIds(facts?.features ?? [], "structure")
          ),
          styleOverlap: overlap(
            featureIds(pattern.features, "style"),
            featureIds(facts?.features ?? [], "style")
          ),
          nameOverlap: pattern.names.includes(candidate.name) ? 1 : 0
        };

        results.push({
          patternId: pattern.id,
          candidate,
          score:
            evidence.structureOverlap * 0.5 +
            evidence.styleOverlap * 0.3 +
            evidence.nameOverlap * 0.2,
          evidence
        });
      }
    }

    return results;
  }
}

function featureIds(
  features: FeatureFact[],
  category: FeatureFact["category"]
): string[] {
  return features
    .filter((feature) => feature.category === category)
    .map((feature) => `${feature.key}:${feature.value}`);
}

function overlap(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);

  if (leftSet.size === 0 || rightSet.size === 0) {
    return 0;
  }

  const intersection = [...leftSet].filter((value) => rightSet.has(value)).length;
  const union = new Set([...leftSet, ...rightSet]).size;

  return intersection / union;
}
