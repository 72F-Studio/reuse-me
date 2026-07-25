export interface RepositoryStructureSummary {
  fileCount: number;
  directoryCount: number;
  sourceFileCount: number;
  topLevelDirectories: string[];
}

export interface RepositoryHeuristicFinding {
  kind: "repository-heuristic";
  title: string;
  paths: string[];
  evidence: string[];
}

export interface RepositoryStructureAnalysis {
  summary: RepositoryStructureSummary;
  findings: RepositoryHeuristicFinding[];
}
