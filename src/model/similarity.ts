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
    // How many comparable features the candidate itself carries. A candidate
    // with almost no shape is trivially contained in anything, so confidence
    // policy needs to see this to discount it.
    candidateFeatureCount: number;
  };
}
