import type { SourceOfTruthWarning } from "./sourceOfTruthWarning";

// Result object for change analysis mode.
// Reporters consume this without inspecting repository internals.
export interface ChangeAnalysisResult {
  mode: "change";
  warnings: SourceOfTruthWarning[];
  metadata: {
    changedFileCount: number;
    warningCount: number;
  };
}
