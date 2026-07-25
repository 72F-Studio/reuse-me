// Candidate governing abstraction discovered from repository declarations.
// Candidates are repository-observable and carry evidence, not final scores.
export interface AbstractionCandidate {
  path: string;
  name: string;
  evidence: string[];
}
