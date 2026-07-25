import type { ChangeAnalysisResult } from "../model/changeAnalysisResult";
import type { InventoryResult } from "../model/inventoryResult";
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

// Renders analysis results as Markdown.
// Presentation only: no filtering or analysis.
export class MarkdownReporter {
  render(
    result: ChangeAnalysisResult | RepositoryHealthResult | InventoryResult
  ): string {
    if (result.mode === "change") {
      return renderChange(result);
    }

    return result.mode === "inventory"
      ? renderInventory(result)
      : renderHealth(result);
  }
}

function renderInventory(result: InventoryResult): string {
  return [
    "## Inventory",
    "",
    "### Shared components",
    "",
    ...(result.components.length === 0
      ? ["No shared components found."]
      : result.components.map(
          (component) =>
            `- \`${component.name}\` — ${component.path} (${component.referenceCount} references)`
        )),
    "",
    "### Design tokens",
    "",
    ...(result.tokens.length === 0
      ? ["No design tokens found."]
      : result.tokens.map(
          (token) =>
            `- \`${token.name}\` = \`${token.value}\` — ${token.sourcePath}`
        )),
    ""
  ].join("\n");
}

function renderChange(result: ChangeAnalysisResult): string {
  if (result.warnings.length === 0) {
    return "## Change Analysis\n\nNo source-of-truth warnings.\n";
  }

  return [
    "## Change Analysis",
    "",
    "| Changed Files | Candidate | Confidence |",
    "|---|---|---|",
    ...result.warnings.map(
      (warning) =>
        `| ${warning.changedFiles.join(", ")} | ${warning.candidatePath} (${warning.candidateName}) | ${warning.confidence} |`
    ),
    ""
  ].join("\n");
}

function renderHealth(result: RepositoryHealthResult): string {
  const lines = [
    "## RRR Health",
    "",
    "### Repository Intelligence",
    "",
    ...(result.status === "limited"
      ? [
          `Detected languages: ${formatLanguages(result.detectedLanguages)}.`,
          "",
          `Registered knowledge providers: ${formatProviders(result.registeredExtractors)}.`,
          ""
        ]
      : []),
    ...formatIntelligence(result.intelligence),
    "",
    `Repository data: ${formatRepository(result.repository)}.`,
    "",
    ...(result.status === "ready"
      ? [
          `Knowledge data: ${result.metadata.declarationCount} declarations, ${result.metadata.importCount} imports, ${result.metadata.resolvedRelationshipCount}/${result.metadata.relationshipCount} resolved relationships, ${result.metadata.referencedFileCount} referenced files.`,
          "",
          "### Intelligence Signals",
          "",
          ...formatIntelligenceSignals(result.intelligenceSignals),
          ""
        ]
      : []),
    "### Findings",
    "",
    ...(result.metadata.findingCount === 0
      ? ["No repository health findings."]
      : [
          ...formatRepositoryHeuristics(result.repositoryHeuristics),
          ...(result.status === "ready"
            ? [
                ...result.unusedAbstractions.map(
                  (finding) =>
                    `- Unused abstraction: ${finding.candidatePath} (${finding.candidateName})`
                ),
                ...result.competingImplementations.map(
                  (finding) =>
                    `- Competing implementation: ${finding.sourcePaths.join(", ")} -> ${finding.candidatePath} (${finding.candidateName}), confidence ${finding.confidence}`
                ),
                ...result.missingAbstractions.map(
                  (finding) =>
                    `- Missing abstraction: repeated pattern in ${finding.sourcePaths.join(", ")}`
                ),
                ...result.untokenizedValues.map((finding) =>
                  finding.reason === "bypassed"
                    ? `- Token bypassed: \`${finding.value}\` hardcoded in ${finding.sourcePaths.join(", ")} but declared as ${finding.tokenNames.join(", ")}`
                    : `- Token candidate: \`${finding.value}\` repeated in ${finding.sourcePaths.join(", ")} with no token declaring it`
                ),
                ...(result.metadata.omittedFindingCount > 0
                  ? [
                      "",
                      `_${result.metadata.omittedFindingCount} further findings not shown (report is capped per finding kind)._`
                    ]
                  : [])
              ]
            : [])
        ]),
    ""
  ];

  return lines.join("\n");
}

function formatIntelligenceSignals(
  insights: IntelligenceSignalSummary
): string[] {
  const lines = [
    ...insights.topReferencedFiles.slice(0, 5).map(
      (signal) =>
        `- Top referenced file: ${signal.path} (${signal.referenceCount} references)`
    ),
    ...insights.unresolvedImports.slice(0, 5).map(
      (signal) =>
        `- Unresolved import hotspot: ${signal.sourceModule} (${signal.importerCount} importers)`
    ),
    ...insights.duplicateDeclarations.slice(0, 5).map(
      (signal) =>
        `- Duplicate declaration: ${signal.name} (${signal.pathCount} files)`
    )
  ];

  return lines.length === 0 ? ["No intelligence signals."] : lines;
}

function formatIntelligence(intelligence: RepositoryIntelligenceReport): string[] {
  return [
    "#### Knowledge Sources",
    "",
    ...intelligence.areas.map(
      (area) =>
        `- ${coverageSymbol(area.coverage)} ${area.name}: ${area.coverage}`
    ),
    "",
    "#### Confidence",
    "",
    ...intelligence.areas.map(
      (area) => `- ${area.name}: ${area.confidence}`
    ),
    "",
    `Knowledge providers: ${intelligence.providers
      .map((provider) => provider.name)
      .join(", ")}.`,
    "",
    ...(intelligence.unavailable.length === 0
      ? []
      : [
          "#### Unavailable Intelligence",
          "",
          ...intelligence.unavailable.map(
            (entry) => `- ${entry.name}: ${entry.reason}`
          ),
          ""
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

function formatRepositoryHeuristics(
  findings: RepositoryHeuristicFinding[]
): string[] {
  return findings.map(
    (finding) => `- Repository heuristic: ${finding.title}: ${finding.paths.join(", ")}`
  );
}

function formatRepository(repository: RepositoryStructureSummary): string {
  return `${repository.rootPath}: ${repository.fileCount} files, ${repository.sourceFileCount} source files, ${repository.directoryCount} directories`;
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
