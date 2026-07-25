// Change-analysis warning that a local patch likely belongs in a shared abstraction.
// Contains presentation-ready evidence but no formatting.
export interface SourceOfTruthWarning {
  changedFiles: string[];
  candidatePath: string;
  candidateName: string;
  confidence: number;
  evidence: string[];
}
