export interface RepositoryStructureSummary {
  // Absolute path that was actually analysed. Reported so a surprising root —
  // an outer Git repository, a parent checkout — is visible instead of silent.
  rootPath: string;
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
