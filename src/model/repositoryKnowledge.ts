import type { RelationshipFact } from "./relationship";
import type { RepositoryContext } from "./repository";
import type { RepositoryFacts } from "./repositoryFacts";
import type {
  IndexedDeclaration,
  IndexedExport,
  IndexedImport,
  RepositoryFactsIndex
} from "./repositoryFactsIndex";
import type { SourceArtifact } from "./sourceArtifact";
import type { UsageFact } from "./usage";

// Single query boundary for stable knowledge constructed from a repository.
// Does not include Git diff state, warnings, health findings, or presentation data.
export interface RepositoryKnowledge {
  context: RepositoryContext;

  sourceArtifacts(): SourceArtifact[];
  sourceFiles(): SourceArtifact[];
  files(): SourceArtifact[];
  artifactForPath(path: string): SourceArtifact | undefined;
  factsForPath(path: string): RepositoryFacts | undefined;
  allFacts(): RepositoryFacts[];

  declarationsByName(name: string): IndexedDeclaration[];
  exportsByName(name: string): IndexedExport[];
  importsBySource(sourceModule: string): IndexedImport[];

  relationships(): RelationshipFact[];
  relationshipsForPath(path: string): RelationshipFact[];

  usage(): UsageFact[];
  usageForPath(path: string): UsageFact | undefined;
}

// Inputs required to assemble repository knowledge from completed construction stages.
// This type carries already-derived facts only and performs no new analysis.
export interface RepositoryKnowledgeInput {
  context: RepositoryContext;
  sourceArtifacts: SourceArtifact[];
  factsIndex: RepositoryFactsIndex;
  relationships: RelationshipFact[];
  usage: UsageFact[];
}
