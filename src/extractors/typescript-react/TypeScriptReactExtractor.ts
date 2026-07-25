import { join } from "node:path";

import { RepositoryFactsIndexBuilder } from "../../analysis/repositoryFactsIndexBuilder";
import type {
  ExtractionResult,
  ExtractorDescriptor,
  ExtractorSupport,
  RepositoryExtractor
} from "../../model/extractor";
import type { RepositoryContext } from "../../model/repository";
import type { RepositoryFacts } from "../../model/repositoryFacts";
import type { SourceArtifact } from "../../model/sourceArtifact";
import { JsxStructureExtractor } from "./jsxStructureExtractor";
import { RelationshipAnalyzer } from "./relationshipAnalyzer";
import { RepositoryFactsBuilder } from "./repositoryFactsBuilder";
import { SourceFileDiscovery } from "./sourceFileDiscovery";
import { SourceFileParser } from "./sourceFileParser";
import type { SourceFileCandidate } from "./sourceFileCandidate";
import { StyleTokenExtractor } from "./styleTokenExtractor";
import { UiFileClassifier } from "./uiFileClassifier";
import type { UiFile } from "./uiFile";

const TYPESCRIPT = { id: "typescript", name: "TypeScript" };
const JAVASCRIPT = { id: "javascript", name: "JavaScript" };
const DESCRIPTOR: ExtractorDescriptor = {
  id: "typescript-react",
  name: "TypeScript React Provider",
  languages: [TYPESCRIPT, JAVASCRIPT],
  contributes: ["declaration-extraction", "ui-extraction"]
};

// Current React/TypeScript extraction backend.
// Framework-specific source parsing and syntax evidence stay behind this boundary.
export class TypeScriptReactExtractor implements RepositoryExtractor {
  constructor(
    private readonly sourceDiscovery = new SourceFileDiscovery(),
    private readonly uiClassifier = new UiFileClassifier(),
    private readonly parser = new SourceFileParser(),
    private readonly factsBuilder = new RepositoryFactsBuilder(),
    private readonly jsxExtractor = new JsxStructureExtractor(),
    private readonly styleExtractor = new StyleTokenExtractor(),
    private readonly indexBuilder = new RepositoryFactsIndexBuilder(),
    private readonly relationshipAnalyzer = new RelationshipAnalyzer()
  ) {}

  descriptor(): ExtractorDescriptor {
    return DESCRIPTOR;
  }

  detect(context: RepositoryContext): ExtractorSupport {
    const sourceFiles = this.sourceDiscovery.discover(context);

    return {
      supported: sourceFiles.length > 0,
      detectedLanguages: sourceFiles.length > 0 ? DESCRIPTOR.languages : [],
      reason:
        sourceFiles.length > 0
          ? undefined
          : "No TypeScript/React source files found in configured source directories."
    };
  }

  extract(context: RepositoryContext): ExtractionResult {
    const sourceFiles = this.sourceDiscovery.discover(context);
    const artifacts = this.toArtifacts(sourceFiles);
    const facts = sourceFiles.map((sourceFile) =>
      this.buildFacts(context.rootPath, sourceFile)
    );
    const factsIndex = this.indexBuilder.build(facts);

    return {
      artifacts,
      facts,
      relationships: this.relationshipAnalyzer.analyze(factsIndex)
    };
  }

  private toArtifacts(sourceFiles: SourceFileCandidate[]): SourceArtifact[] {
    const changedFiles = sourceFiles.map((sourceFile) => ({
      path: sourceFile.path,
      status: "modified" as const
    }));
    const uiFilesByPath = new Map(
      this.uiClassifier.classifyFiles(changedFiles).map((uiFile) => [
        uiFile.path,
        uiFile
      ])
    );

    return sourceFiles.map((sourceFile) =>
      toSourceArtifact(sourceFile, uiFilesByPath.get(sourceFile.path))
    );
  }

  private buildFacts(
    rootPath: string,
    sourceFile: SourceFileCandidate
  ): RepositoryFacts {
    const parsedSource = this.parser.parse({
      path: join(rootPath, sourceFile.path),
      framework: "unknown",
      kind: "unknown"
    });
    const baseFacts = this.factsBuilder.build({
      ...parsedSource,
      path: sourceFile.path
    });
    const jsxFacts = this.jsxExtractor.enrich(parsedSource, baseFacts);

    return this.styleExtractor.enrich(parsedSource, {
      ...jsxFacts,
      path: sourceFile.path
    });
  }
}

function toSourceArtifact(
  sourceFile: SourceFileCandidate,
  uiFile: UiFile | undefined
): SourceArtifact {
  return {
    path: sourceFile.path,
    language: sourceFile.path.endsWith(".js") || sourceFile.path.endsWith(".jsx")
      ? JAVASCRIPT
      : TYPESCRIPT,
    extractorId: DESCRIPTOR.id,
    roleHints: roleHintsFor(sourceFile, uiFile)
  };
}

function roleHintsFor(
  sourceFile: SourceFileCandidate,
  uiFile: UiFile | undefined
): SourceArtifact["roleHints"] {
  if (sourceFile.discoveredFrom === "sharedSourceDir") {
    return [{ role: "shared", reason: "shared source directory" }];
  }

  if (sourceFile.discoveredFrom === "localSourceDir" || uiFile?.kind === "page") {
    return [{ role: "local", reason: "local source directory" }];
  }

  return [];
}
