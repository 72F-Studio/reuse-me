import type { ExtractorDescriptor } from "./extractor";
import type { Language } from "./language";
import type { CapabilityReport } from "./capability";
import type { RepositoryContext } from "./repository";
import type { RepositoryKnowledge } from "./repositoryKnowledge";
import type { RepositoryStructureAnalysis } from "./repositoryStructure";

export type KnowledgeConstructionResult =
  | {
      status: "ready";
      knowledge: RepositoryKnowledge;
      capabilities: CapabilityReport[];
      repositoryStructure: RepositoryStructureAnalysis;
    }
  | {
      status: "limited";
      context: RepositoryContext;
      detectedLanguages: Language[];
      registeredExtractors: ExtractorDescriptor[];
      capabilities: CapabilityReport[];
      repositoryStructure: RepositoryStructureAnalysis;
    };
