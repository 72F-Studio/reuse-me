import type { ChangeAnalysisResult } from "../model/changeAnalysisResult";
import type { ChangedFacts } from "../model/changedFacts";
import type { SourceOfTruthWarning } from "../model/sourceOfTruthWarning";

// Packages change-analysis output for reporters.
// Contains no warning policy or repository analysis.
export class ChangeAnalysisResultAssembler {
  assemble(
    changedFacts: ChangedFacts[],
    warnings: SourceOfTruthWarning[]
  ): ChangeAnalysisResult {
    return {
      mode: "change",
      warnings,
      metadata: {
        changedFileCount: changedFacts.length,
        warningCount: warnings.length
      }
    };
  }
}
