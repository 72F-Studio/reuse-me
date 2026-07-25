import type {
  CompetingImplementationFinding,
  MissingAbstractionFinding,
  UntokenizedValueFinding,
  UnusedAbstractionFinding
} from "./repositoryHealthFinding";
import type { CapabilityReport } from "./capability";
import type { ExtractorDescriptor } from "./extractor";
import type { Language } from "./language";
import type {
  RepositoryHeuristicFinding,
  RepositoryStructureSummary
} from "./repositoryStructure";

// Result object for repository health mode.
// Reporters consume this without inspecting repository internals.
export type RepositoryHealthResult =
  | ReadyRepositoryHealthResult
  | LimitedRepositoryHealthResult;

export interface ReadyRepositoryHealthResult {
  mode: "health";
  status: "ready";
  capabilities: CapabilityReport[];
  intelligence: RepositoryIntelligenceReport;
  repository: RepositoryStructureSummary;
  repositoryHeuristics: RepositoryHeuristicFinding[];
  intelligenceSignals: IntelligenceSignalSummary;
  unusedAbstractions: UnusedAbstractionFinding[];
  competingImplementations: CompetingImplementationFinding[];
  missingAbstractions: MissingAbstractionFinding[];
  untokenizedValues: UntokenizedValueFinding[];
  metadata: {
    findingCount: number;
    // Findings beyond the per-kind cap. Nonzero means the report is a
    // summary, not the complete list.
    omittedFindingCount: number;
    declarationCount: number;
    importCount: number;
    relationshipCount: number;
    resolvedRelationshipCount: number;
    referencedFileCount: number;
  };
}

export interface LimitedRepositoryHealthResult {
  mode: "health";
  status: "limited";
  detectedLanguages: Language[];
  registeredExtractors: ExtractorDescriptor[];
  capabilities: CapabilityReport[];
  intelligence: RepositoryIntelligenceReport;
  repository: RepositoryStructureSummary;
  repositoryHeuristics: RepositoryHeuristicFinding[];
  metadata: {
    findingCount: number;
  };
}

export interface RepositoryIntelligenceReport {
  areas: RepositoryIntelligenceArea[];
  unavailable: UnavailableIntelligence[];
  providers: KnowledgeProviderSummary[];
}

export interface RepositoryIntelligenceArea {
  id: string;
  name: string;
  coverage: IntelligenceCoverage;
  confidence: IntelligenceConfidence;
  reason: string;
}

export type IntelligenceCoverage = "complete" | "partial" | "unavailable";

export type IntelligenceConfidence =
  | "high"
  | "medium"
  | "low"
  | "not-available";

export interface UnavailableIntelligence {
  name: string;
  reason: string;
}

export interface KnowledgeProviderSummary {
  id: string;
  name: string;
}

export interface IntelligenceSignalSummary {
  topReferencedFiles: TopReferencedFileSignal[];
  unresolvedImports: UnresolvedImportSignal[];
  duplicateDeclarations: DuplicateDeclarationSignal[];
}

export interface TopReferencedFileSignal {
  path: string;
  referenceCount: number;
  topDeclarations: {
    name: string;
    referenceCount: number;
  }[];
}

export interface UnresolvedImportSignal {
  sourceModule: string;
  importerCount: number;
  sampleImporters: string[];
}

export interface DuplicateDeclarationSignal {
  name: string;
  // Sampled, not exhaustive. A common declaration name in a large repository
  // appears in hundreds of files, and emitting every path made this one signal
  // larger than the rest of the report put together, which defeats the point
  // of handing an agent a summary. Matches the shape unresolvedImports already
  // uses.
  samplePaths: string[];
  pathCount: number;
}
