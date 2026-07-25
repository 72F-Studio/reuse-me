import { CandidateDiscovery } from "../analysis/candidateDiscovery";
import { CandidateRanker } from "../analysis/candidateRanker";
import { CompetingImplementationDetector } from "../analysis/competingImplementationDetector";
import { ConfidenceCalculator } from "../analysis/confidenceCalculator";
import { MissingAbstractionDetector } from "../analysis/missingAbstractionDetector";
import { RepositoryHealthResultAssembler } from "../analysis/repositoryHealthResultAssembler";
import { RepositoryPatternDetector } from "../analysis/repositoryPatternDetector";
import { RoleAnalyzer } from "../analysis/roleAnalyzer";
import { SimilarityScorer } from "../analysis/similarityScorer";
import {
  UnusedAbstractionDetector,
  hasReliableGraph
} from "../analysis/unusedAbstractionDetector";
import { UntokenizedValueDetector } from "../analysis/untokenizedValueDetector";
import { findDesignTokens } from "../analysis/designTokenSource";
import type { CapabilityReport } from "../model/capability";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type {
  RepositoryIntelligenceReport,
  RepositoryHealthResult,
  IntelligenceSignalSummary
} from "../model/repositoryHealthResult";
import type { RepositoryStructureAnalysis } from "../model/repositoryStructure";

// Runs repository health mode from shared repository knowledge.
// This runner has no Git diff dependency.
export class RepositoryHealthRunner {
  constructor(
    private readonly roleAnalyzer = new RoleAnalyzer(),
    private readonly candidateDiscovery = new CandidateDiscovery(),
    private readonly patternDetector = new RepositoryPatternDetector(),
    private readonly similarityScorer = new SimilarityScorer(),
    private readonly ranker = new CandidateRanker(),
    private readonly confidenceCalculator = new ConfidenceCalculator(),
    private readonly unusedDetector = new UnusedAbstractionDetector(),
    private readonly competingDetector = new CompetingImplementationDetector(),
    private readonly missingDetector = new MissingAbstractionDetector(),
    private readonly untokenizedDetector = new UntokenizedValueDetector(),
    private readonly resultAssembler = new RepositoryHealthResultAssembler()
  ) {}

  run(
    knowledge: RepositoryKnowledge,
    input: {
      capabilities: CapabilityReport[];
      repositoryStructure: RepositoryStructureAnalysis;
    }
  ): RepositoryHealthResult {
    const roles = this.roleAnalyzer.analyze(knowledge);
    const candidates = this.candidateDiscovery.discover(knowledge, roles);
    const patterns = this.patternDetector.detect(knowledge, roles);
    const similarities = this.similarityScorer.score(
      patterns,
      candidates,
      knowledge
    );
    const rankings = this.ranker.rank(similarities, roles, knowledge.usage());
    const confidence = this.confidenceCalculator.calculate(rankings, patterns);

    return this.resultAssembler.assemble({
      capabilities: input.capabilities,
      intelligence: repositoryIntelligence(knowledge, input.capabilities),
      repositoryStructure: input.repositoryStructure,
      semanticSummary: semanticSummary(knowledge),
      intelligenceSignals: intelligenceSignals(knowledge),
      unusedAbstractions: this.unusedDetector.detect(
        knowledge,
        roles,
        candidates
      ),
      competingImplementations: this.competingDetector.detect(
        knowledge.context,
        patterns,
        rankings,
        confidence
      ),
      missingAbstractions: this.missingDetector.detect(
        knowledge.context,
        patterns,
        confidence
      ),
      untokenizedValues: this.untokenizedDetector.detect(
        knowledge,
        findDesignTokens(knowledge.context)
      )
    });
  }
}

function intelligenceSignals(knowledge: RepositoryKnowledge): IntelligenceSignalSummary {
  return {
    topReferencedFiles: knowledge
      .usage()
      .filter((usage) => usage.fileReferenceCount > 0)
      .sort((a, b) => b.fileReferenceCount - a.fileReferenceCount || a.path.localeCompare(b.path))
      .slice(0, 10)
      .map((usage) => ({
        path: usage.path,
        referenceCount: usage.fileReferenceCount,
        topDeclarations: usage.declarationReferences
          .filter((declaration) => declaration.referenceCount > 0)
          .sort(
            (a, b) =>
              b.referenceCount - a.referenceCount || a.name.localeCompare(b.name)
          )
          .slice(0, 5)
      })),
    unresolvedImports: unresolvedImportSignals(knowledge),
    duplicateDeclarations: duplicateDeclarationSignals(knowledge)
  };
}

function unresolvedImportSignals(
  knowledge: RepositoryKnowledge
): IntelligenceSignalSummary["unresolvedImports"] {
  const importersBySource = new Map<string, Set<string>>();
  const localPrefixes = localModulePrefixes(knowledge);

  for (const relationship of knowledge.relationships()) {
    if (
      relationship.resolution !== "unresolved" ||
      !isLocalSourceModule(relationship.sourceModule, localPrefixes)
    ) {
      continue;
    }

    const importers = importersBySource.get(relationship.sourceModule) ?? new Set();
    importers.add(relationship.importerPath);
    importersBySource.set(relationship.sourceModule, importers);
  }

  return [...importersBySource.entries()]
    .map(([sourceModule, importers]) => ({
      sourceModule,
      importerCount: importers.size,
      sampleImporters: [...importers].sort().slice(0, 5)
    }))
    .sort(
      (a, b) =>
        b.importerCount - a.importerCount ||
        a.sourceModule.localeCompare(b.sourceModule)
    )
    .slice(0, 10);
}

function localModulePrefixes(knowledge: RepositoryKnowledge): Set<string> {
  const prefixes = new Set<string>();

  for (const facts of knowledge.allFacts()) {
    const normalizedPath = facts.path.replaceAll("\\", "/");
    const sourcePath = normalizedPath.replace(
      /^(?:[^/]+\/)?src\/(?:main|test|androidTest|commonMain|commonTest)\/(?:java|kotlin|swift|dart|python|go|rust|js|ts)\//u,
      ""
    );
    const parts = sourcePath.split("/");

    if (parts.length >= 2) {
      prefixes.add(`${parts[0]}.${parts[1]}`);
    }

    if (parts.length >= 1 && !parts[0].includes(".")) {
      prefixes.add(parts[0]);
    }
  }

  return prefixes;
}

function isLocalSourceModule(
  sourceModule: string,
  localPrefixes: Set<string>
): boolean {
  if (sourceModule.startsWith(".") || sourceModule.startsWith("/")) {
    return true;
  }

  return [...localPrefixes].some(
    (prefix) => sourceModule === prefix || sourceModule.startsWith(`${prefix}.`)
  );
}

function duplicateDeclarationSignals(
  knowledge: RepositoryKnowledge
): IntelligenceSignalSummary["duplicateDeclarations"] {
  const pathsByName = new Map<string, Set<string>>();

  for (const facts of knowledge.allFacts()) {
    for (const declaration of facts.declarations) {
      if (declaration.name === undefined || declaration.name.length < 3) {
        continue;
      }

      const paths = pathsByName.get(declaration.name) ?? new Set();
      paths.add(facts.path);
      pathsByName.set(declaration.name, paths);
    }
  }

  return [...pathsByName.entries()]
    .map(([name, paths]) => ({
      name,
      samplePaths: [...paths].sort().slice(0, 5),
      pathCount: paths.size
    }))
    .filter((entry) => entry.pathCount > 1)
    .sort(
      (a, b) => b.pathCount - a.pathCount || a.name.localeCompare(b.name)
    )
    .slice(0, 10);
}

function repositoryIntelligence(
  knowledge: RepositoryKnowledge,
  capabilities: CapabilityReport[]
): RepositoryIntelligenceReport {
  const relationships = knowledge.relationships();
  const resolvedRelationships = relationships.filter(
    (entry) => entry.resolution === "resolved"
  ).length;
  const relationshipQuality = relationshipIntelligenceQuality(
    relationships.length,
    resolvedRelationships,
    hasAvailable(capabilities, "declaration-extraction")
  );
  const hasDeclarationProvider = hasAvailable(
    capabilities,
    "declaration-extraction"
  );
  const hasUiProvider = hasAvailable(capabilities, "ui-extraction");
  const areas: RepositoryIntelligenceReport["areas"] = [
    area("repository-structure", "Repository Structure", "complete", "high", "built-in repository intelligence"),
    area("directory-topology", "Directory Topology", "complete", "high", "built-in repository intelligence"),
    area("duplicate-file-detection", "Duplicate File Detection", "complete", "high", "built-in repository intelligence"),
    area("naming-analysis", "Naming Analysis", "complete", "high", "built-in repository intelligence"),
    area(
      "declaration-analysis",
      "Declaration Analysis",
      hasDeclarationProvider ? "partial" : "unavailable",
      hasDeclarationProvider ? "medium" : "not-available",
      providerReason(capabilities, "declaration-extraction", "no declaration knowledge provider installed")
    ),
    area(
      "relationship-analysis",
      "Relationship Analysis",
      relationshipQuality.coverage,
      relationshipQuality.confidence,
      relationships.length === 0
        ? "no imports requiring relationship resolution"
        : `${resolvedRelationships}/${relationships.length} repository-local import relationships resolved`
    ),
    area(
      "ui-semantics",
      "UI Semantics",
      hasUiProvider ? "partial" : "unavailable",
      hasUiProvider ? "medium" : "not-available",
      providerReason(capabilities, "ui-extraction", "no UI knowledge provider installed")
    ),
    area(
      "framework-intelligence",
      "Framework Intelligence",
      hasUiProvider ? "partial" : "unavailable",
      hasUiProvider ? "medium" : "not-available",
      hasUiProvider
        ? "framework-specific UI provider contributed facts"
        : "no framework knowledge provider installed"
    ),
    // Reported as its own area because suppressing the analysis silently is
    // the same false-negative the tool exists to avoid: "no unused
    // abstractions" and "cannot tell whether abstractions are unused" are very
    // different statements to hand an agent.
    area(
      "unused-abstraction-analysis",
      "Unused Abstraction Analysis",
      hasReliableGraph(knowledge) ? "partial" : "unavailable",
      hasReliableGraph(knowledge) ? "medium" : "not-available",
      hasReliableGraph(knowledge)
        ? "import graph resolves enough references to judge usage"
        : relationships.length === 0
          ? "no resolvable imports, so zero references is not evidence of disuse"
          : `only ${resolvedRelationships}/${relationships.length} imports resolved, so zero references is not evidence of disuse`
    )
  ];

  return {
    areas,
    unavailable: areas
      .filter((entry) => entry.coverage === "unavailable")
      .map((entry) => ({ name: entry.name, reason: entry.reason })),
    providers: knowledgeProviders(capabilities)
  };
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

function relationshipIntelligenceQuality(
  relationshipCount: number,
  resolvedRelationshipCount: number,
  hasDeclarationProvider: boolean
): {
  coverage: RepositoryIntelligenceReport["areas"][number]["coverage"];
  confidence: RepositoryIntelligenceReport["areas"][number]["confidence"];
} {
  if (!hasDeclarationProvider) {
    return { coverage: "unavailable", confidence: "not-available" };
  }

  if (relationshipCount === 0) {
    return { coverage: "complete", confidence: "high" };
  }

  const ratio = resolvedRelationshipCount / relationshipCount;

  if (ratio >= 0.8) {
    return { coverage: "complete", confidence: "high" };
  }

  if (ratio >= 0.4) {
    return { coverage: "partial", confidence: "medium" };
  }

  return { coverage: "partial", confidence: "low" };
}

function hasAvailable(capabilities: CapabilityReport[], id: string): boolean {
  return capabilities.some(
    (capability) => capability.id === id && capability.status === "available"
  );
}

function providerReason(
  capabilities: CapabilityReport[],
  id: string,
  fallback: string
): string {
  const capability = capabilities.find((entry) => entry.id === id);

  return capability?.status === "available"
    ? `${capability.reason} knowledge provider`
    : fallback;
}

function knowledgeProviders(
  capabilities: CapabilityReport[]
): RepositoryIntelligenceReport["providers"] {
  const providers = new Map<string, string>([
    ["built-in", "Built-in Repository Intelligence"]
  ]);

  for (const capability of capabilities) {
    if (capability.status !== "available" || capability.reason === "built-in") {
      continue;
    }

    // An area can be contributed by several providers at once, so the reason
    // carries a comma-separated list rather than a single provider name.
    for (const name of capability.reason.split(", ")) {
      providers.set(providerId(name), name);
    }
  }

  return [...providers.entries()].map(([id, name]) => ({ id, name }));
}

function providerId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
}

function semanticSummary(knowledge: RepositoryKnowledge): {
  declarationCount: number;
  importCount: number;
  relationshipCount: number;
  resolvedRelationshipCount: number;
  referencedFileCount: number;
} {
  const facts = knowledge.allFacts();
  const relationships = knowledge.relationships();

  return {
    declarationCount: facts.reduce(
      (count, fact) => count + fact.declarations.length,
      0
    ),
    importCount: facts.reduce((count, fact) => count + fact.imports.length, 0),
    relationshipCount: relationships.length,
    resolvedRelationshipCount: relationships.filter(
      (relationship) => relationship.resolution === "resolved"
    ).length,
    referencedFileCount: knowledge.usage().filter(
      (usage) => usage.fileReferenceCount > 0
    ).length
  };
}
