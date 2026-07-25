import type { AnalyzerConfig } from "./config";

// Represents the execution context shared by later pipeline stages.
// Contains only repository-level data discovered before analysis begins.
export interface RepositoryContext {
  rootPath: string;
  config: AnalyzerConfig;
}
