// Represents a repository source file selected for later UI analysis.
// Contains repository-observable path data only and does not imply semantics.
export interface SourceFileCandidate {
  path: string;
  discoveredFrom: "sharedSourceDir" | "localSourceDir";
}
