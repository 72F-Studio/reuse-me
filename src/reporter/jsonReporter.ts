import type { ChangeAnalysisResult } from "../model/changeAnalysisResult";
import type { RepositoryHealthResult } from "../model/repositoryHealthResult";

// Renders analysis results as stable JSON.
// Presentation only: no filtering or analysis.
export class JsonReporter {
  render(result: ChangeAnalysisResult | RepositoryHealthResult): string {
    return JSON.stringify(result, null, 2);
  }
}
