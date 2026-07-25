import type { AbstractionCandidate } from "./abstractionCandidate";

// Ranked candidate for an observed pattern.
// Ranking orders evidence but does not decide whether to warn.
export interface CandidateRanking {
  patternId: string;
  candidate: AbstractionCandidate;
  rank: number;
  score: number;
  reasons: string[];
}
