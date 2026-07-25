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
        const candidateStructure = featureIds(facts?.features ?? [], "structure");
        const candidateStyle = featureIds(facts?.features ?? [], "style");
        const evidence = {
          structureOverlap: containment(
            candidateStructure,
            featureIds(pattern.features, "structure")
          ),
          styleOverlap: containment(
            candidateStyle,
            featureIds(pattern.features, "style")
          ),
          candidateFeatureCount: new Set([
            ...candidateStructure,
            ...candidateStyle
          ]).size,
          // Compared case-insensitively on purpose: local code that renders a
          // `button` element or constructs a `button` is evidence about a
          // shared component named `Button`.
          nameOverlap: pattern.names.some(
            (name) => name.toLowerCase() === candidate.name.toLowerCase()
          )
            ? 1
            : 0
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

// How much of the candidate abstraction reappears inside the observed pattern.
//
// This is deliberately asymmetric. The question is not "are these two things
// the same size and shape" but "does this local code re-implement that shared
// component". A screen that wraps a copied button in a card and a heading
// contains everything the shared Button is, plus extra of its own — and it is
// exactly the case the tool exists to catch.
//
// A symmetric measure counted that extra against the match: with Jaccard, one
// wrapping <div> dropped a verbatim re-implementation of a five-class button
// from a match to 0.66, under the 0.7 warning threshold. The bigger the
// surrounding screen, the more invisible the duplication became.
function containment(candidateFeatures: string[], patternFeatures: string[]): number {
  const candidateSet = new Set(candidateFeatures);
  const patternSet = new Set(patternFeatures);

  if (candidateSet.size === 0 || patternSet.size === 0) {
    return 0;
  }

  const shared = [...candidateSet].filter((value) => patternSet.has(value)).length;

  return shared / candidateSet.size;
}
