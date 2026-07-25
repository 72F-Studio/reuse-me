import type {
  CompetingImplementationFinding,
  MissingAbstractionFinding,
  UntokenizedValueFinding,
  UnusedAbstractionFinding
} from "../model/repositoryHealthFinding";
import type { CapabilityReport } from "../model/capability";
import type { KnowledgeConstructionResult } from "../model/knowledgeConstructionResult";
import type {
  RepositoryIntelligenceReport,
  RepositoryHealthResult,
  IntelligenceSignalSummary
} from "../model/repositoryHealthResult";
import type { RepositoryStructureAnalysis } from "../model/repositoryStructure";

// Packages repository health output for reporters.
// Contains no detection policy or repository analysis.
export class RepositoryHealthResultAssembler {
  assemble(input: {
    capabilities: CapabilityReport[];
    intelligence: RepositoryIntelligenceReport;
    repositoryStructure: RepositoryStructureAnalysis;
    semanticSummary: {
      declarationCount: number;
      importCount: number;
      relationshipCount: number;
      resolvedRelationshipCount: number;
      referencedFileCount: number;
    };
    intelligenceSignals: IntelligenceSignalSummary;
    unusedAbstractions: UnusedAbstractionFinding[];
    competingImplementations: CompetingImplementationFinding[];
    missingAbstractions: MissingAbstractionFinding[];
    untokenizedValues: UntokenizedValueFinding[];
  }): RepositoryHealthResult {
    const findingCount =
      input.repositoryStructure.findings.length +
      input.unusedAbstractions.length +
      input.competingImplementations.length +
      input.missingAbstractions.length +
      input.untokenizedValues.length;

    return {
      mode: "health",
      status: "ready",
      capabilities: input.capabilities,
      intelligence: input.intelligence,
      repository: input.repositoryStructure.summary,
      repositoryHeuristics: input.repositoryStructure.findings,
      intelligenceSignals: input.intelligenceSignals,
      unusedAbstractions: input.unusedAbstractions,
      competingImplementations: input.competingImplementations,
      missingAbstractions: input.missingAbstractions,
      untokenizedValues: input.untokenizedValues,
      metadata: {
        findingCount,
        ...input.semanticSummary
      }
    };
  }

  assembleLimited(
    input: Extract<KnowledgeConstructionResult, { status: "limited" }>
  ): RepositoryHealthResult {
    return {
      mode: "health",
      status: "limited",
      detectedLanguages: input.detectedLanguages,
      registeredExtractors: input.registeredExtractors,
      capabilities: input.capabilities,
      intelligence: limitedIntelligence(input.capabilities),
      repository: input.repositoryStructure.summary,
      repositoryHeuristics: input.repositoryStructure.findings,
      metadata: {
        findingCount: input.repositoryStructure.findings.length
      }
    };
  }
}

function limitedIntelligence(
  capabilities: CapabilityReport[]
): RepositoryIntelligenceReport {
  const areas = [
    area("repository-structure", "Repository Structure", "complete", "high", "built-in repository intelligence"),
    area("directory-topology", "Directory Topology", "complete", "high", "built-in repository intelligence"),
    area("duplicate-file-detection", "Duplicate File Detection", "complete", "high", "built-in repository intelligence"),
    area("naming-analysis", "Naming Analysis", "complete", "high", "built-in repository intelligence"),
    area(
      "declaration-analysis",
      "Declaration Analysis",
      hasAvailable(capabilities, "declaration-extraction") ? "partial" : "unavailable",
      hasAvailable(capabilities, "declaration-extraction") ? "medium" : "not-available",
      hasAvailable(capabilities, "declaration-extraction")
        ? "generic declaration provider"
        : "no declaration knowledge provider installed"
    ),
    area("relationship-analysis", "Relationship Analysis", "unavailable", "not-available", "no relationship knowledge provider installed"),
    area("ui-semantics", "UI Semantics", "unavailable", "not-available", "no UI knowledge provider installed"),
    area("framework-intelligence", "Framework Intelligence", "unavailable", "not-available", "no framework knowledge provider installed")
  ];

  return intelligenceFromAreas(areas, [
    { id: "built-in", name: "Built-in Repository Intelligence" }
  ]);
}

function hasAvailable(capabilities: CapabilityReport[], id: string): boolean {
  return capabilities.some(
    (capability) => capability.id === id && capability.status === "available"
  );
}

function area(
  id: string,
  name: string,
  coverage: RepositoryIntelligenceReport["areas"][number]["coverage"],
  confidence: RepositoryIntelligenceReport["areas"][number]["confidence"],
  reason: string
): RepositoryIntelligenceReport["areas"][number] {
  return { id, name, coverage, confidence, reason };
}

function intelligenceFromAreas(
  areas: RepositoryIntelligenceReport["areas"],
  providers: RepositoryIntelligenceReport["providers"]
): RepositoryIntelligenceReport {
  return {
    areas,
    unavailable: areas
      .filter((entry) => entry.coverage === "unavailable")
      .map((entry) => ({ name: entry.name, reason: entry.reason })),
    providers
  };
}
