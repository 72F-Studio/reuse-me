// Health finding for a shared abstraction with little or no usage.
export interface UnusedAbstractionFinding {
  kind: "unused-abstraction";
  candidatePath: string;
  candidateName: string;
  evidence: string[];
}

// Health finding for local implementations competing with an existing abstraction.
export interface CompetingImplementationFinding {
  kind: "competing-implementation";
  sourcePaths: string[];
  candidatePath: string;
  candidateName: string;
  confidence: number;
  evidence: string[];
}

// Health finding for repeated local patterns without a strong existing abstraction.
export interface MissingAbstractionFinding {
  kind: "missing-abstraction";
  sourcePaths: string[];
  evidence: string[];
}
