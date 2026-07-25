import { LanguageDetector } from "../discovery/languageDetector";
import { GenericDeclarationsExtractor } from "../extractors/generic-declarations/GenericDeclarationsExtractor";
import { TypeScriptReactExtractor } from "../extractors/typescript-react/TypeScriptReactExtractor";
import { RepositoryFactsIndexBuilder } from "../analysis/repositoryFactsIndexBuilder";
import { RepositoryStructureAnalyzer } from "../analysis/repositoryStructureAnalyzer";
import { UsageAnalyzer } from "../analysis/usageAnalyzer";
import { discoverRepositoryContext } from "../git/repoRoot";
import { RepositoryKnowledgeAssembler } from "../knowledge/repositoryKnowledgeAssembler";
import type { CapabilityReport } from "../model/capability";
import type { RepositoryExtractor } from "../model/extractor";
import type { KnowledgeConstructionResult } from "../model/knowledgeConstructionResult";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";

// Runs knowledge construction end to end.
// Framework-specific parsing is delegated to registered knowledge providers.
export class KnowledgePipelineRunner {
  constructor(
    private readonly extractors: RepositoryExtractor[] = [
      new TypeScriptReactExtractor(),
      new GenericDeclarationsExtractor()
    ],
    private readonly languageDetector = new LanguageDetector(),
    private readonly structureAnalyzer = new RepositoryStructureAnalyzer(),
    private readonly indexBuilder = new RepositoryFactsIndexBuilder(),
    private readonly usageAnalyzer = new UsageAnalyzer(),
    private readonly assembler = new RepositoryKnowledgeAssembler()
  ) {}

  construct(startPath: string): KnowledgeConstructionResult {
    const context = discoverRepositoryContext(startPath);
    const repositoryStructure = this.structureAnalyzer.analyze(context);
    const detectedLanguages = this.languageDetector.detect(context);
    const extractor = this.extractors.find(
      (candidate) => candidate.detect(context).supported
    );

    if (extractor === undefined) {
      return {
        status: "limited",
        context,
        detectedLanguages,
        registeredExtractors: this.extractors.map((candidate) =>
          candidate.descriptor()
        ),
        capabilities: limitedCapabilities(),
        repositoryStructure
      };
    }

    const extraction = extractor.extract(context);
    const factsIndex = this.indexBuilder.build(extraction.facts);
    const usage = this.usageAnalyzer.analyze(factsIndex, extraction.relationships);

    return {
      status: "ready",
      capabilities: readyCapabilities(extractor.descriptor()),
      repositoryStructure,
      knowledge: this.assembler.assemble({
        context,
        sourceArtifacts: extraction.artifacts,
        factsIndex,
        relationships: extraction.relationships,
        usage
      })
    };
  }

  run(startPath: string): RepositoryKnowledge {
    const result = this.construct(startPath);

    if (result.status === "limited") {
      throw new Error("No knowledge provider can produce repository facts for this repository.");
    }

    return result.knowledge;
  }
}

function readyCapabilities(
  extractor: ReturnType<RepositoryExtractor["descriptor"]>
): CapabilityReport[] {
  return [
    available("repository-structure", "Repository structure", "built-in"),
    available("repository-heuristics", "Repository heuristics", "built-in"),
    available("declaration-extraction", "Declaration extraction", extractor.name),
    extractor.id === "typescript-react"
      ? available("ui-extraction", "UI extraction", extractor.name)
      : missing("ui-extraction", "UI extraction")
  ];
}

function limitedCapabilities(): CapabilityReport[] {
  return [
    available("repository-structure", "Repository structure", "built-in"),
    available("repository-heuristics", "Repository heuristics", "built-in"),
    missing("declaration-extraction", "Declaration extraction"),
    missing("ui-extraction", "UI extraction")
  ];
}

function available(id: string, name: string, reason: string): CapabilityReport {
  return { id, name, status: "available", reason };
}

function missing(id: string, name: string): CapabilityReport {
  return {
    id,
    name,
    status: "missing",
    reason: "no knowledge provider contributes this intelligence"
  };
}
