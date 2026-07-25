import type { Language } from "./language";
import type { RelationshipFact } from "./relationship";
import type { RepositoryContext } from "./repository";
import type { RepositoryFacts } from "./repositoryFacts";
import type { SourceArtifact } from "./sourceArtifact";

export interface ExtractorDescriptor {
  id: string;
  name: string;
  languages: Language[];
}

export interface ExtractorSupport {
  supported: boolean;
  detectedLanguages: Language[];
  reason?: string;
}

export interface ExtractionResult {
  artifacts: SourceArtifact[];
  facts: RepositoryFacts[];
  relationships: RelationshipFact[];
}

export interface RepositoryExtractor {
  descriptor(): ExtractorDescriptor;
  detect(context: RepositoryContext): ExtractorSupport;
  extract(context: RepositoryContext): ExtractionResult;
}

