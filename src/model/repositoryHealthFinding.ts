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

// Health finding for a design value written as a literal rather than referenced
// as a token. "bypassed" means a token with this exact value already exists;
// "candidate" means enough files repeat the value that it behaves like one.
export interface UntokenizedValueFinding {
  kind: "untokenized-value";
  reason: "bypassed" | "candidate";
  value: string;
  sourcePaths: string[];
  tokenNames: string[];
  evidence: string[];
}
