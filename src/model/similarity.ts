import type { AbstractionCandidate } from "./abstractionCandidate";

// Similarity evidence between an observed pattern and a candidate abstraction.
// Contains comparison evidence only and does not apply warning policy.
export interface SimilarityResult {
  patternId: string;
  candidate: AbstractionCandidate;
  score: number;
  evidence: {
    structureOverlap: number;
    styleOverlap: number;
    nameOverlap: number;
  };
}
