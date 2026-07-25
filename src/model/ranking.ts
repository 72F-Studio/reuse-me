import type { AbstractionCandidate } from "./abstractionCandidate";

// Ranked candidate for an observed pattern.
// Ranking orders evidence but does not decide whether to warn.
export interface CandidateRanking {
  patternId: string;
  candidate: AbstractionCandidate;
  rank: number;
  score: number;
  // Carried through from the similarity evidence so confidence policy can
  // discount candidates that are too featureless to be a meaningful match.
  candidateFeatureCount: number;
  reasons: string[];
}
