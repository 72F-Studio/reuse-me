// Bounded confidence for a ranked pattern/candidate result.
// Mode-specific stages decide how to apply thresholds.
export interface ConfidenceScore {
  patternId: string;
  candidatePath: string;
  candidateName: string;
  score: number;
  reasons: string[];
}
