import type { ChangeAnalysisResult } from "../model/changeAnalysisResult";
import type { ExtractorDescriptor } from "../model/extractor";
import type { Language } from "../model/language";
import type {
  IntelligenceSignalSummary,
  RepositoryHealthResult,
  RepositoryIntelligenceReport
} from "../model/repositoryHealthResult";
import type {
  RepositoryHeuristicFinding,
  RepositoryStructureSummary
} from "../model/repositoryStructure";

// Renders analysis results for terminal output.
// Presentation only: no filtering or analysis.
export class TextReporter {
  render(result: ChangeAnalysisResult | RepositoryHealthResult): string {
    return result.mode === "change"
      ? renderChange(result)
      : renderHealth(result);
  }
}

function renderChange(result: ChangeAnalysisResult): string {
  if (result.warnings.length === 0) {
    return "No source-of-truth warnings.";
  }

  return result.warnings
    .map(
      (warning) =>
        `Source-of-truth warning: ${warning.changedFiles.join(", ")} -> ${warning.candidatePath} (${warning.candidateName}), confidence ${warning.confidence}`
    )
    .join("\n");
}

function renderHealth(result: RepositoryHealthResult): string {
  const lines =
    result.status === "limited"
      ? [
          "RRR Health",
          "Repository Intelligence",
          `Detected languages: ${formatLanguages(result.detectedLanguages)}.`,
          `Registered knowledge providers: ${formatProviders(result.registeredExtractors)}.`
        ]
      : ["RRR Health", "Repository Intelligence"];

  lines.push(
    ...formatIntelligence(result.intelligence),
    `Repository data: ${formatRepository(result.repository)}.`
  );

  if (result.status === "ready") {
    lines.push(
      `Knowledge data: ${result.metadata.declarationCount} declarations, ${result.metadata.importCount} imports, ${result.metadata.resolvedRelationshipCount}/${result.metadata.relationshipCount} resolved relationships, ${result.metadata.referencedFileCount} referenced files.`
    );
    lines.push(...formatIntelligenceSignals(result.intelligenceSignals));
  }

  if (result.metadata.findingCount === 0) {
    lines.push("No repository health findings.");
    return lines.join("\n");
  }

  lines.push(
    ...formatRepositoryHeuristics(result.repositoryHeuristics),
    ...(result.status === "ready"
      ? [
          ...result.unusedAbstractions.map(
            (finding) =>
              `Unused abstraction: ${finding.candidatePath} (${finding.candidateName})`
          ),
          ...result.competingImplementations.map(
            (finding) =>
              `Competing implementation: ${finding.sourcePaths.join(", ")} -> ${finding.candidatePath} (${finding.candidateName}), confidence ${finding.confidence}`
          ),
          ...result.missingAbstractions.map(
            (finding) =>
              `Missing abstraction: repeated pattern in ${finding.sourcePaths.join(", ")}`
          )
        ]
      : [])
  );

  return lines.join("\n");
}

function formatIntelligenceSignals(
  insights: IntelligenceSignalSummary
): string[] {
  return [
    ...take(insights.topReferencedFiles, 5).map(
      (signal) =>
        `Top referenced file: ${signal.path} (${signal.referenceCount} references)`
    ),
    ...take(insights.unresolvedImports, 5).map(
      (signal) =>
        `Unresolved import hotspot: ${signal.sourceModule} (${signal.importerCount} importers)`
    ),
    ...take(insights.duplicateDeclarations, 5).map(
      (signal) =>
        `Duplicate declaration: ${signal.name} (${signal.paths.length} files)`
    )
  ];
}

function take<Value>(values: Value[], count: number): Value[] {
  return values.slice(0, count);
}

function formatRepositoryHeuristics(
  findings: RepositoryHeuristicFinding[]
): string[] {
  return findings.map(
    (finding) => `Repository heuristic: ${finding.title}: ${finding.paths.join(", ")}`
  );
}

function formatRepository(repository: RepositoryStructureSummary): string {
  return `${repository.rootPath}: ${repository.fileCount} files, ${repository.sourceFileCount} source files, ${repository.directoryCount} directories`;
}

function formatIntelligence(intelligence: RepositoryIntelligenceReport): string[] {
  return [
    "Knowledge Sources",
    ...intelligence.areas.map(
      (area) =>
        `${coverageSymbol(area.coverage)} ${area.name}: ${area.coverage}`
    ),
    "Confidence",
    ...intelligence.areas.map(
      (area) => `${area.name}: ${area.confidence}`
    ),
    `Knowledge providers: ${intelligence.providers
      .map((provider) => provider.name)
      .join(", ")}.`,
    ...(intelligence.unavailable.length === 0
      ? []
      : [
          "Unavailable Intelligence:",
          ...intelligence.unavailable.map(
            (entry) => `${entry.name}: ${entry.reason}`
          )
        ])
  ];
}

function coverageSymbol(
  coverage: RepositoryIntelligenceReport["areas"][number]["coverage"]
): string {
  if (coverage === "complete") {
    return "[ok]";
  }

  if (coverage === "partial") {
    return "[partial]";
  }

  return "[none]";
}

function formatLanguages(languages: Language[]): string {
  if (languages.length === 0) {
    return "unknown";
  }

  return languages.map((language) => language.name).join(", ");
}

function formatProviders(extractors: ExtractorDescriptor[]): string {
  if (extractors.length === 0) {
    return "none";
  }

  return extractors
    .map(
      (extractor) =>
        `${extractor.name} (${extractor.languages
          .map((language) => language.name)
          .join(", ")})`
    )
    .join("; ");
}
