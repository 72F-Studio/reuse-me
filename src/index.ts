export { defaultConfig } from "./config/defaults";
export { RepositoryFactsIndexBuilder } from "./analysis/repositoryFactsIndexBuilder";
export { RepositoryStructureAnalyzer } from "./analysis/repositoryStructureAnalyzer";
export { ChangedFactsProjector } from "./analysis/changedFactsProjector";
export { ChangedPatternDetector } from "./analysis/changedPatternDetector";
export { ChangeAnalysisResultAssembler } from "./analysis/changeAnalysisResultAssembler";
export { CandidateDiscovery } from "./analysis/candidateDiscovery";
export { CandidateRanker } from "./analysis/candidateRanker";
export { ConfidenceCalculator } from "./analysis/confidenceCalculator";
export { CompetingImplementationDetector } from "./analysis/competingImplementationDetector";
export { RepositoryHealthResultAssembler } from "./analysis/repositoryHealthResultAssembler";
export { RepositoryPatternDetector } from "./analysis/repositoryPatternDetector";
export { RoleAnalyzer } from "./analysis/roleAnalyzer";
export { SimilarityScorer } from "./analysis/similarityScorer";
export { MissingAbstractionDetector } from "./analysis/missingAbstractionDetector";
export { SourceOfTruthWarningGenerator } from "./analysis/sourceOfTruthWarningGenerator";
export { UnusedAbstractionDetector } from "./analysis/unusedAbstractionDetector";
export { UsageAnalyzer } from "./analysis/usageAnalyzer";
export { TypeScriptReactExtractor } from "./extractors/typescript-react/TypeScriptReactExtractor";
export { GenericDeclarationsExtractor } from "./extractors/generic-declarations/GenericDeclarationsExtractor";
export { RepositoryKnowledgeAssembler } from "./knowledge/repositoryKnowledgeAssembler";
export { CONFIG_FILENAME, loadConfig } from "./config/loadConfig";
export {
  GitChangedFileProvider,
  parseGitNameStatus
} from "./git/diffReader";
export { discoverRepositoryContext, findRepositoryRoot } from "./git/repoRoot";
export { ChangeAnalysisRunner } from "./runner/changeAnalysisRunner";
export { KnowledgePipelineRunner } from "./runner/knowledgePipelineRunner";
export { RepositoryHealthRunner } from "./runner/repositoryHealthRunner";
export { JsonReporter } from "./reporter/jsonReporter";
export { MarkdownReporter } from "./reporter/markdownReporter";
export { TextReporter } from "./reporter/textReporter";
export type { AbstractionCandidate } from "./model/abstractionCandidate";
export type { AnalyzerConfig } from "./model/config";
export type { ChangedFacts } from "./model/changedFacts";
export type { ChangeAnalysisResult } from "./model/changeAnalysisResult";
export type { CapabilityReport, CapabilityStatus } from "./model/capability";
export type { ChangedFile } from "./model/diff";
export type { ConfidenceScore } from "./model/confidence";
export type { ObservedPattern } from "./model/observedPattern";
export type { CandidateRanking } from "./model/ranking";
export type { RelationshipFact } from "./model/relationship";
export type {
  RepositoryKnowledge,
  RepositoryKnowledgeInput
} from "./model/repositoryKnowledge";
export type {
  CompetingImplementationFinding,
  MissingAbstractionFinding,
  UnusedAbstractionFinding
} from "./model/repositoryHealthFinding";
export type {
  DuplicateDeclarationSignal,
  IntelligenceConfidence,
  IntelligenceCoverage,
  IntelligenceSignalSummary,
  KnowledgeProviderSummary,
  RepositoryHealthResult,
  RepositoryIntelligenceArea,
  RepositoryIntelligenceReport,
  TopReferencedFileSignal,
  UnavailableIntelligence,
  UnresolvedImportSignal
} from "./model/repositoryHealthResult";
export type {
  RepositoryHeuristicFinding,
  RepositoryStructureAnalysis,
  RepositoryStructureSummary
} from "./model/repositoryStructure";
export type {
  DeclarationFact,
  ExportFact,
  ImportFact,
  RepositoryFacts
} from "./model/repositoryFacts";
export type { FeatureFact } from "./model/featureFact";
export type {
  IndexedDeclaration,
  IndexedExport,
  IndexedImport,
  RepositoryFactsIndex
} from "./model/repositoryFactsIndex";
export type { RoleFact } from "./model/role";
export type { SimilarityResult } from "./model/similarity";
export type { SourceOfTruthWarning } from "./model/sourceOfTruthWarning";
export type { RepositoryContext } from "./model/repository";
export type {
  ExtractionResult,
  ExtractorDescriptor,
  ExtractorSupport,
  RepositoryExtractor
} from "./model/extractor";
export type { KnowledgeConstructionResult } from "./model/knowledgeConstructionResult";
export type { Language } from "./model/language";
export type { SourceArtifact, SourceRoleHint } from "./model/sourceArtifact";
export type { DeclarationUsageFact, UsageFact } from "./model/usage";
