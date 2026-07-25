#!/usr/bin/env node

// src/cli.ts
import { Command } from "commander";

// package.json
var version = "0.1.0";

// src/git/diffReader.ts
import { execFileSync } from "child_process";
var GitChangedFileProvider = class {
  constructor(runCommand = execFileSync) {
    this.runCommand = runCommand;
  }
  runCommand;
  getChangedFiles(context) {
    const output = this.runCommand(
      "git",
      ["diff", "--name-status", "--find-renames"],
      {
        cwd: context.rootPath,
        encoding: "utf8"
      }
    );
    return parseGitNameStatus(output);
  }
};
function parseGitNameStatus(output) {
  const trimmed = output.trim();
  if (trimmed === "") {
    return [];
  }
  return trimmed.split("\n").filter((line) => line.trim() !== "").map(parseGitNameStatusLine);
}
function parseGitNameStatusLine(line) {
  const parts = line.split("	");
  const rawStatus = parts[0];
  if (rawStatus.startsWith("A") && parts.length >= 2) {
    return {
      path: parts[1],
      status: "added"
    };
  }
  if (rawStatus.startsWith("M") && parts.length >= 2) {
    return {
      path: parts[1],
      status: "modified"
    };
  }
  if (rawStatus.startsWith("D") && parts.length >= 2) {
    return {
      path: parts[1],
      status: "deleted"
    };
  }
  if (rawStatus.startsWith("R") && parts.length >= 3) {
    return {
      path: parts[2],
      status: "renamed",
      previousPath: parts[1]
    };
  }
  throw new Error(`Unsupported git diff status line: ${line}`);
}

// src/reporter/jsonReporter.ts
var JsonReporter = class {
  render(result) {
    return JSON.stringify(result, null, 2);
  }
};

// src/reporter/markdownReporter.ts
var MarkdownReporter = class {
  render(result) {
    return result.mode === "change" ? renderChange(result) : renderHealth(result);
  }
};
function renderChange(result) {
  if (result.warnings.length === 0) {
    return "## Change Analysis\n\nNo source-of-truth warnings.\n";
  }
  return [
    "## Change Analysis",
    "",
    "| Changed Files | Candidate | Confidence |",
    "|---|---|---|",
    ...result.warnings.map(
      (warning) => `| ${warning.changedFiles.join(", ")} | ${warning.candidatePath} (${warning.candidateName}) | ${warning.confidence} |`
    ),
    ""
  ].join("\n");
}
function renderHealth(result) {
  const lines = [
    "## RRR Health",
    "",
    "### Repository Intelligence",
    "",
    ...result.status === "limited" ? [
      `Detected languages: ${formatLanguages(result.detectedLanguages)}.`,
      "",
      `Registered knowledge providers: ${formatProviders(result.registeredExtractors)}.`,
      ""
    ] : [],
    ...formatIntelligence(result.intelligence),
    "",
    `Repository data: ${formatRepository(result.repository)}.`,
    "",
    ...result.status === "ready" ? [
      `Knowledge data: ${result.metadata.declarationCount} declarations, ${result.metadata.importCount} imports, ${result.metadata.resolvedRelationshipCount}/${result.metadata.relationshipCount} resolved relationships, ${result.metadata.referencedFileCount} referenced files.`,
      "",
      "### Intelligence Signals",
      "",
      ...formatIntelligenceSignals(result.intelligenceSignals),
      ""
    ] : [],
    "### Findings",
    "",
    ...result.metadata.findingCount === 0 ? ["No repository health findings."] : [
      ...formatRepositoryHeuristics(result.repositoryHeuristics),
      ...result.status === "ready" ? [
        ...result.unusedAbstractions.map(
          (finding) => `- Unused abstraction: ${finding.candidatePath} (${finding.candidateName})`
        ),
        ...result.competingImplementations.map(
          (finding) => `- Competing implementation: ${finding.sourcePaths.join(", ")} -> ${finding.candidatePath} (${finding.candidateName}), confidence ${finding.confidence}`
        ),
        ...result.missingAbstractions.map(
          (finding) => `- Missing abstraction: repeated pattern in ${finding.sourcePaths.join(", ")}`
        )
      ] : []
    ],
    ""
  ];
  return lines.join("\n");
}
function formatIntelligenceSignals(insights) {
  const lines = [
    ...insights.topReferencedFiles.slice(0, 5).map(
      (signal) => `- Top referenced file: ${signal.path} (${signal.referenceCount} references)`
    ),
    ...insights.unresolvedImports.slice(0, 5).map(
      (signal) => `- Unresolved import hotspot: ${signal.sourceModule} (${signal.importerCount} importers)`
    ),
    ...insights.duplicateDeclarations.slice(0, 5).map(
      (signal) => `- Duplicate declaration: ${signal.name} (${signal.paths.length} files)`
    )
  ];
  return lines.length === 0 ? ["No intelligence signals."] : lines;
}
function formatIntelligence(intelligence) {
  return [
    "#### Knowledge Sources",
    "",
    ...intelligence.areas.map(
      (area3) => `- ${coverageSymbol(area3.coverage)} ${area3.name}: ${area3.coverage}`
    ),
    "",
    "#### Confidence",
    "",
    ...intelligence.areas.map(
      (area3) => `- ${area3.name}: ${area3.confidence}`
    ),
    "",
    `Knowledge providers: ${intelligence.providers.map((provider) => provider.name).join(", ")}.`,
    "",
    ...intelligence.unavailable.length === 0 ? [] : [
      "#### Unavailable Intelligence",
      "",
      ...intelligence.unavailable.map(
        (entry) => `- ${entry.name}: ${entry.reason}`
      ),
      ""
    ]
  ];
}
function coverageSymbol(coverage) {
  if (coverage === "complete") {
    return "[ok]";
  }
  if (coverage === "partial") {
    return "[partial]";
  }
  return "[none]";
}
function formatRepositoryHeuristics(findings) {
  return findings.map(
    (finding) => `- Repository heuristic: ${finding.title}: ${finding.paths.join(", ")}`
  );
}
function formatRepository(repository) {
  return `${repository.rootPath}: ${repository.fileCount} files, ${repository.sourceFileCount} source files, ${repository.directoryCount} directories`;
}
function formatLanguages(languages) {
  if (languages.length === 0) {
    return "unknown";
  }
  return languages.map((language) => language.name).join(", ");
}
function formatProviders(extractors) {
  if (extractors.length === 0) {
    return "none";
  }
  return extractors.map(
    (extractor) => `${extractor.name} (${extractor.languages.map((language) => language.name).join(", ")})`
  ).join("; ");
}

// src/reporter/textReporter.ts
var TextReporter = class {
  render(result) {
    return result.mode === "change" ? renderChange2(result) : renderHealth2(result);
  }
};
function renderChange2(result) {
  if (result.warnings.length === 0) {
    return "No source-of-truth warnings.";
  }
  return result.warnings.map(
    (warning) => `Source-of-truth warning: ${warning.changedFiles.join(", ")} -> ${warning.candidatePath} (${warning.candidateName}), confidence ${warning.confidence}`
  ).join("\n");
}
function renderHealth2(result) {
  const lines = result.status === "limited" ? [
    "RRR Health",
    "Repository Intelligence",
    `Detected languages: ${formatLanguages2(result.detectedLanguages)}.`,
    `Registered knowledge providers: ${formatProviders2(result.registeredExtractors)}.`
  ] : ["RRR Health", "Repository Intelligence"];
  lines.push(
    ...formatIntelligence2(result.intelligence),
    `Repository data: ${formatRepository2(result.repository)}.`
  );
  if (result.status === "ready") {
    lines.push(
      `Knowledge data: ${result.metadata.declarationCount} declarations, ${result.metadata.importCount} imports, ${result.metadata.resolvedRelationshipCount}/${result.metadata.relationshipCount} resolved relationships, ${result.metadata.referencedFileCount} referenced files.`
    );
    lines.push(...formatIntelligenceSignals2(result.intelligenceSignals));
  }
  if (result.metadata.findingCount === 0) {
    lines.push("No repository health findings.");
    return lines.join("\n");
  }
  lines.push(
    ...formatRepositoryHeuristics2(result.repositoryHeuristics),
    ...result.status === "ready" ? [
      ...result.unusedAbstractions.map(
        (finding) => `Unused abstraction: ${finding.candidatePath} (${finding.candidateName})`
      ),
      ...result.competingImplementations.map(
        (finding) => `Competing implementation: ${finding.sourcePaths.join(", ")} -> ${finding.candidatePath} (${finding.candidateName}), confidence ${finding.confidence}`
      ),
      ...result.missingAbstractions.map(
        (finding) => `Missing abstraction: repeated pattern in ${finding.sourcePaths.join(", ")}`
      )
    ] : []
  );
  return lines.join("\n");
}
function formatIntelligenceSignals2(insights) {
  return [
    ...take(insights.topReferencedFiles, 5).map(
      (signal) => `Top referenced file: ${signal.path} (${signal.referenceCount} references)`
    ),
    ...take(insights.unresolvedImports, 5).map(
      (signal) => `Unresolved import hotspot: ${signal.sourceModule} (${signal.importerCount} importers)`
    ),
    ...take(insights.duplicateDeclarations, 5).map(
      (signal) => `Duplicate declaration: ${signal.name} (${signal.paths.length} files)`
    )
  ];
}
function take(values, count) {
  return values.slice(0, count);
}
function formatRepositoryHeuristics2(findings) {
  return findings.map(
    (finding) => `Repository heuristic: ${finding.title}: ${finding.paths.join(", ")}`
  );
}
function formatRepository2(repository) {
  return `${repository.rootPath}: ${repository.fileCount} files, ${repository.sourceFileCount} source files, ${repository.directoryCount} directories`;
}
function formatIntelligence2(intelligence) {
  return [
    "Knowledge Sources",
    ...intelligence.areas.map(
      (area3) => `${coverageSymbol2(area3.coverage)} ${area3.name}: ${area3.coverage}`
    ),
    "Confidence",
    ...intelligence.areas.map(
      (area3) => `${area3.name}: ${area3.confidence}`
    ),
    `Knowledge providers: ${intelligence.providers.map((provider) => provider.name).join(", ")}.`,
    ...intelligence.unavailable.length === 0 ? [] : [
      "Unavailable Intelligence:",
      ...intelligence.unavailable.map(
        (entry) => `${entry.name}: ${entry.reason}`
      )
    ]
  ];
}
function coverageSymbol2(coverage) {
  if (coverage === "complete") {
    return "[ok]";
  }
  if (coverage === "partial") {
    return "[partial]";
  }
  return "[none]";
}
function formatLanguages2(languages) {
  if (languages.length === 0) {
    return "unknown";
  }
  return languages.map((language) => language.name).join(", ");
}
function formatProviders2(extractors) {
  if (extractors.length === 0) {
    return "none";
  }
  return extractors.map(
    (extractor) => `${extractor.name} (${extractor.languages.map((language) => language.name).join(", ")})`
  ).join("; ");
}

// src/analysis/repositoryHealthResultAssembler.ts
var RepositoryHealthResultAssembler = class {
  assemble(input) {
    const findingCount = input.repositoryStructure.findings.length + input.unusedAbstractions.length + input.competingImplementations.length + input.missingAbstractions.length;
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
      metadata: {
        findingCount,
        ...input.semanticSummary
      }
    };
  }
  assembleLimited(input) {
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
};
function limitedIntelligence(capabilities) {
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
      hasAvailable(capabilities, "declaration-extraction") ? "generic declaration provider" : "no declaration knowledge provider installed"
    ),
    area("relationship-analysis", "Relationship Analysis", "unavailable", "not-available", "no relationship knowledge provider installed"),
    area("ui-semantics", "UI Semantics", "unavailable", "not-available", "no UI knowledge provider installed"),
    area("framework-intelligence", "Framework Intelligence", "unavailable", "not-available", "no framework knowledge provider installed")
  ];
  return intelligenceFromAreas(areas, [
    { id: "built-in", name: "Built-in Repository Intelligence" }
  ]);
}
function hasAvailable(capabilities, id) {
  return capabilities.some(
    (capability) => capability.id === id && capability.status === "available"
  );
}
function area(id, name, coverage, confidence, reason) {
  return { id, name, coverage, confidence, reason };
}
function intelligenceFromAreas(areas, providers) {
  return {
    areas,
    unavailable: areas.filter((entry) => entry.coverage === "unavailable").map((entry) => ({ name: entry.name, reason: entry.reason })),
    providers
  };
}

// src/analysis/candidateDiscovery.ts
var CandidateDiscovery = class {
  discover(knowledge, roles) {
    const candidates = [];
    for (const facts of knowledge.allFacts()) {
      for (const declaration of facts.declarations) {
        if (declaration.name === void 0) {
          continue;
        }
        const role = findRole(roles, facts.path, declaration.name);
        const usage = knowledge.usageForPath(facts.path)?.declarationReferences.find((entry) => entry.name === declaration.name);
        if (role?.role !== "shared" && (usage?.referenceCount ?? 0) === 0) {
          continue;
        }
        candidates.push({
          path: facts.path,
          name: declaration.name,
          evidence: [
            ...role?.role === "shared" ? ["shared role"] : [],
            ...(usage?.referenceCount ?? 0) > 0 ? ["referenced declaration"] : []
          ]
        });
      }
    }
    return candidates.sort((a, b) => `${a.path}:${a.name}`.localeCompare(`${b.path}:${b.name}`));
  }
};
function findRole(roles, path, name) {
  return roles.find(
    (role) => role.scope === "declaration" && role.path === path && role.name === name
  );
}

// src/analysis/candidateRanker.ts
var CandidateRanker = class {
  rank(similarities, roles, usage) {
    const grouped = groupByPattern(similarities);
    const rankings = [];
    for (const [patternId, results] of grouped.entries()) {
      const sorted = [...results].sort((a, b) => compareResults(a, b, roles, usage));
      sorted.forEach((result, index) => {
        rankings.push({
          patternId,
          candidate: result.candidate,
          rank: index + 1,
          score: result.score,
          candidateFeatureCount: result.evidence.candidateFeatureCount,
          reasons: reasonsFor(result, roles, usage)
        });
      });
    }
    return rankings;
  }
};
function groupByPattern(similarities) {
  const grouped = /* @__PURE__ */ new Map();
  for (const similarity of similarities) {
    grouped.set(similarity.patternId, [
      ...grouped.get(similarity.patternId) ?? [],
      similarity
    ]);
  }
  return grouped;
}
function compareResults(left, right, roles, usage) {
  return right.score - left.score || usageCount(right, usage) - usageCount(left, usage) || roleWeight(right, roles) - roleWeight(left, roles) || `${left.candidate.path}:${left.candidate.name}`.localeCompare(
    `${right.candidate.path}:${right.candidate.name}`
  );
}
function reasonsFor(result, roles, usage) {
  return [
    "similarity score",
    ...usageCount(result, usage) > 0 ? ["usage evidence"] : [],
    ...roleWeight(result, roles) > 0 ? ["shared role"] : []
  ];
}
function usageCount(result, usage) {
  return usage.find((usageFact) => usageFact.path === result.candidate.path)?.fileReferenceCount ?? 0;
}
function roleWeight(result, roles) {
  return roles.some(
    (role) => role.path === result.candidate.path && role.role === "shared" && (role.name === void 0 || role.name === result.candidate.name)
  ) ? 1 : 0;
}

// src/analysis/changedFactsProjector.ts
var ChangedFactsProjector = class {
  project(knowledge, changedFiles, changedArtifacts) {
    const artifactsByPath = new Map(
      changedArtifacts.map((artifact) => [artifact.path, artifact])
    );
    return changedFiles.filter((changedFile) => artifactsByPath.has(changedFile.path)).map((changedFile) => ({
      path: changedFile.path,
      status: changedFile.status,
      artifact: artifactsByPath.get(changedFile.path),
      facts: knowledge.factsForPath(changedFile.path)
    }));
  }
};

// src/analysis/changedPatternDetector.ts
var ChangedPatternDetector = class {
  detect(changedFacts, roles) {
    const localChanges = changedFacts.filter(
      (changed) => changed.facts !== void 0 && changed.status !== "deleted" && isLocalPath(changed.path, roles)
    );
    if (localChanges.length < 2) {
      return [];
    }
    const repeatedFeatures = repeatedByName(
      localChanges.flatMap(
        (changed) => changed.facts?.features.filter((feature) => isPatternFeature(feature)) ?? []
      ),
      featureIdentity
    );
    if (repeatedFeatures.length === 0) {
      return [];
    }
    return [
      {
        id: "changed-pattern-1",
        sourcePaths: localChanges.map((changed) => changed.path).sort(),
        features: repeatedFeatures,
        names: []
      }
    ];
  }
};
function isPatternFeature(feature) {
  return feature.category === "structure" || feature.category === "style";
}
function featureIdentity(feature) {
  return `${feature.category}:${feature.key}:${feature.value}`;
}
function isLocalPath(path, roles) {
  return roles.some(
    (role) => role.scope === "file" && role.path === path && role.role === "local"
  );
}
function repeatedByName(values, nameFor) {
  const counts = /* @__PURE__ */ new Map();
  for (const value of values) {
    const name = nameFor(value);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const seen = /* @__PURE__ */ new Set();
  const repeated = [];
  for (const value of values) {
    const name = nameFor(value);
    if ((counts.get(name) ?? 0) > 1 && !seen.has(name)) {
      seen.add(name);
      repeated.push(value);
    }
  }
  return repeated;
}

// src/analysis/changeAnalysisResultAssembler.ts
var ChangeAnalysisResultAssembler = class {
  assemble(changedFacts, warnings) {
    return {
      mode: "change",
      warnings,
      metadata: {
        changedFileCount: changedFacts.length,
        warningCount: warnings.length
      }
    };
  }
};

// src/analysis/confidenceCalculator.ts
var ConfidenceCalculator = class {
  calculate(rankings, patterns) {
    const grouped = groupByPattern2(rankings);
    const scores = [];
    for (const [patternId, patternRankings] of grouped.entries()) {
      const top = patternRankings.find((ranking) => ranking.rank === 1);
      if (top === void 0) {
        continue;
      }
      const runnerUp = patternRankings.find((ranking) => ranking.rank === 2);
      const pattern = patterns.find((entry) => entry.id === patternId);
      const ambiguityPenalty = runnerUp !== void 0 && top.score - runnerUp.score < 0.15 ? 0.2 : 0;
      const weakPatternPenalty = pattern !== void 0 && pattern.sourcePaths.length < 2 ? 0.2 : 0;
      const thinCandidatePenalty = top.candidateFeatureCount < 2 ? 0.3 : 0;
      const score = clamp(
        top.score - ambiguityPenalty - weakPatternPenalty - thinCandidatePenalty
      );
      scores.push({
        patternId,
        candidatePath: top.candidate.path,
        candidateName: top.candidate.name,
        score,
        reasons: [
          ...top.reasons,
          ...ambiguityPenalty > 0 ? ["ambiguous candidates"] : [],
          ...weakPatternPenalty > 0 ? ["weak pattern evidence"] : [],
          ...thinCandidatePenalty > 0 ? ["thin candidate evidence"] : []
        ]
      });
    }
    return scores;
  }
};
function groupByPattern2(rankings) {
  const grouped = /* @__PURE__ */ new Map();
  for (const ranking of rankings) {
    grouped.set(ranking.patternId, [
      ...grouped.get(ranking.patternId) ?? [],
      ranking
    ]);
  }
  return grouped;
}
function clamp(value) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}

// src/analysis/roleAnalyzer.ts
var RoleAnalyzer = class {
  analyze(knowledge) {
    const roles = [];
    const graphCarriesSignal = hasResolvedRelationships(knowledge);
    for (const facts of knowledge.allFacts()) {
      const usage = knowledge.usageForPath(facts.path);
      const fileRole = fileRoleForPath(
        knowledge,
        facts.path,
        usage?.fileReferenceCount ?? 0,
        graphCarriesSignal
      );
      roles.push(fileRole);
      for (const declaration of facts.declarations) {
        if (declaration.name === void 0) {
          continue;
        }
        roles.push({
          scope: "declaration",
          path: facts.path,
          name: declaration.name,
          role: fileRole.role,
          reasons: fileRole.reasons
        });
      }
    }
    return roles.sort(
      (a, b) => `${a.path}:${a.name ?? ""}`.localeCompare(`${b.path}:${b.name ?? ""}`)
    );
  }
};
function hasResolvedRelationships(knowledge) {
  return knowledge.relationships().some((relationship) => relationship.resolution === "resolved");
}
function fileRoleForPath(knowledge, path, referenceCount, graphCarriesSignal) {
  const artifact = knowledge.artifactForPath(path);
  const hasSharedHint = artifact?.roleHints.some((hint) => hint.role === "shared") ?? false;
  const hasLocalHint = artifact?.roleHints.some((hint) => hint.role === "local") ?? false;
  const sharedReasons = artifact?.roleHints.filter((hint) => hint.role === "shared").map((hint) => hint.reason) ?? [];
  const localReasons = artifact?.roleHints.filter((hint) => hint.role === "local").map((hint) => hint.reason) ?? [];
  if (hasSharedHint && !hasLocalHint) {
    return {
      scope: "file",
      path,
      role: "shared",
      reasons: sharedReasons
    };
  }
  if (hasLocalHint && referenceCount < 2) {
    return {
      scope: "file",
      path,
      role: "local",
      reasons: localReasons
    };
  }
  if (referenceCount >= 2 && !hasLocalHint) {
    return {
      scope: "file",
      path,
      role: "shared",
      reasons: ["referenced by multiple files"]
    };
  }
  if (hasLocalHint && referenceCount >= 2) {
    return {
      scope: "file",
      path,
      role: "unknown",
      reasons: [...localReasons, "referenced by multiple files"]
    };
  }
  if (graphCarriesSignal && referenceCount === 0) {
    return {
      scope: "file",
      path,
      role: "local",
      reasons: ["no repository file imports this"]
    };
  }
  return {
    scope: "file",
    path,
    role: "unknown",
    reasons: []
  };
}

// src/analysis/similarityScorer.ts
var SimilarityScorer = class {
  score(patterns, candidates, knowledge) {
    const results = [];
    for (const pattern of patterns) {
      for (const candidate of candidates) {
        const facts = knowledge.factsForPath(candidate.path);
        const candidateStructure = featureIds(facts?.features ?? [], "structure");
        const candidateStyle = featureIds(facts?.features ?? [], "style");
        const evidence = {
          structureOverlap: containment(
            candidateStructure,
            featureIds(pattern.features, "structure")
          ),
          styleOverlap: containment(
            candidateStyle,
            featureIds(pattern.features, "style")
          ),
          candidateFeatureCount: (/* @__PURE__ */ new Set([
            ...candidateStructure,
            ...candidateStyle
          ])).size,
          // Compared case-insensitively on purpose: local code that renders a
          // `button` element or constructs a `button` is evidence about a
          // shared component named `Button`.
          nameOverlap: pattern.names.some(
            (name) => name.toLowerCase() === candidate.name.toLowerCase()
          ) ? 1 : 0
        };
        results.push({
          patternId: pattern.id,
          candidate,
          score: evidence.structureOverlap * 0.5 + evidence.styleOverlap * 0.3 + evidence.nameOverlap * 0.2,
          evidence
        });
      }
    }
    return results;
  }
};
function featureIds(features, category) {
  return features.filter((feature) => feature.category === category).map((feature) => `${feature.key}:${feature.value}`);
}
function containment(candidateFeatures, patternFeatures) {
  const candidateSet = new Set(candidateFeatures);
  const patternSet = new Set(patternFeatures);
  if (candidateSet.size === 0 || patternSet.size === 0) {
    return 0;
  }
  const shared = [...candidateSet].filter((value) => patternSet.has(value)).length;
  return shared / candidateSet.size;
}

// src/analysis/sourceOfTruthWarningGenerator.ts
var SourceOfTruthWarningGenerator = class {
  generate(context, patterns, rankings, confidenceScores, changedFacts) {
    const warnings = [];
    for (const confidence of confidenceScores) {
      if (confidence.score < context.config.warningThreshold) {
        continue;
      }
      const pattern = patterns.find((entry) => entry.id === confidence.patternId);
      const ranking = rankings.find(
        (entry) => entry.patternId === confidence.patternId && entry.rank === 1
      );
      if (pattern === void 0 || ranking === void 0) {
        continue;
      }
      warnings.push({
        changedFiles: pattern.sourcePaths.filter(
          (path) => changedFacts.some((changed) => changed.path === path)
        ),
        candidatePath: ranking.candidate.path,
        candidateName: ranking.candidate.name,
        confidence: confidence.score,
        evidence: confidence.reasons
      });
    }
    return warnings;
  }
};

// src/runner/changeAnalysisRunner.ts
var ChangeAnalysisRunner = class {
  constructor(roleAnalyzer = new RoleAnalyzer(), candidateDiscovery = new CandidateDiscovery(), changedProjector = new ChangedFactsProjector(), patternDetector = new ChangedPatternDetector(), similarityScorer = new SimilarityScorer(), ranker = new CandidateRanker(), confidenceCalculator = new ConfidenceCalculator(), warningGenerator = new SourceOfTruthWarningGenerator(), resultAssembler = new ChangeAnalysisResultAssembler()) {
    this.roleAnalyzer = roleAnalyzer;
    this.candidateDiscovery = candidateDiscovery;
    this.changedProjector = changedProjector;
    this.patternDetector = patternDetector;
    this.similarityScorer = similarityScorer;
    this.ranker = ranker;
    this.confidenceCalculator = confidenceCalculator;
    this.warningGenerator = warningGenerator;
    this.resultAssembler = resultAssembler;
  }
  roleAnalyzer;
  candidateDiscovery;
  changedProjector;
  patternDetector;
  similarityScorer;
  ranker;
  confidenceCalculator;
  warningGenerator;
  resultAssembler;
  run(knowledge, changedFiles) {
    const changedArtifacts = changedFiles.map((changedFile) => knowledge.artifactForPath(changedFile.path)).filter((artifact) => artifact !== void 0);
    const roles = this.roleAnalyzer.analyze(knowledge);
    const candidates = this.candidateDiscovery.discover(knowledge, roles);
    const changedFacts = this.changedProjector.project(
      knowledge,
      changedFiles,
      changedArtifacts
    );
    const patterns = this.patternDetector.detect(changedFacts, roles);
    const similarities = this.similarityScorer.score(
      patterns,
      candidates,
      knowledge
    );
    const rankings = this.ranker.rank(similarities, roles, knowledge.usage());
    const confidence = this.confidenceCalculator.calculate(rankings, patterns);
    const warnings = this.warningGenerator.generate(
      knowledge.context,
      patterns,
      rankings,
      confidence,
      changedFacts
    );
    return this.resultAssembler.assemble(changedFacts, warnings);
  }
};

// src/discovery/languageDetector.ts
import { join, relative } from "path";

// src/fs/safeReaddir.ts
import { readdirSync } from "fs";
function readDirSafe(directory) {
  try {
    return readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}

// src/discovery/languageDetector.ts
var LANGUAGE_BY_EXTENSION = {
  ".kt": { id: "kotlin", name: "Kotlin" },
  ".kts": { id: "kotlin", name: "Kotlin" },
  ".java": { id: "java", name: "Java" },
  ".cs": { id: "csharp", name: "C#" },
  ".go": { id: "go", name: "Go" },
  ".rs": { id: "rust", name: "Rust" },
  ".py": { id: "python", name: "Python" },
  ".rb": { id: "ruby", name: "Ruby" },
  ".php": { id: "php", name: "PHP" },
  ".c": { id: "c", name: "C" },
  ".h": { id: "c", name: "C" },
  ".cc": { id: "cpp", name: "C++" },
  ".cpp": { id: "cpp", name: "C++" },
  ".cxx": { id: "cpp", name: "C++" },
  ".hpp": { id: "cpp", name: "C++" },
  ".scala": { id: "scala", name: "Scala" },
  ".tsx": { id: "typescript", name: "TypeScript" },
  ".ts": { id: "typescript", name: "TypeScript" },
  ".jsx": { id: "javascript", name: "JavaScript" },
  ".js": { id: "javascript", name: "JavaScript" },
  ".swift": { id: "swift", name: "Swift" },
  ".dart": { id: "dart", name: "Dart" },
  ".vue": { id: "vue", name: "Vue" }
};
var IGNORED_DIRECTORIES = /* @__PURE__ */ new Set([
  ".git",
  ".gradle",
  ".idea",
  "build",
  "dist",
  "node_modules"
]);
var LanguageDetector = class {
  detect(context) {
    const languages = /* @__PURE__ */ new Map();
    for (const path of walkFiles(context.rootPath, context.rootPath)) {
      const language = languageForPath(path);
      if (language !== void 0) {
        languages.set(language.id, language);
      }
    }
    return [...languages.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
};
function walkFiles(rootPath, directory) {
  const files = [];
  for (const entry of readDirSafe(directory)) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(rootPath, absolutePath));
    } else if (entry.isFile()) {
      files.push(relative(rootPath, absolutePath));
    }
  }
  return files;
}
function languageForPath(path) {
  const extension = Object.keys(LANGUAGE_BY_EXTENSION).find(
    (candidate) => path.endsWith(candidate)
  );
  return extension === void 0 ? void 0 : LANGUAGE_BY_EXTENSION[extension];
}

// src/extractors/generic-declarations/GenericDeclarationsExtractor.ts
import { readFileSync } from "fs";
import { basename, extname, join as join2, normalize, relative as relative2 } from "path";
import { dirname as posixDirname, join as posixJoin, normalize as posixNormalize } from "path/posix";

// src/discovery/roleHints.ts
function roleHintsForPath(context, path) {
  const normalizedPath = normalizePath(path);
  for (const directory of context.config.sharedSourceDirs) {
    if (normalizedPath.startsWith(`${normalizePath(directory)}/`)) {
      return [{ role: "shared", reason: "shared source directory" }];
    }
  }
  for (const directory of context.config.localSourceDirs) {
    if (normalizedPath.startsWith(`${normalizePath(directory)}/`)) {
      return [{ role: "local", reason: "local source directory" }];
    }
  }
  return hintsFromDirectoryNames(context, normalizedPath);
}
function hintsFromDirectoryNames(context, normalizedPath) {
  const shared = new Set(
    context.config.sharedDirNames.map((name) => name.toLowerCase())
  );
  const local = new Set(
    context.config.localDirNames.map((name) => name.toLowerCase())
  );
  const segments = normalizedPath.split("/").slice(0, -1).reverse();
  for (const segment of segments) {
    const name = segment.toLowerCase();
    if (shared.has(name)) {
      return [{ role: "shared", reason: `shared directory name "${segment}"` }];
    }
    if (local.has(name)) {
      return [{ role: "local", reason: `local directory name "${segment}"` }];
    }
  }
  return [];
}
function normalizePath(path) {
  return path.replaceAll("\\", "/");
}

// src/extractors/generic-declarations/genericFeatureExtractor.ts
var CONSTRUCTED_SYMBOL = /\b([A-Z][A-Za-z0-9_]*)\s*[({]/gu;
var HEX_COLOUR = /#[0-9a-fA-F]{3,8}\b/gu;
var PACKED_COLOUR = /\b0[xX][0-9a-fA-F]{6,8}\b/gu;
var DIMENSION = /\b\d+(?:\.\d+)?\.?(?:dp|sp|px|rem|em|pt|vh|vw)\b/gu;
var CLASS_ATTRIBUTE = /\b(?:class|className)\s*[:=]\s*["'`]([^"'`]{1,300})["'`]/gu;
function extractGenericFeatures(source, declaredNames = []) {
  const features = /* @__PURE__ */ new Map();
  const declared = new Set(declaredNames);
  const add2 = (feature) => {
    features.set(`${feature.category}:${feature.key}:${feature.value}`, feature);
  };
  for (const [, symbol] of source.matchAll(CONSTRUCTED_SYMBOL)) {
    if (!declared.has(symbol)) {
      add2({ category: "structure", key: "constructs", value: symbol });
    }
  }
  for (const [colour] of source.matchAll(HEX_COLOUR)) {
    add2({ category: "style", key: "color", value: colour.toLowerCase() });
  }
  for (const [colour] of source.matchAll(PACKED_COLOUR)) {
    add2({ category: "style", key: "color", value: colour.toLowerCase() });
  }
  for (const [dimension] of source.matchAll(DIMENSION)) {
    add2({ category: "style", key: "dimension", value: dimension.toLowerCase() });
  }
  for (const [, classList] of source.matchAll(CLASS_ATTRIBUTE)) {
    for (const className of classList.split(/\s+/u)) {
      if (className !== "") {
        add2({ category: "style", key: "className", value: className });
      }
    }
  }
  return [...features.values()];
}

// src/extractors/generic-declarations/GenericDeclarationsExtractor.ts
var LANGUAGES = [
  { id: "c", name: "C" },
  { id: "cpp", name: "C++" },
  { id: "csharp", name: "C#" },
  { id: "dart", name: "Dart" },
  { id: "go", name: "Go" },
  { id: "java", name: "Java" },
  { id: "javascript", name: "JavaScript" },
  { id: "kotlin", name: "Kotlin" },
  { id: "php", name: "PHP" },
  { id: "python", name: "Python" },
  { id: "ruby", name: "Ruby" },
  { id: "rust", name: "Rust" },
  { id: "scala", name: "Scala" },
  { id: "swift", name: "Swift" },
  { id: "typescript", name: "TypeScript" },
  { id: "vue", name: "Vue" }
];
var DESCRIPTOR = {
  id: "generic-declarations",
  name: "Generic Declaration Provider",
  languages: LANGUAGES,
  contributes: ["declaration-extraction"]
};
var IGNORED_DIRECTORIES2 = /* @__PURE__ */ new Set([
  ".agents",
  ".codex",
  ".git",
  ".gradle",
  ".idea",
  ".kotlin",
  ".next",
  ".artifacts",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target"
]);
var MANIFEST_FILENAMES = /* @__PURE__ */ new Set([
  "build.gradle",
  "build.gradle.kts",
  "package.json",
  "pom.xml",
  "pyproject.toml",
  "settings.gradle",
  "settings.gradle.kts"
]);
var SOURCE_EXTENSIONS = [
  ".c",
  ".cc",
  ".cpp",
  ".cs",
  ".cxx",
  ".dart",
  ".go",
  ".h",
  ".hpp",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".scala",
  ".swift",
  ".ts",
  ".tsx",
  ".vue"
];
var GenericDeclarationsExtractor = class {
  descriptor() {
    return DESCRIPTOR;
  }
  detect(context) {
    const sourceFiles = discoverSourceFiles(context);
    const detectedLanguages = uniqueLanguages(sourceFiles);
    return {
      supported: sourceFiles.length > 0,
      detectedLanguages,
      reason: sourceFiles.length > 0 ? void 0 : "No supported source files found for generic declaration extraction."
    };
  }
  extract(context) {
    const parsedFiles = discoverSourceFiles(context).map(
      (path) => parseFile(context, path)
    );
    return {
      artifacts: parsedFiles.map((file) => toArtifact(context, file)),
      facts: parsedFiles.map((file) => file.facts),
      relationships: analyzeRelationships(parsedFiles)
    };
  }
};
function discoverSourceFiles(context) {
  const files = [];
  function visit3(directory) {
    for (const entry of readDirSafe(directory)) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES2.has(entry.name)) {
        continue;
      }
      const absolutePath = join2(directory, entry.name);
      const repositoryPath = normalizePath2(relative2(context.rootPath, absolutePath));
      if (entry.isDirectory()) {
        visit3(absolutePath);
      } else if (entry.isFile() && isSupportedSourcePath(repositoryPath, context)) {
        files.push(repositoryPath);
      }
    }
  }
  visit3(context.rootPath);
  return files.sort();
}
function isSupportedSourcePath(path, context) {
  return languageForPath(path) !== void 0 && !path.endsWith(".d.ts") && !MANIFEST_FILENAMES.has(basename(path)) && !isIgnored(path, context.config.ignore);
}
function parseFile(context, path) {
  const language = languageForPath(path);
  if (language === void 0) {
    throw new Error(`Unsupported source file reached generic extractor: ${path}`);
  }
  const source = readFileSync(join2(context.rootPath, path), "utf8");
  const stripped = stripComments(source, language.id);
  const packageName = packageNameFor(path, stripped, language.id);
  const declarations = extractDeclarations(stripped, language.id);
  const declarationFacts = declarations.map((declaration) => ({
    kind: "declaration",
    name: declaration.name,
    visibility: visibilityFor(language.id, declaration)
  }));
  return {
    path,
    language,
    packageName,
    moduleName: moduleNameForPath(path),
    facts: {
      path,
      imports: extractImports(stripped, language.id),
      exports: declarationFacts.filter((declaration) => declaration.visibility === "exported").map(toExportFact),
      declarations: declarationFacts,
      features: extractGenericFeatures(
        stripped,
        declarations.map((declaration) => declaration.name)
      )
    }
  };
}
function extractImports(source, languageId) {
  switch (languageId) {
    case "python":
      return extractPythonImports(source);
    case "go":
      return extractGoImports(source);
    case "rust":
      return extractRustImports(source);
    case "dart":
      return extractDartImports(source);
    case "javascript":
    case "typescript":
      return extractJavaScriptImports(source);
    case "swift":
      return [...importsByRegex(source, /^\s*import\s+([A-Za-z_]\w*)/gmu)];
    case "c":
    case "cpp":
      return extractCIncludes(source);
    case "kotlin":
    case "java":
    case "scala":
      return extractDottedImports(source, /^\s*import\s+([A-Za-z_][\w.*]*)(?:\s+as\s+([A-Za-z_]\w*))?\s*;?/gmu);
    case "csharp":
      return extractDottedImports(source, /^\s*using\s+(?:static\s+)?([A-Za-z_][\w.]*)\s*;?/gmu);
    case "php":
      return extractDottedImports(source, /^\s*use\s+([A-Za-z_][\w\\]*)(?:\s+as\s+([A-Za-z_]\w*))?\s*;?/gmu, "\\");
    case "ruby":
      return importsByRegex(source, /^\s*require(?:_relative)?\s+["']([^"']+)["']/gmu);
    default:
      return [];
  }
}
function extractDeclarations(source, languageId) {
  const declarations = /* @__PURE__ */ new Map();
  for (const declaration of [
    ...classLikeDeclarations(source),
    ...functionLikeDeclarations(source, languageId),
    ...typeLikeDeclarations(source, languageId)
  ]) {
    declarations.set(declaration.name, declaration);
  }
  return [...declarations.values()].sort(
    (a, b) => a.name.localeCompare(b.name)
  );
}
function classLikeDeclarations(source) {
  return matches(
    source,
    /^\s*(?:public\s+|private\s+|internal\s+|protected\s+|open\s+|sealed\s+|data\s+|abstract\s+|final\s+|export\s+|pub\s+)*\b(?:class|interface|object|enum\s+class|enum|record|struct|protocol|trait|mixin|extension)\s+([A-Za-z_]\w*)/gmu
  );
}
function functionLikeDeclarations(source, languageId) {
  const patterns = [
    /^\s*(?:public\s+|private\s+|internal\s+|protected\s+|open\s+|suspend\s+|override\s+|export\s+|pub\s+)*fun\s+([A-Za-z_]\w*)/gmu,
    /^\s*(?:public\s+|private\s+|internal\s+|protected\s+|static\s+|async\s+|export\s+|pub\s+)*func\s+(?:\([^)]+\)\s*)?([A-Za-z_]\w*)/gmu,
    /^\s*(?:pub\s+|async\s+|unsafe\s+|const\s+)*fn\s+([A-Za-z_]\w*)/gmu,
    /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)/gmu,
    /^\s*function\s+([A-Za-z_]\w*)/gmu,
    /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_]\w*)/gmu
  ];
  if (languageId === "java" || languageId === "csharp") {
    patterns.push(
      /^\s*(?:public|private|protected|internal|static|final|virtual|override|async|\s)+[A-Za-z_<>,[\]?]+\s+([A-Za-z_]\w*)\s*\(/gmu
    );
  }
  return patterns.flatMap((pattern) => matches(source, pattern));
}
function typeLikeDeclarations(source, languageId) {
  const declarations = [
    ...matches(source, /^\s*(?:pub\s+)?type\s+([A-Za-z_]\w*)/gmu),
    ...matches(source, /^\s*(?:public\s+|private\s+|internal\s+)?typealias\s+([A-Za-z_]\w*)/gmu),
    ...matches(source, /^\s*typedef\s+([A-Za-z_]\w*)/gmu)
  ];
  if (languageId === "go") {
    declarations.push(
      ...matches(source, /^\s*(?:var|const)\s+([A-Za-z_]\w*)/gmu)
    );
  }
  return declarations;
}
function analyzeRelationships(files) {
  const resolver = new GenericRelationshipResolver(files);
  const relationships = [];
  for (const file of files) {
    for (const importFact of file.facts.imports) {
      const resolved = resolver.resolve(file, importFact);
      relationships.push({
        importerPath: file.path,
        sourceModule: importFact.sourceModule,
        importKind: importFact.kind,
        localName: importFact.localName,
        importedName: importFact.importedName,
        ...resolved
      });
    }
  }
  return relationships.sort(
    (a, b) => `${a.importerPath}:${a.sourceModule}:${a.localName}`.localeCompare(
      `${b.importerPath}:${b.sourceModule}:${b.localName}`
    )
  );
}
var GenericRelationshipResolver = class {
  filesByPath = /* @__PURE__ */ new Map();
  declarationsByQualifiedName = /* @__PURE__ */ new Map();
  modulesByName = /* @__PURE__ */ new Map();
  constructor(files) {
    for (const file of files) {
      this.filesByPath.set(file.path, file);
      append(this.modulesByName, file.moduleName, file);
      if (file.packageName !== void 0) {
        append(this.modulesByName, file.packageName, file);
      }
      for (const declaration of file.facts.declarations) {
        if (declaration.name === void 0) {
          continue;
        }
        for (const name of qualifiedNamesFor(file, declaration.name)) {
          append(this.declarationsByQualifiedName, name, file);
        }
      }
    }
  }
  resolve(importer, importFact) {
    if (importFact.importedName === "*") {
      return { resolution: "unresolved" };
    }
    const pathTarget = this.resolvePathImport(importer, importFact.sourceModule);
    if (pathTarget !== void 0) {
      return this.toResolvedRelationship(pathTarget, importFact);
    }
    const declarationTargets = this.resolveDeclarationImport(importFact);
    if (declarationTargets.length === 1) {
      return this.toResolvedRelationship(declarationTargets[0], importFact);
    }
    if (declarationTargets.length > 1) {
      return { resolution: "ambiguous" };
    }
    const moduleTargets = this.modulesByName.get(importFact.sourceModule) ?? [];
    if (moduleTargets.length === 1) {
      return this.toResolvedRelationship(moduleTargets[0], importFact);
    }
    return {
      resolution: moduleTargets.length > 1 ? "ambiguous" : "unresolved"
    };
  }
  resolvePathImport(importer, sourceModule) {
    if (!sourceModule.startsWith(".") && !sourceModule.startsWith("/")) {
      return void 0;
    }
    const basePath = sourceModule.startsWith("/") ? sourceModule.slice(1) : posixNormalize(posixJoin(posixDirname(importer.path), sourceModule));
    for (const candidate of candidatePathsForBase(basePath)) {
      const target = this.filesByPath.get(candidate);
      if (target !== void 0) {
        return target;
      }
    }
    return void 0;
  }
  resolveDeclarationImport(importFact) {
    const candidates = [
      importFact.sourceModule,
      ...importFact.importedName !== void 0 ? [`${importFact.sourceModule}.${importFact.importedName}`] : []
    ];
    return uniqueFiles(
      candidates.flatMap(
        (candidate) => this.declarationsByQualifiedName.get(candidate) ?? []
      )
    );
  }
  toResolvedRelationship(target, importFact) {
    const targetName = targetDeclarationName(target, importFact);
    return {
      resolution: "resolved",
      targetPath: target.path,
      targetExportName: targetName,
      targetDeclarationName: targetName
    };
  }
};
function uniqueLanguages(paths) {
  const languages = /* @__PURE__ */ new Map();
  for (const path of paths) {
    const language = languageForPath(path);
    if (language !== void 0) {
      languages.set(language.id, language);
    }
  }
  return [...languages.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function toArtifact(context, file) {
  return {
    path: file.path,
    language: file.language,
    extractorId: DESCRIPTOR.id,
    roleHints: roleHintsForPath(context, file.path)
  };
}
function toExportFact(declaration) {
  return {
    kind: "named",
    exportedName: declaration.name ?? "default",
    localName: declaration.name
  };
}
function visibilityFor(languageId, declaration) {
  if (/\b(private|internal)\b/u.test(declaration.line)) {
    return "local";
  }
  if (languageId === "go") {
    return /^[A-Z]/u.test(declaration.name) ? "exported" : "local";
  }
  if (languageId === "python" || languageId === "ruby") {
    return declaration.name.startsWith("_") ? "local" : "exported";
  }
  if (languageId === "rust") {
    return /\bpub\b/u.test(declaration.line) ? "exported" : "local";
  }
  return "exported";
}
function packageNameFor(path, source, languageId) {
  if (languageId === "python") {
    return moduleNameForPath(path);
  }
  if (languageId === "php") {
    return firstMatch(source, /^\s*namespace\s+([A-Za-z_][\w\\]*)\s*;/gmu)?.replaceAll("\\", ".");
  }
  if (languageId === "csharp") {
    return firstMatch(source, /^\s*namespace\s+([A-Za-z_][\w.]*)(?:\s*[;{])/gmu);
  }
  if (languageId === "go") {
    return firstMatch(source, /^\s*package\s+([A-Za-z_]\w*)/gmu);
  }
  if (languageId === "java" || languageId === "kotlin" || languageId === "scala") {
    return firstMatch(source, /^\s*package\s+([A-Za-z_][\w.]*)\s*;?/gmu);
  }
  return void 0;
}
function moduleNameForPath(path) {
  return stripKnownSourcePrefix(path).replace(/\.[^.]+$/u, "").replace(/\/(?:index|mod|__init__)$/u, "").replaceAll("/", ".");
}
function stripKnownSourcePrefix(path) {
  return path.replace(
    /^(?:[^/]+\/)?src\/(?:main|test|androidTest|commonMain|commonTest)\/(?:java|kotlin|swift|dart|python|go|rust|js|ts)\//u,
    ""
  );
}
function qualifiedNamesFor(file, name) {
  return [
    name,
    `${file.moduleName}.${name}`,
    ...file.packageName === void 0 ? [] : [`${file.packageName}.${name}`]
  ];
}
function targetDeclarationName(target, importFact) {
  const requestedName = importFact.importedName === void 0 || importFact.importedName === "*" ? lastName(importFact.sourceModule) : importFact.importedName;
  if (target.facts.declarations.some(
    (declaration) => declaration.name === requestedName
  )) {
    return requestedName;
  }
  if (target.facts.declarations.length === 1) {
    return target.facts.declarations[0].name;
  }
  return void 0;
}
function extractPythonImports(source) {
  const imports = [];
  for (const match of source.matchAll(/^\s*from\s+([A-Za-z_.][\w.]*)\s+import\s+([^\n]+)/gmu)) {
    const sourceModule = match[1];
    for (const part of match[2].split(",")) {
      const [, importedName, alias] = part.trim().match(/^([A-Za-z_]\w*|\*)(?:\s+as\s+([A-Za-z_]\w*))?$/u) ?? [];
      if (importedName !== void 0) {
        imports.push({
          sourceModule,
          kind: "named",
          localName: alias ?? importedName,
          importedName
        });
      }
    }
  }
  for (const match of source.matchAll(/^\s*import\s+([^\n]+)/gmu)) {
    for (const part of match[1].split(",")) {
      const [, sourceModule, alias] = part.trim().match(/^([A-Za-z_][\w.]*)(?:\s+as\s+([A-Za-z_]\w*))?$/u) ?? [];
      if (sourceModule !== void 0) {
        imports.push({
          sourceModule,
          kind: "namespace",
          localName: alias ?? lastName(sourceModule)
        });
      }
    }
  }
  return imports;
}
function extractGoImports(source) {
  const imports = [];
  const blockMatch = source.match(/^\s*import\s*\(([\s\S]*?)\)/mu);
  if (blockMatch !== null) {
    for (const line of blockMatch[1].split("\n")) {
      const importFact = parseGoImport(line);
      if (importFact !== void 0) {
        imports.push(importFact);
      }
    }
  }
  for (const match of source.matchAll(/^\s*import\s+([^\n]+)/gmu)) {
    const importFact = parseGoImport(match[1]);
    if (importFact !== void 0) {
      imports.push(importFact);
    }
  }
  return imports;
}
function parseGoImport(line) {
  const [, alias, sourceModule] = line.trim().match(/^(?:(\w+)\s+)?["']([^"']+)["']/u) ?? [];
  if (sourceModule === void 0) {
    return void 0;
  }
  return {
    sourceModule,
    kind: "namespace",
    localName: alias ?? lastName(sourceModule)
  };
}
function extractRustImports(source) {
  const imports = [];
  for (const match of source.matchAll(/^\s*use\s+([^;]+);/gmu)) {
    const sourceModule = match[1].trim().replaceAll("::", ".");
    if (sourceModule.includes("{")) {
      const [, prefix, names] = sourceModule.match(/^(.+)\.\{(.+)\}$/u) ?? [];
      if (prefix === void 0 || names === void 0) {
        continue;
      }
      for (const name of names.split(",")) {
        const importedName = name.trim();
        if (importedName !== "") {
          imports.push({
            sourceModule: prefix,
            kind: "named",
            localName: importedName,
            importedName
          });
        }
      }
      continue;
    }
    imports.push({
      sourceModule,
      kind: "named",
      localName: lastName(sourceModule),
      importedName: lastName(sourceModule)
    });
  }
  return imports;
}
function extractDartImports(source) {
  const imports = [];
  for (const match of source.matchAll(/^\s*import\s+["']([^"']+)["'](?:\s+as\s+([A-Za-z_]\w*))?/gmu)) {
    imports.push({
      sourceModule: match[1],
      kind: "namespace",
      localName: match[2] ?? basename(match[1], extname(match[1]))
    });
  }
  return imports;
}
function extractJavaScriptImports(source) {
  const imports = [];
  for (const match of source.matchAll(/^\s*import\s+(.+?)\s+from\s+["']([^"']+)["']/gmu)) {
    const clause = match[1].trim();
    const sourceModule = match[2];
    if (/^[A-Za-z_$][\w$]*$/u.test(clause)) {
      imports.push({ sourceModule, kind: "default", localName: clause });
      continue;
    }
    const namedMatch = clause.match(/\{([^}]+)\}/u);
    if (namedMatch !== null) {
      for (const part of namedMatch[1].split(",")) {
        const [, importedName, alias] = part.trim().match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/u) ?? [];
        if (importedName !== void 0) {
          imports.push({
            sourceModule,
            kind: "named",
            localName: alias ?? importedName,
            importedName
          });
        }
      }
    }
  }
  return imports;
}
function extractCIncludes(source) {
  return [...source.matchAll(/^\s*#include\s+["<]([^">]+)[">]/gmu)].map(
    (match) => ({
      sourceModule: match[1],
      kind: "namespace",
      localName: basename(match[1], extname(match[1]))
    })
  );
}
function extractDottedImports(source, pattern, separator = ".") {
  return [...source.matchAll(pattern)].map((match) => {
    const sourceModule = match[1].replaceAll(separator, ".");
    const importedName = lastName(sourceModule);
    return {
      sourceModule,
      kind: "named",
      localName: match[2] ?? importedName,
      importedName
    };
  });
}
function importsByRegex(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => ({
    sourceModule: match[1],
    kind: "namespace",
    localName: lastName(match[1])
  }));
}
function matches(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => ({
    name: match[1],
    line: lineAt(source, match.index ?? 0)
  })).filter((declaration) => declaration.name !== "if");
}
function lineAt(source, index) {
  const start = source.lastIndexOf("\n", index) + 1;
  const end = source.indexOf("\n", index);
  return source.slice(start, end === -1 ? void 0 : end);
}
function firstMatch(source, pattern) {
  return pattern.exec(source)?.[1];
}
function stripComments(source, languageId) {
  if (languageId === "python" || languageId === "ruby") {
    return source.replace(/#.*$/gmu, "");
  }
  return source.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/\/\/.*$/gmu, "");
}
function candidatePathsForBase(basePath) {
  return [
    basePath,
    ...SOURCE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => `${basePath}/index${extension}`),
    `${basePath}/__init__.py`,
    `${basePath}/mod.rs`
  ];
}
function uniqueFiles(files) {
  return [...new Map(files.map((file) => [file.path, file])).values()];
}
function append(map, key, value) {
  map.set(key, [...map.get(key) ?? [], value]);
}
function isIgnored(path, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(path));
}
function globToRegExp(pattern) {
  let escaped = "";
  for (let index = 0; index < pattern.length; index += 1) {
    if (pattern.startsWith("**/", index)) {
      escaped += "(?:.*/)?";
      index += 2;
    } else if (pattern.startsWith("**", index)) {
      escaped += ".*";
      index += 1;
    } else if (pattern[index] === "*") {
      escaped += "[^/]*";
    } else {
      escaped += escapeRegExp(pattern[index]);
    }
  }
  return new RegExp(`^${escaped}$`, "u");
}
function escapeRegExp(value) {
  return value.replace(/[.+^${}()|[\]\\]/gu, "\\$&");
}
function lastName(value) {
  return value.split(/[./\\:]+/u).filter(Boolean).at(-1) ?? value;
}
function normalizePath2(path) {
  return normalize(path).replaceAll("\\", "/");
}

// src/extractors/typescript-react/TypeScriptReactExtractor.ts
import { join as join5 } from "path";

// src/analysis/repositoryFactsIndexBuilder.ts
var RepositoryFactsIndexBuilder = class {
  build(facts) {
    const factsByPath = /* @__PURE__ */ new Map();
    const declarationsByName = /* @__PURE__ */ new Map();
    const exportsByName = /* @__PURE__ */ new Map();
    const importsBySource = /* @__PURE__ */ new Map();
    for (const fileFacts of facts) {
      factsByPath.set(fileFacts.path, fileFacts);
      for (const declaration of fileFacts.declarations) {
        if (declaration.name !== void 0) {
          append2(declarationsByName, declaration.name, {
            path: fileFacts.path,
            declaration
          });
        }
      }
      for (const exportFact of fileFacts.exports) {
        append2(exportsByName, exportFact.exportedName, {
          path: fileFacts.path,
          exportFact
        });
      }
      for (const importFact of fileFacts.imports) {
        append2(importsBySource, importFact.sourceModule, {
          path: fileFacts.path,
          importFact
        });
      }
    }
    return {
      allFacts: () => facts,
      byPath: (path) => factsByPath.get(path),
      declarationsByName: (name) => declarationsByName.get(name) ?? [],
      exportsByName: (name) => exportsByName.get(name) ?? [],
      importsBySource: (sourceModule) => importsBySource.get(sourceModule) ?? []
    };
  }
};
function append2(map, key, value) {
  map.set(key, [...map.get(key) ?? [], value]);
}

// src/extractors/typescript-react/jsxStructureExtractor.ts
import {
  forEachChild,
  isJsxElement,
  isJsxSelfClosingElement
} from "typescript";
var JsxStructureExtractor = class {
  enrich(parsedSource, repositoryFacts) {
    return {
      ...repositoryFacts,
      features: [
        ...repositoryFacts.features,
        ...parsedSource.ast === null ? [] : extractJsxStructures(parsedSource.ast)
      ]
    };
  }
};
function extractJsxStructures(ast) {
  const facts = [];
  visit(ast, (node) => {
    if (isJsxElement(node)) {
      facts.push(toFact(node.openingElement.tagName, ast));
    } else if (isJsxSelfClosingElement(node)) {
      facts.push(toFact(node.tagName, ast));
    }
  });
  return facts;
}
function visit(node, onNode) {
  onNode(node);
  forEachChild(node, (child) => visit(child, onNode));
}
function toFact(tagName, ast) {
  const elementName = tagName.getText(ast);
  return {
    category: "structure",
    key: /^[A-Z]/u.test(elementName) ? "component" : "intrinsic",
    value: elementName
  };
}

// src/extractors/typescript-react/relationshipAnalyzer.ts
import { dirname as dirname2, join as join3, normalize as normalize2 } from "path/posix";
var SOURCE_EXTENSIONS2 = [".tsx", ".ts", ".jsx", ".js"];
var RelationshipAnalyzer = class {
  analyze(index) {
    const relationships = [];
    for (const facts of index.allFacts()) {
      for (const importFact of facts.imports) {
        if (!isRepositoryLocalImport(importFact.sourceModule)) {
          continue;
        }
        const targetFacts = resolveTargetFacts(index, facts.path, importFact.sourceModule);
        if (targetFacts === void 0) {
          relationships.push({
            importerPath: facts.path,
            sourceModule: importFact.sourceModule,
            importKind: importFact.kind,
            localName: importFact.localName,
            importedName: importFact.importedName,
            resolution: "unresolved"
          });
          continue;
        }
        const exportMatches = findExportMatches(targetFacts, importFact);
        if (exportMatches.length !== 1) {
          relationships.push({
            importerPath: facts.path,
            sourceModule: importFact.sourceModule,
            importKind: importFact.kind,
            localName: importFact.localName,
            importedName: importFact.importedName,
            resolution: exportMatches.length === 0 ? "unresolved" : "ambiguous",
            targetPath: targetFacts.path
          });
          continue;
        }
        const exportFact = exportMatches[0];
        relationships.push({
          importerPath: facts.path,
          sourceModule: importFact.sourceModule,
          importKind: importFact.kind,
          localName: importFact.localName,
          importedName: importFact.importedName,
          resolution: "resolved",
          targetPath: targetFacts.path,
          targetExportName: exportFact.exportedName,
          targetDeclarationName: findTargetDeclarationName(targetFacts, exportFact)
        });
      }
    }
    return relationships;
  }
};
function resolveTargetFacts(index, importerPath, sourceModule) {
  const candidates = resolveBasePaths(importerPath, sourceModule).flatMap(
    candidatePathsForBase2
  );
  for (const candidate of candidates) {
    const facts = index.byPath(candidate);
    if (facts !== void 0) {
      return facts;
    }
  }
  return void 0;
}
function isRepositoryLocalImport(sourceModule) {
  return sourceModule.startsWith(".") || sourceModule.startsWith("@/");
}
function resolveBasePaths(importerPath, sourceModule) {
  if (sourceModule.startsWith("@/")) {
    return [normalize2(join3("src", sourceModule.slice(2)))];
  }
  return [normalize2(join3(dirname2(importerPath), sourceModule))];
}
function candidatePathsForBase2(basePath) {
  return [
    basePath,
    ...SOURCE_EXTENSIONS2.map((extension) => `${basePath}${extension}`),
    ...SOURCE_EXTENSIONS2.map((extension) => `${basePath}/index${extension}`)
  ];
}
function findExportMatches(facts, importFact) {
  if (importFact.kind === "namespace") {
    return facts.exports;
  }
  if (importFact.kind === "default") {
    return facts.exports.filter((exportFact) => exportFact.kind === "default");
  }
  return facts.exports.filter(
    (exportFact) => exportFact.exportedName === importFact.importedName
  );
}
function findTargetDeclarationName(facts, exportFact) {
  const name = exportFact.localName;
  if (name === void 0) {
    return void 0;
  }
  const declarations = facts.declarations.filter(
    (declaration) => declaration.name === name
  );
  return declarations.length === 1 ? name : void 0;
}

// src/extractors/typescript-react/repositoryFactsBuilder.ts
import {
  SyntaxKind,
  canHaveModifiers,
  forEachChild as forEachChild2,
  getModifiers,
  isArrowFunction,
  isExportAssignment,
  isExportDeclaration,
  isExportSpecifier,
  isFunctionDeclaration,
  isFunctionExpression,
  isImportDeclaration,
  isNamedExports,
  isNamespaceImport,
  isVariableDeclaration,
  isVariableStatement
} from "typescript";
var RepositoryFactsBuilder = class {
  build(parsedSource) {
    if (parsedSource.ast === null) {
      return {
        path: parsedSource.path,
        imports: [],
        exports: [],
        declarations: [],
        features: []
      };
    }
    return {
      path: parsedSource.path,
      imports: extractImportFacts(parsedSource),
      exports: extractExportFacts(parsedSource),
      declarations: extractDeclarationFacts(parsedSource),
      features: []
    };
  }
};
function extractImportFacts(parsedSource) {
  const importFacts = [];
  for (const statement of parsedSource.ast.statements) {
    if (isExportDeclaration(statement) && statement.moduleSpecifier !== void 0) {
      const sourceModule2 = stripQuotes(
        statement.moduleSpecifier.getText(parsedSource.ast)
      );
      if (statement.exportClause === void 0) {
        continue;
      }
      if (!isNamedExports(statement.exportClause)) {
        continue;
      }
      for (const element of statement.exportClause.elements) {
        if (!isExportSpecifier(element)) {
          continue;
        }
        importFacts.push({
          sourceModule: sourceModule2,
          kind: "named",
          localName: element.name.text,
          importedName: (element.propertyName ?? element.name).text
        });
      }
      continue;
    }
    if (!isImportDeclaration(statement) || statement.importClause === void 0) {
      continue;
    }
    const sourceModule = statement.moduleSpecifier.getText(parsedSource.ast);
    const normalizedSourceModule = stripQuotes(sourceModule);
    const importClause = statement.importClause;
    if (importClause.name !== void 0) {
      importFacts.push({
        sourceModule: normalizedSourceModule,
        kind: "default",
        localName: importClause.name.text
      });
    }
    const namedBindings = importClause.namedBindings;
    if (namedBindings === void 0) {
      continue;
    }
    if (isNamespaceImport(namedBindings)) {
      importFacts.push({
        sourceModule: normalizedSourceModule,
        kind: "namespace",
        localName: namedBindings.name.text
      });
      continue;
    }
    for (const element of namedBindings.elements) {
      importFacts.push({
        sourceModule: normalizedSourceModule,
        kind: "named",
        localName: element.name.text,
        importedName: (element.propertyName ?? element.name).text
      });
    }
  }
  return importFacts;
}
function extractExportFacts(parsedSource) {
  const exportFacts = [];
  for (const statement of parsedSource.ast.statements) {
    if (isExportAssignment(statement)) {
      exportFacts.push({
        kind: "default",
        exportedName: "default",
        localName: getExpressionName(statement.expression)
      });
      continue;
    }
    if (isExportDeclaration(statement) && statement.exportClause !== void 0 && isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        if (!isExportSpecifier(element)) {
          continue;
        }
        exportFacts.push({
          kind: "named",
          exportedName: element.name.text,
          localName: (element.propertyName ?? element.name).text
        });
      }
      continue;
    }
    const modifiers = getNodeModifiers(statement);
    if (!hasExportModifier(modifiers)) {
      continue;
    }
    if (isFunctionDeclaration(statement) && statement.name !== void 0) {
      exportFacts.push({
        kind: hasDefaultModifier(modifiers) ? "default" : "named",
        exportedName: hasDefaultModifier(modifiers) ? "default" : statement.name.text,
        localName: statement.name.text
      });
      continue;
    }
    if (isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.name.getText(parsedSource.ast) === "") {
          continue;
        }
        const localName = declaration.name.getText(parsedSource.ast);
        exportFacts.push({
          kind: hasDefaultModifier(modifiers) ? "default" : "named",
          exportedName: hasDefaultModifier(modifiers) ? "default" : localName,
          localName
        });
      }
    }
  }
  return exportFacts;
}
function extractDeclarationFacts(parsedSource) {
  const declarationFacts = [];
  for (const statement of parsedSource.ast.statements) {
    if (isFunctionDeclaration(statement) && isComponentLikeFunction(statement)) {
      declarationFacts.push({
        kind: "declaration",
        name: statement.name?.text,
        visibility: getVisibility(getNodeModifiers(statement))
      });
      continue;
    }
    if (!isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (!isVariableDeclaration(declaration)) {
        continue;
      }
      const nameText = declaration.name.getText(parsedSource.ast);
      if (declaration.initializer !== void 0 && isPascalCaseName(nameText) && isComponentLikeFunction(declaration.initializer)) {
        declarationFacts.push({
          kind: "declaration",
          name: nameText,
          visibility: getVisibility(getNodeModifiers(statement))
        });
      }
    }
  }
  return declarationFacts;
}
function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, "");
}
function hasExportModifier(modifiers) {
  return modifiers?.some((modifier) => modifier.kind === 95) ?? false;
}
function hasDefaultModifier(modifiers) {
  return modifiers?.some((modifier) => modifier.kind === 90) ?? false;
}
function getVisibility(modifiers) {
  return hasExportModifier(modifiers) ? "exported" : "local";
}
function getNodeModifiers(node) {
  return canHaveModifiers(node) ? getModifiers(node) : void 0;
}
function getExpressionName(expression) {
  const text = expression.getText().trim();
  return text === "" ? void 0 : text;
}
function isPascalCaseName(name) {
  return /^[A-Z][A-Za-z0-9]*$/u.test(name);
}
function isComponentLikeFunction(node) {
  if (typeof node !== "object" || node === null || !("kind" in node)) {
    return false;
  }
  const candidate = node;
  if (!isFunctionDeclaration(candidate) && !isFunctionExpression(candidate) && !isArrowFunction(candidate)) {
    return false;
  }
  if ("name" in candidate && candidate.name !== void 0) {
    const text = candidate.name.getText();
    if (text !== "" && !isPascalCaseName(text)) {
      return false;
    }
  }
  if (candidate.body === void 0) {
    return false;
  }
  if (candidate.body.kind === SyntaxKind.JsxElement || candidate.body.kind === SyntaxKind.JsxSelfClosingElement || candidate.body.kind === SyntaxKind.JsxFragment) {
    return true;
  }
  let foundJsx = false;
  forEachChild2(candidate.body, function visit3(child) {
    if (child.kind === SyntaxKind.JsxElement || child.kind === SyntaxKind.JsxSelfClosingElement || child.kind === SyntaxKind.JsxFragment) {
      foundJsx = true;
      return;
    }
    if (!foundJsx) {
      forEachChild2(child, visit3);
    }
  });
  return foundJsx;
}

// src/extractors/typescript-react/sourceFileDiscovery.ts
import { join as join4, relative as relative3 } from "path";
var SUPPORTED_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js"];
var SourceFileDiscovery = class {
  // Walks the whole repository and keeps the files that carry a role hint.
  //
  // Discovery used to visit only the configured `sharedSourceDirs` and
  // `localSourceDirs`, whose defaults are `src/components` and `src/screens`.
  // A Next.js App Router project keeps components in a top-level `components/`
  // and a Vite project in `src/ui`; neither matched, so the React provider
  // reported itself unsupported and the repository silently lost all JSX and
  // style intelligence. Role hints already know every convention, so discovery
  // asks them rather than repeating a directory list.
  discover(context) {
    const candidates = [];
    for (const absolutePath of walkFiles2(context.rootPath)) {
      const repositoryPath = normalizePath3(
        relative3(context.rootPath, absolutePath)
      );
      if (!isSupportedSourceFile(repositoryPath) || isIgnored2(repositoryPath, context.config.ignore)) {
        continue;
      }
      const role = roleHintsForPath(context, repositoryPath)[0]?.role;
      if (role === "shared" || role === "local") {
        candidates.push({
          path: repositoryPath,
          discoveredFrom: role === "shared" ? "sharedSourceDir" : "localSourceDir"
        });
      }
    }
    return candidates.sort((a, b) => a.path.localeCompare(b.path));
  }
};
var IGNORED_DIRECTORIES3 = /* @__PURE__ */ new Set([
  ".git",
  ".next",
  ".nuxt",
  ".svelte-kit",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "vendor"
]);
function walkFiles2(directory) {
  const files = [];
  for (const entry of readDirSafe(directory)) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES3.has(entry.name)) {
      continue;
    }
    const absolutePath = join4(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles2(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}
function isSupportedSourceFile(path) {
  return SUPPORTED_EXTENSIONS.some((extension) => path.endsWith(extension));
}
function isIgnored2(path, patterns) {
  return patterns.some((pattern) => globToRegExp2(pattern).test(path));
}
function globToRegExp2(pattern) {
  let escaped = "";
  for (let index = 0; index < pattern.length; index += 1) {
    if (pattern.startsWith("**/", index)) {
      escaped += "(?:.*/)?";
      index += 2;
    } else if (pattern.startsWith("**", index)) {
      escaped += ".*";
      index += 1;
    } else if (pattern[index] === "*") {
      escaped += "[^/]*";
    } else {
      escaped += escapeRegExp2(pattern[index]);
    }
  }
  return new RegExp(`^${escaped}$`, "u");
}
function escapeRegExp2(value) {
  return value.replace(/[.+^${}()|[\]\\]/gu, "\\$&");
}
function normalizePath3(path) {
  return path.replaceAll("\\", "/");
}

// src/extractors/typescript-react/sourceFileParser.ts
import { readFileSync as readFileSync2 } from "fs";
import {
  ScriptKind,
  ScriptTarget,
  createSourceFile,
  sortAndDeduplicateDiagnostics
} from "typescript";
var SourceFileParser = class {
  parse(uiFile) {
    const sourceText = readFileSync2(uiFile.path, "utf8");
    const ast = createSourceFile(
      uiFile.path,
      sourceText,
      ScriptTarget.Latest,
      true,
      getScriptKind(uiFile.path)
    );
    const diagnostics = sortAndDeduplicateDiagnostics(
      parseDiagnosticsFor(ast)
    ).map(
      (diagnostic) => typeof diagnostic.messageText === "string" ? diagnostic.messageText : flattenMessageText(diagnostic.messageText)
    );
    if (diagnostics.length > 0) {
      return {
        path: uiFile.path,
        sourceText,
        ast: null,
        parseError: buildParseError(diagnostics)
      };
    }
    return {
      path: uiFile.path,
      sourceText,
      ast,
      parseError: null
    };
  }
};
function parseDiagnosticsFor(sourceFile) {
  return [
    ...sourceFile.parseDiagnostics ?? []
  ];
}
function getScriptKind(path) {
  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith(".tsx") || lowerPath.endsWith(".native.tsx")) {
    return ScriptKind.TSX;
  }
  if (lowerPath.endsWith(".jsx") || lowerPath.endsWith(".native.jsx")) {
    return ScriptKind.JSX;
  }
  if (lowerPath.endsWith(".ts")) {
    return ScriptKind.TS;
  }
  if (lowerPath.endsWith(".js")) {
    return ScriptKind.JS;
  }
  return ScriptKind.Unknown;
}
function buildParseError(diagnostics) {
  return {
    message: diagnostics[0] ?? "Unknown parse error",
    diagnostics
  };
}
function flattenMessageText(messageText) {
  if (typeof messageText === "string") {
    return messageText;
  }
  const parts = [messageText.messageText];
  for (const next of messageText.next ?? []) {
    parts.push(flattenMessageText(next));
  }
  return parts.join(" ");
}

// src/extractors/typescript-react/styleTokenExtractor.ts
import {
  forEachChild as forEachChild3,
  isJsxAttribute,
  isJsxExpression,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteral
} from "typescript";
var StyleTokenExtractor = class {
  enrich(parsedSource, repositoryFacts) {
    return {
      ...repositoryFacts,
      features: [
        ...repositoryFacts.features,
        ...parsedSource.ast === null ? [] : extractStyleTokens(parsedSource.ast)
      ]
    };
  }
};
function extractStyleTokens(ast) {
  const tokens = [];
  visit2(ast, (node) => {
    if (isJsxAttribute(node)) {
      tokens.push(...tokensFromAttribute(node));
    }
  });
  return tokens;
}
function visit2(node, onNode) {
  onNode(node);
  forEachChild3(node, (child) => visit2(child, onNode));
}
function tokensFromAttribute(attribute) {
  const name = attribute.name.getText();
  const initializer = attribute.initializer;
  if (name === "className" && initializer !== void 0 && isStringLiteral(initializer)) {
    return initializer.text.split(/\s+/u).filter((token) => token !== "").map((value) => ({ category: "style", key: "className", value }));
  }
  if (name !== "style" || initializer === void 0 || !isJsxExpression(initializer)) {
    return [];
  }
  const expression = initializer.expression;
  if (expression === void 0 || !isObjectLiteralExpression(expression)) {
    return [];
  }
  return expression.properties.filter(isPropertyAssignment).map((property) => property.name.getText()).map((value) => ({ category: "style", key: "styleKey", value }));
}

// src/extractors/typescript-react/uiFileClassifier.ts
var UiFileClassifier = class {
  classifyFiles(changedFiles) {
    return changedFiles.map((changedFile) => this.classifyFile(changedFile)).filter((uiFile) => uiFile !== null);
  }
  classifyFile(changedFile) {
    const normalizedPath = changedFile.path.replaceAll("\\", "/");
    const fileName = normalizedPath.split("/").pop() ?? normalizedPath;
    const lowerPath = normalizedPath.toLowerCase();
    const lowerFileName = fileName.toLowerCase();
    if (!isUiCandidate(lowerPath, lowerFileName)) {
      return null;
    }
    return {
      path: changedFile.path,
      framework: classifyFramework(lowerPath, lowerFileName),
      kind: classifyKind(normalizedPath, fileName, lowerPath, lowerFileName)
    };
  }
};
function isUiCandidate(lowerPath, lowerFileName) {
  if (lowerFileName.endsWith(".tsx") || lowerFileName.endsWith(".jsx") || lowerFileName.endsWith(".native.tsx") || lowerFileName.endsWith(".native.jsx")) {
    return true;
  }
  if ((lowerFileName.endsWith(".ts") || lowerFileName.endsWith(".js")) && (lowerFileName.startsWith("use") || lowerPath.includes("/hooks/"))) {
    return true;
  }
  return false;
}
function classifyFramework(lowerPath, lowerFileName) {
  if (lowerFileName.endsWith(".native.tsx") || lowerFileName.endsWith(".native.jsx") || lowerPath.includes("react-native") || lowerPath.includes("/native/")) {
    return "react-native";
  }
  if (lowerFileName.endsWith(".tsx") || lowerFileName.endsWith(".jsx") || lowerFileName.endsWith(".ts") || lowerFileName.endsWith(".js")) {
    return "react";
  }
  return "unknown";
}
function classifyKind(path, fileName, lowerPath, lowerFileName) {
  if (lowerFileName.startsWith("use") || lowerPath.includes("/hooks/")) {
    return "hook";
  }
  if (lowerPath.includes("/layouts/") || lowerPath.includes("/layout/") || fileName.endsWith("Layout.tsx") || fileName.endsWith("Layout.jsx") || fileName === "layout.tsx" || fileName === "layout.jsx") {
    return "layout";
  }
  if (lowerPath.includes("/pages/") || lowerPath.includes("/page/") || lowerPath.includes("/screens/") || lowerPath.includes("/screen/") || lowerPath.includes("/routes/") || lowerPath.includes("/route/") || lowerPath.includes("/views/") || lowerPath.includes("/view/") || /(?:Page|Screen|View|Route|Panel)\.(?:tsx|jsx)$/u.test(fileName)) {
    return "page";
  }
  if (lowerPath.includes("/components/") || lowerPath.includes("/component/") || lowerPath.includes("/ui/") || lowerPath.includes("/shared/") || lowerPath.includes("/common/")) {
    return "component";
  }
  if (/^[A-Z][A-Za-z0-9]*\.(?:tsx|jsx)$/u.test(fileName)) {
    return "component";
  }
  return "unknown";
}

// src/extractors/typescript-react/TypeScriptReactExtractor.ts
var TYPESCRIPT = { id: "typescript", name: "TypeScript" };
var JAVASCRIPT = { id: "javascript", name: "JavaScript" };
var DESCRIPTOR2 = {
  id: "typescript-react",
  name: "TypeScript React Provider",
  languages: [TYPESCRIPT, JAVASCRIPT],
  contributes: ["declaration-extraction", "ui-extraction"]
};
var TypeScriptReactExtractor = class {
  constructor(sourceDiscovery = new SourceFileDiscovery(), uiClassifier = new UiFileClassifier(), parser = new SourceFileParser(), factsBuilder = new RepositoryFactsBuilder(), jsxExtractor = new JsxStructureExtractor(), styleExtractor = new StyleTokenExtractor(), indexBuilder = new RepositoryFactsIndexBuilder(), relationshipAnalyzer = new RelationshipAnalyzer()) {
    this.sourceDiscovery = sourceDiscovery;
    this.uiClassifier = uiClassifier;
    this.parser = parser;
    this.factsBuilder = factsBuilder;
    this.jsxExtractor = jsxExtractor;
    this.styleExtractor = styleExtractor;
    this.indexBuilder = indexBuilder;
    this.relationshipAnalyzer = relationshipAnalyzer;
  }
  sourceDiscovery;
  uiClassifier;
  parser;
  factsBuilder;
  jsxExtractor;
  styleExtractor;
  indexBuilder;
  relationshipAnalyzer;
  descriptor() {
    return DESCRIPTOR2;
  }
  detect(context) {
    const sourceFiles = this.sourceDiscovery.discover(context);
    return {
      supported: sourceFiles.length > 0,
      detectedLanguages: sourceFiles.length > 0 ? DESCRIPTOR2.languages : [],
      reason: sourceFiles.length > 0 ? void 0 : "No TypeScript/React source files found in configured source directories."
    };
  }
  extract(context) {
    const sourceFiles = this.sourceDiscovery.discover(context);
    const artifacts = this.toArtifacts(context, sourceFiles);
    const facts = sourceFiles.map(
      (sourceFile) => this.buildFacts(context.rootPath, sourceFile)
    );
    const factsIndex = this.indexBuilder.build(facts);
    return {
      artifacts,
      facts,
      relationships: this.relationshipAnalyzer.analyze(factsIndex)
    };
  }
  toArtifacts(context, sourceFiles) {
    const changedFiles = sourceFiles.map((sourceFile) => ({
      path: sourceFile.path,
      status: "modified"
    }));
    const uiFilesByPath = new Map(
      this.uiClassifier.classifyFiles(changedFiles).map((uiFile) => [
        uiFile.path,
        uiFile
      ])
    );
    return sourceFiles.map(
      (sourceFile) => toSourceArtifact(context, sourceFile, uiFilesByPath.get(sourceFile.path))
    );
  }
  buildFacts(rootPath, sourceFile) {
    const parsedSource = this.parser.parse({
      path: join5(rootPath, sourceFile.path),
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
};
function toSourceArtifact(context, sourceFile, uiFile) {
  return {
    path: sourceFile.path,
    language: sourceFile.path.endsWith(".js") || sourceFile.path.endsWith(".jsx") ? JAVASCRIPT : TYPESCRIPT,
    extractorId: DESCRIPTOR2.id,
    roleHints: roleHintsFor(context, sourceFile, uiFile)
  };
}
function roleHintsFor(context, sourceFile, uiFile) {
  if (sourceFile.discoveredFrom === "sharedSourceDir") {
    return [{ role: "shared", reason: "shared source directory" }];
  }
  if (sourceFile.discoveredFrom === "localSourceDir" || uiFile?.kind === "page") {
    return [{ role: "local", reason: "local source directory" }];
  }
  return roleHintsForPath(context, sourceFile.path);
}

// src/analysis/repositoryStructureAnalyzer.ts
import { basename as basename2, dirname as dirname3, join as join6, relative as relative4 } from "path";
var IGNORED_DIRECTORIES4 = /* @__PURE__ */ new Set([
  ".agents",
  ".codex",
  ".git",
  ".gradle",
  ".idea",
  ".kotlin",
  ".next",
  ".artifacts",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out"
]);
var IGNORED_REPEATED_DIRECTORY_NAMES = /* @__PURE__ */ new Set([
  "androidTest",
  "com",
  "debug",
  "generated",
  "java",
  "kotlin",
  "main",
  "resources",
  "src",
  "test"
]);
var MANIFEST_FILENAMES2 = /* @__PURE__ */ new Set([
  "build.gradle",
  "build.gradle.kts",
  "package.json",
  "pom.xml",
  "pyproject.toml",
  "settings.gradle",
  "settings.gradle.kts"
]);
var RepositoryStructureAnalyzer = class {
  analyze(context) {
    const tree = walk(context.rootPath);
    const sourceFiles = tree.files.filter(
      (path) => languageForPath(path) !== void 0 && !isManifestPath(path)
    );
    return {
      summary: {
        rootPath: context.rootPath,
        fileCount: tree.files.length,
        directoryCount: tree.directories.length,
        sourceFileCount: sourceFiles.length,
        topLevelDirectories: topLevelDirectories(tree.directories)
      },
      findings: [
        ...duplicateSourceFilenames(sourceFiles),
        ...repeatedSourceDirectories(sourceFiles),
        ...multipleManifestRoots(tree.files)
      ]
    };
  }
};
function walk(rootPath) {
  const files = [];
  const directories = [];
  function visit3(directory) {
    for (const entry of readDirSafe(directory)) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES4.has(entry.name)) {
        continue;
      }
      const absolutePath = join6(directory, entry.name);
      const repositoryPath = normalizePath4(relative4(rootPath, absolutePath));
      if (entry.isDirectory()) {
        directories.push(repositoryPath);
        visit3(absolutePath);
      } else if (entry.isFile()) {
        files.push(repositoryPath);
      }
    }
  }
  visit3(rootPath);
  return {
    files: files.sort(),
    directories: directories.sort()
  };
}
function topLevelDirectories(directories) {
  return [
    ...new Set(
      directories.filter((path) => !path.includes("/")).filter((path) => !IGNORED_DIRECTORIES4.has(path))
    )
  ].sort();
}
function duplicateSourceFilenames(sourceFiles) {
  const byName = /* @__PURE__ */ new Map();
  for (const path of sourceFiles) {
    add(byName, basename2(path), path);
  }
  return [...byName.entries()].filter(([, paths]) => paths.length > 1).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).slice(0, 10).map(([name, paths]) => ({
    kind: "repository-heuristic",
    title: `Duplicate source filename: ${name}`,
    paths,
    evidence: [`${paths.length} files share the same leaf filename`]
  }));
}
function repeatedSourceDirectories(sourceFiles) {
  const byName = /* @__PURE__ */ new Map();
  for (const path of sourceFiles) {
    const directoryName = basename2(dirname3(path));
    if (!IGNORED_REPEATED_DIRECTORY_NAMES.has(directoryName)) {
      add(byName, directoryName, dirname3(path));
    }
  }
  return [...byName.entries()].map(
    ([name, paths]) => [name, [...new Set(paths)].sort()]
  ).filter(([, paths]) => paths.length > 1).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).slice(0, 10).map(([name, paths]) => ({
    kind: "repository-heuristic",
    title: `Repeated source directory name: ${name}`,
    paths,
    evidence: [`${paths.length} source directories share this name`]
  }));
}
function multipleManifestRoots(files) {
  const manifestPaths = files.filter(isManifestPath);
  if (manifestPaths.length < 2) {
    return [];
  }
  return [
    {
      kind: "repository-heuristic",
      title: "Multiple project manifests detected",
      paths: manifestPaths,
      evidence: [`${manifestPaths.length} build/package manifests found`]
    }
  ];
}
function isManifestPath(path) {
  return MANIFEST_FILENAMES2.has(basename2(path));
}
function add(map, key, path) {
  map.set(key, [...map.get(key) ?? [], path]);
}
function normalizePath4(path) {
  return path.replaceAll("\\", "/");
}

// src/analysis/usageAnalyzer.ts
var UsageAnalyzer = class {
  analyze(index, relationships) {
    const usageByPath = /* @__PURE__ */ new Map();
    for (const facts of index.allFacts()) {
      usageByPath.set(facts.path, {
        path: facts.path,
        fileReferenceCount: 0,
        declarationReferences: namedDeclarations(facts.declarations)
      });
    }
    for (const relationship of relationships) {
      if (relationship.resolution !== "resolved" || relationship.targetPath === void 0 || relationship.targetPath === relationship.importerPath) {
        continue;
      }
      const usage = usageByPath.get(relationship.targetPath);
      if (usage === void 0) {
        continue;
      }
      usage.fileReferenceCount += 1;
      if (relationship.targetDeclarationName !== void 0) {
        incrementDeclarationReference(
          usage.declarationReferences,
          relationship.targetDeclarationName
        );
      }
    }
    return [...usageByPath.values()].sort((a, b) => a.path.localeCompare(b.path));
  }
};
function namedDeclarations(declarations) {
  return declarations.filter((declaration) => declaration.name !== void 0).map((declaration) => ({
    name: declaration.name,
    referenceCount: 0
  })).sort((a, b) => a.name.localeCompare(b.name));
}
function incrementDeclarationReference(declarations, name) {
  const declaration = declarations.find((entry) => entry.name === name);
  if (declaration !== void 0) {
    declaration.referenceCount += 1;
  }
}

// src/git/repoRoot.ts
import * as fs from "fs";
import { dirname as dirname4, join as join8, resolve } from "path";

// src/config/loadConfig.ts
import { existsSync, readFileSync as readFileSync3 } from "fs";
import { join as join7 } from "path";

// src/config/defaults.ts
var defaultConfig = {
  sharedSourceDirs: [
    "src/components",
    "src/ui",
    "src/design-system",
    "src/shared",
    "src/common"
  ],
  localSourceDirs: ["src/screens", "src/pages", "src/routes", "src/views"],
  sharedDirNames: [
    "components",
    "component",
    "ui",
    "design-system",
    "designsystem",
    "design_system",
    "shared",
    "common",
    "widgets",
    "controls",
    "atoms",
    "molecules",
    "organisms",
    "theme",
    "tokens"
  ],
  localDirNames: [
    "screens",
    "screen",
    "pages",
    "page",
    "routes",
    "views",
    "features",
    "scenes",
    "activities",
    "fragments"
  ],
  ignore: [
    "**/*.test.tsx",
    "**/*.test.jsx",
    "**/*.stories.tsx",
    "**/*.stories.jsx",
    "**/__generated__/**",
    "**/generated/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**"
  ],
  warningThreshold: 0.7,
  strongWarningThreshold: 0.85,
  includeLowConfidenceNotes: false
};

// src/config/loadConfig.ts
var CONFIG_FILENAME = "component-intent.json";
var CONFIG_KEYS = [
  "sharedSourceDirs",
  "localSourceDirs",
  "sharedDirNames",
  "localDirNames",
  "sharedComponentDirs",
  "screenDirs",
  "ignore",
  "warningThreshold",
  "strongWarningThreshold",
  "includeLowConfidenceNotes"
];
function loadConfig(directory) {
  const configPath = join7(directory, CONFIG_FILENAME);
  if (!existsSync(configPath)) {
    return { ...defaultConfig };
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync3(configPath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown parse error";
    throw new Error(`Invalid configuration in ${CONFIG_FILENAME}: ${message}`);
  }
  const userConfig = normalizeUserConfig(validateUserConfig(parsed));
  return {
    ...defaultConfig,
    ...userConfig
  };
}
function validateUserConfig(value) {
  if (!isPlainObject(value)) {
    throw new Error(
      `Invalid configuration in ${CONFIG_FILENAME}: expected a JSON object`
    );
  }
  const unknownKeys = Object.keys(value).filter(
    (key) => !CONFIG_KEYS.includes(key)
  );
  if (unknownKeys.length > 0) {
    throw new Error(
      `Invalid configuration in ${CONFIG_FILENAME}: unknown field(s): ${unknownKeys.join(", ")}`
    );
  }
  const config = value;
  assertOptionalStringArray(config.sharedSourceDirs, "sharedSourceDirs");
  assertOptionalStringArray(config.localSourceDirs, "localSourceDirs");
  assertOptionalStringArray(config.sharedDirNames, "sharedDirNames");
  assertOptionalStringArray(config.localDirNames, "localDirNames");
  assertOptionalStringArray(config.sharedComponentDirs, "sharedComponentDirs");
  assertOptionalStringArray(config.screenDirs, "screenDirs");
  assertOptionalStringArray(config.ignore, "ignore");
  assertOptionalNumber(config.warningThreshold, "warningThreshold");
  assertOptionalNumber(config.strongWarningThreshold, "strongWarningThreshold");
  assertOptionalBoolean(
    config.includeLowConfidenceNotes,
    "includeLowConfidenceNotes"
  );
  return config;
}
function normalizeUserConfig(config) {
  const {
    sharedComponentDirs,
    screenDirs,
    ...normalizedConfig
  } = config;
  const normalized = { ...normalizedConfig };
  if (normalizedConfig.sharedSourceDirs !== void 0 || sharedComponentDirs !== void 0) {
    normalized.sharedSourceDirs = normalizedConfig.sharedSourceDirs ?? sharedComponentDirs;
  }
  if (normalizedConfig.localSourceDirs !== void 0 || screenDirs !== void 0) {
    normalized.localSourceDirs = normalizedConfig.localSourceDirs ?? screenDirs;
  }
  return normalized;
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function assertOptionalStringArray(value, fieldName) {
  if (value === void 0) {
    return;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(
      `Invalid configuration in ${CONFIG_FILENAME}: "${fieldName}" must be an array of strings`
    );
  }
}
function assertOptionalNumber(value, fieldName) {
  if (value === void 0) {
    return;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(
      `Invalid configuration in ${CONFIG_FILENAME}: "${fieldName}" must be a number`
    );
  }
}
function assertOptionalBoolean(value, fieldName) {
  if (value === void 0) {
    return;
  }
  if (typeof value !== "boolean") {
    throw new Error(
      `Invalid configuration in ${CONFIG_FILENAME}: "${fieldName}" must be a boolean`
    );
  }
}

// src/git/repoRoot.ts
function findRepositoryRoot(startPath) {
  const resolvedStart = resolve(startPath);
  let currentPath = resolvedStart;
  while (true) {
    if (fs.existsSync(join8(currentPath, ".git"))) {
      return currentPath;
    }
    const parentPath = dirname4(currentPath);
    if (parentPath === currentPath) {
      return resolveFallbackRoot(resolvedStart);
    }
    currentPath = parentPath;
  }
}
function resolveFallbackRoot(startPath) {
  const resolvedStart = resolve(startPath);
  return nearestManifestRoot(resolvedStart) ?? resolvedStart;
}
var ROOT_MARKER_FILENAMES = [
  "package.json",
  "pyproject.toml",
  "go.mod",
  "Cargo.toml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "pom.xml",
  "Package.swift",
  "pubspec.yaml",
  "Gemfile",
  "composer.json"
];
function nearestManifestRoot(startPath) {
  let currentPath = startPath;
  while (true) {
    if (ROOT_MARKER_FILENAMES.some(
      (filename) => fs.existsSync(join8(currentPath, filename))
    )) {
      return currentPath;
    }
    const parentPath = dirname4(currentPath);
    if (parentPath === currentPath) {
      return void 0;
    }
    currentPath = parentPath;
  }
}
function discoverRepositoryContext(startPath) {
  const rootPath = findRepositoryRoot(startPath);
  return {
    rootPath,
    config: loadConfig(rootPath)
  };
}

// src/knowledge/repositoryKnowledgeAssembler.ts
var RepositoryKnowledgeAssembler = class {
  assemble(input) {
    const sourceArtifacts = input.sourceArtifacts;
    const artifactsByPath = new Map(
      sourceArtifacts.map((artifact) => [artifact.path, artifact])
    );
    return {
      context: input.context,
      sourceArtifacts: () => sourceArtifacts,
      sourceFiles: () => sourceArtifacts,
      files: () => sourceArtifacts,
      artifactForPath: (path) => artifactsByPath.get(path),
      factsForPath: (path) => input.factsIndex.byPath(path),
      allFacts: () => input.factsIndex.allFacts(),
      declarationsByName: (name) => input.factsIndex.declarationsByName(name),
      exportsByName: (name) => input.factsIndex.exportsByName(name),
      importsBySource: (sourceModule) => input.factsIndex.importsBySource(sourceModule),
      relationships: () => input.relationships,
      relationshipsForPath: (path) => input.relationships.filter(
        (relationship) => relationship.importerPath === path || relationship.targetPath === path
      ),
      usage: () => input.usage,
      usageForPath: (path) => input.usage.find((usageFact) => usageFact.path === path)
    };
  }
};

// src/runner/knowledgePipelineRunner.ts
var KnowledgePipelineRunner = class {
  constructor(extractors = [
    new TypeScriptReactExtractor(),
    new GenericDeclarationsExtractor()
  ], languageDetector = new LanguageDetector(), structureAnalyzer = new RepositoryStructureAnalyzer(), indexBuilder = new RepositoryFactsIndexBuilder(), usageAnalyzer = new UsageAnalyzer(), assembler = new RepositoryKnowledgeAssembler()) {
    this.extractors = extractors;
    this.languageDetector = languageDetector;
    this.structureAnalyzer = structureAnalyzer;
    this.indexBuilder = indexBuilder;
    this.usageAnalyzer = usageAnalyzer;
    this.assembler = assembler;
  }
  extractors;
  languageDetector;
  structureAnalyzer;
  indexBuilder;
  usageAnalyzer;
  assembler;
  construct(startPath) {
    const context = discoverRepositoryContext(startPath);
    const repositoryStructure = this.structureAnalyzer.analyze(context);
    const detectedLanguages = this.languageDetector.detect(context);
    const supportedExtractors = this.extractors.filter(
      (candidate) => candidate.detect(context).supported
    );
    if (supportedExtractors.length === 0) {
      return {
        status: "limited",
        context,
        detectedLanguages,
        registeredExtractors: this.extractors.map(
          (candidate) => candidate.descriptor()
        ),
        capabilities: limitedCapabilities(),
        repositoryStructure
      };
    }
    const extraction = mergeExtractions(
      supportedExtractors.map((candidate) => candidate.extract(context))
    );
    const factsIndex = this.indexBuilder.build(extraction.facts);
    const usage = this.usageAnalyzer.analyze(factsIndex, extraction.relationships);
    return {
      status: "ready",
      capabilities: readyCapabilities(
        supportedExtractors.map((candidate) => candidate.descriptor())
      ),
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
  run(startPath) {
    const result = this.construct(startPath);
    if (result.status === "limited") {
      throw new Error("No knowledge provider can produce repository facts for this repository.");
    }
    return result.knowledge;
  }
};
function mergeExtractions(extractions) {
  const artifactsByPath = /* @__PURE__ */ new Map();
  const factsByPath = /* @__PURE__ */ new Map();
  const relationshipsByKey = /* @__PURE__ */ new Map();
  for (const extraction of extractions) {
    for (const artifact of extraction.artifacts) {
      if (!artifactsByPath.has(artifact.path)) {
        artifactsByPath.set(artifact.path, artifact);
      }
    }
    for (const facts of extraction.facts) {
      if (!factsByPath.has(facts.path)) {
        factsByPath.set(facts.path, facts);
      }
    }
    for (const relationship of extraction.relationships) {
      const key = relationshipKey(relationship);
      const existing = relationshipsByKey.get(key);
      if (existing === void 0 || prefersReplacement(existing, relationship)) {
        relationshipsByKey.set(key, relationship);
      }
    }
  }
  return {
    artifacts: [...artifactsByPath.values()].sort(
      (a, b) => a.path.localeCompare(b.path)
    ),
    facts: [...factsByPath.values()].sort((a, b) => a.path.localeCompare(b.path)),
    relationships: [...relationshipsByKey.values()]
  };
}
function relationshipKey(relationship) {
  return [
    relationship.importerPath,
    relationship.sourceModule,
    relationship.importKind,
    relationship.localName,
    relationship.importedName ?? ""
  ].join("\0");
}
function prefersReplacement(existing, candidate) {
  return existing.resolution !== "resolved" && candidate.resolution === "resolved";
}
function readyCapabilities(extractors) {
  const contributorsByArea = /* @__PURE__ */ new Map();
  for (const extractor of extractors) {
    for (const area3 of extractor.contributes) {
      contributorsByArea.set(area3, [
        ...contributorsByArea.get(area3) ?? [],
        extractor.name
      ]);
    }
  }
  return [
    available("repository-structure", "Repository structure", "built-in"),
    available("repository-heuristics", "Repository heuristics", "built-in"),
    ...KNOWN_AREAS.map(([id, name]) => {
      const contributors = contributorsByArea.get(id);
      return contributors === void 0 ? missing(id, name) : available(id, name, contributors.join(", "));
    })
  ];
}
var KNOWN_AREAS = [
  ["declaration-extraction", "Declaration extraction"],
  ["ui-extraction", "UI extraction"]
];
function limitedCapabilities() {
  return [
    available("repository-structure", "Repository structure", "built-in"),
    available("repository-heuristics", "Repository heuristics", "built-in"),
    missing("declaration-extraction", "Declaration extraction"),
    missing("ui-extraction", "UI extraction")
  ];
}
function available(id, name, reason) {
  return { id, name, status: "available", reason };
}
function missing(id, name) {
  return {
    id,
    name,
    status: "missing",
    reason: "no knowledge provider contributes this intelligence"
  };
}

// src/analysis/competingImplementationDetector.ts
var CompetingImplementationDetector = class {
  detect(context, patterns, rankings, confidenceScores) {
    const findings = [];
    for (const confidence of confidenceScores) {
      if (confidence.score < context.config.warningThreshold) {
        continue;
      }
      const pattern = patterns.find((entry) => entry.id === confidence.patternId);
      const ranking = rankings.find(
        (entry) => entry.patternId === confidence.patternId && entry.rank === 1
      );
      if (pattern === void 0 || ranking === void 0) {
        continue;
      }
      findings.push({
        kind: "competing-implementation",
        sourcePaths: pattern.sourcePaths,
        candidatePath: ranking.candidate.path,
        candidateName: ranking.candidate.name,
        confidence: confidence.score,
        evidence: confidence.reasons
      });
    }
    return findings;
  }
};

// src/analysis/missingAbstractionDetector.ts
var MissingAbstractionDetector = class {
  detect(context, patterns, confidenceScores) {
    return patterns.filter((pattern) => pattern.sourcePaths.length >= 2).filter((pattern) => {
      const confidence = confidenceScores.find(
        (score) => score.patternId === pattern.id
      );
      return confidence === void 0 || confidence.score < context.config.warningThreshold;
    }).map((pattern) => ({
      kind: "missing-abstraction",
      sourcePaths: pattern.sourcePaths,
      evidence: ["repeated local pattern without strong candidate"]
    }));
  }
};

// src/analysis/repositoryPatternDetector.ts
var RepositoryPatternDetector = class {
  detect(knowledge, roles) {
    const localFacts = knowledge.allFacts().filter((facts) => isLocalPath2(facts.path, roles));
    if (localFacts.length < 2) {
      return [];
    }
    return groupByFeatureSignature(localFacts);
  }
};
function groupByFeatureSignature(localFacts) {
  const groups = /* @__PURE__ */ new Map();
  for (const facts of localFacts) {
    const signature = structureSignature(facts);
    if (signature === "") {
      continue;
    }
    groups.set(signature, [...groups.get(signature) ?? [], facts]);
  }
  const patterns = [];
  for (const [signature, members] of [...groups.entries()].sort()) {
    if (members.length < 2) {
      continue;
    }
    const repeatedFeatures = repeatedByName2(
      members.flatMap(
        (facts) => facts.features.filter((feature) => isPatternFeature2(feature))
      ),
      featureIdentity2
    );
    if (repeatedFeatures.length === 0) {
      continue;
    }
    patterns.push({
      id: `repository-pattern-${patterns.length + 1}`,
      sourcePaths: members.map((facts) => facts.path).sort(),
      features: repeatedFeatures,
      // Declaration names of the files taking part in the pattern. This was
      // hardcoded to an empty array, which silently zeroed the name-overlap
      // term in every similarity score computed in health mode.
      names: declarationNames(members, signature)
    });
  }
  return patterns;
}
function structureSignature(facts) {
  return [
    ...new Set(
      facts.features.filter((feature) => feature.category === "structure").map((feature) => `${feature.key}:${feature.value}`)
    )
  ].sort().join("|");
}
function declarationNames(members, signature) {
  const names = /* @__PURE__ */ new Set();
  for (const facts of members) {
    for (const declaration of facts.declarations) {
      if (declaration.name !== void 0) {
        names.add(declaration.name);
      }
    }
  }
  for (const entry of signature.split("|")) {
    const value = entry.split(":")[1];
    if (value !== void 0 && value !== "") {
      names.add(value);
    }
  }
  return [...names].sort();
}
function isPatternFeature2(feature) {
  return feature.category === "structure" || feature.category === "style";
}
function featureIdentity2(feature) {
  return `${feature.category}:${feature.key}:${feature.value}`;
}
function isLocalPath2(path, roles) {
  return roles.some(
    (role) => role.scope === "file" && role.path === path && role.role === "local"
  );
}
function repeatedByName2(values, nameFor) {
  const counts = /* @__PURE__ */ new Map();
  for (const value of values) {
    const name = nameFor(value);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const seen = /* @__PURE__ */ new Set();
  const repeated = [];
  for (const value of values) {
    const name = nameFor(value);
    if ((counts.get(name) ?? 0) > 1 && !seen.has(name)) {
      seen.add(name);
      repeated.push(value);
    }
  }
  return repeated;
}

// src/analysis/unusedAbstractionDetector.ts
var UnusedAbstractionDetector = class {
  detect(knowledge, roles, candidates) {
    return candidates.filter((candidate) => isShared(candidate, roles)).filter(
      (candidate) => (knowledge.usageForPath(candidate.path)?.fileReferenceCount ?? 0) === 0
    ).map((candidate) => ({
      kind: "unused-abstraction",
      candidatePath: candidate.path,
      candidateName: candidate.name,
      evidence: ["shared candidate has zero references"]
    }));
  }
};
function isShared(candidate, roles) {
  return roles.some(
    (role) => role.path === candidate.path && role.role === "shared" && (role.name === void 0 || role.name === candidate.name)
  );
}

// src/runner/repositoryHealthRunner.ts
var RepositoryHealthRunner = class {
  constructor(roleAnalyzer = new RoleAnalyzer(), candidateDiscovery = new CandidateDiscovery(), patternDetector = new RepositoryPatternDetector(), similarityScorer = new SimilarityScorer(), ranker = new CandidateRanker(), confidenceCalculator = new ConfidenceCalculator(), unusedDetector = new UnusedAbstractionDetector(), competingDetector = new CompetingImplementationDetector(), missingDetector = new MissingAbstractionDetector(), resultAssembler = new RepositoryHealthResultAssembler()) {
    this.roleAnalyzer = roleAnalyzer;
    this.candidateDiscovery = candidateDiscovery;
    this.patternDetector = patternDetector;
    this.similarityScorer = similarityScorer;
    this.ranker = ranker;
    this.confidenceCalculator = confidenceCalculator;
    this.unusedDetector = unusedDetector;
    this.competingDetector = competingDetector;
    this.missingDetector = missingDetector;
    this.resultAssembler = resultAssembler;
  }
  roleAnalyzer;
  candidateDiscovery;
  patternDetector;
  similarityScorer;
  ranker;
  confidenceCalculator;
  unusedDetector;
  competingDetector;
  missingDetector;
  resultAssembler;
  run(knowledge, input) {
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
      )
    });
  }
};
function intelligenceSignals(knowledge) {
  return {
    topReferencedFiles: knowledge.usage().filter((usage) => usage.fileReferenceCount > 0).sort((a, b) => b.fileReferenceCount - a.fileReferenceCount || a.path.localeCompare(b.path)).slice(0, 10).map((usage) => ({
      path: usage.path,
      referenceCount: usage.fileReferenceCount,
      topDeclarations: usage.declarationReferences.filter((declaration) => declaration.referenceCount > 0).sort(
        (a, b) => b.referenceCount - a.referenceCount || a.name.localeCompare(b.name)
      ).slice(0, 5)
    })),
    unresolvedImports: unresolvedImportSignals(knowledge),
    duplicateDeclarations: duplicateDeclarationSignals(knowledge)
  };
}
function unresolvedImportSignals(knowledge) {
  const importersBySource = /* @__PURE__ */ new Map();
  const localPrefixes = localModulePrefixes(knowledge);
  for (const relationship of knowledge.relationships()) {
    if (relationship.resolution !== "unresolved" || !isLocalSourceModule(relationship.sourceModule, localPrefixes)) {
      continue;
    }
    const importers = importersBySource.get(relationship.sourceModule) ?? /* @__PURE__ */ new Set();
    importers.add(relationship.importerPath);
    importersBySource.set(relationship.sourceModule, importers);
  }
  return [...importersBySource.entries()].map(([sourceModule, importers]) => ({
    sourceModule,
    importerCount: importers.size,
    sampleImporters: [...importers].sort().slice(0, 5)
  })).sort(
    (a, b) => b.importerCount - a.importerCount || a.sourceModule.localeCompare(b.sourceModule)
  ).slice(0, 10);
}
function localModulePrefixes(knowledge) {
  const prefixes = /* @__PURE__ */ new Set();
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
function isLocalSourceModule(sourceModule, localPrefixes) {
  if (sourceModule.startsWith(".") || sourceModule.startsWith("/")) {
    return true;
  }
  return [...localPrefixes].some(
    (prefix) => sourceModule === prefix || sourceModule.startsWith(`${prefix}.`)
  );
}
function duplicateDeclarationSignals(knowledge) {
  const pathsByName = /* @__PURE__ */ new Map();
  for (const facts of knowledge.allFacts()) {
    for (const declaration of facts.declarations) {
      if (declaration.name === void 0 || declaration.name.length < 3) {
        continue;
      }
      const paths = pathsByName.get(declaration.name) ?? /* @__PURE__ */ new Set();
      paths.add(facts.path);
      pathsByName.set(declaration.name, paths);
    }
  }
  return [...pathsByName.entries()].map(([name, paths]) => ({
    name,
    paths: [...paths].sort()
  })).filter((entry) => entry.paths.length > 1).sort(
    (a, b) => b.paths.length - a.paths.length || a.name.localeCompare(b.name)
  ).slice(0, 10);
}
function repositoryIntelligence(knowledge, capabilities) {
  const relationships = knowledge.relationships();
  const resolvedRelationships = relationships.filter(
    (entry) => entry.resolution === "resolved"
  ).length;
  const relationshipQuality = relationshipIntelligenceQuality(
    relationships.length,
    resolvedRelationships,
    hasAvailable2(capabilities, "declaration-extraction")
  );
  const hasDeclarationProvider = hasAvailable2(
    capabilities,
    "declaration-extraction"
  );
  const hasUiProvider = hasAvailable2(capabilities, "ui-extraction");
  const areas = [
    area2("repository-structure", "Repository Structure", "complete", "high", "built-in repository intelligence"),
    area2("directory-topology", "Directory Topology", "complete", "high", "built-in repository intelligence"),
    area2("duplicate-file-detection", "Duplicate File Detection", "complete", "high", "built-in repository intelligence"),
    area2("naming-analysis", "Naming Analysis", "complete", "high", "built-in repository intelligence"),
    area2(
      "declaration-analysis",
      "Declaration Analysis",
      hasDeclarationProvider ? "partial" : "unavailable",
      hasDeclarationProvider ? "medium" : "not-available",
      providerReason(capabilities, "declaration-extraction", "no declaration knowledge provider installed")
    ),
    area2(
      "relationship-analysis",
      "Relationship Analysis",
      relationshipQuality.coverage,
      relationshipQuality.confidence,
      relationships.length === 0 ? "no imports requiring relationship resolution" : `${resolvedRelationships}/${relationships.length} repository-local import relationships resolved`
    ),
    area2(
      "ui-semantics",
      "UI Semantics",
      hasUiProvider ? "partial" : "unavailable",
      hasUiProvider ? "medium" : "not-available",
      providerReason(capabilities, "ui-extraction", "no UI knowledge provider installed")
    ),
    area2(
      "framework-intelligence",
      "Framework Intelligence",
      hasUiProvider ? "partial" : "unavailable",
      hasUiProvider ? "medium" : "not-available",
      hasUiProvider ? "framework-specific UI provider contributed facts" : "no framework knowledge provider installed"
    )
  ];
  return {
    areas,
    unavailable: areas.filter((entry) => entry.coverage === "unavailable").map((entry) => ({ name: entry.name, reason: entry.reason })),
    providers: knowledgeProviders(capabilities)
  };
}
function area2(id, name, coverage, confidence, reason) {
  return { id, name, coverage, confidence, reason };
}
function relationshipIntelligenceQuality(relationshipCount, resolvedRelationshipCount, hasDeclarationProvider) {
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
function hasAvailable2(capabilities, id) {
  return capabilities.some(
    (capability) => capability.id === id && capability.status === "available"
  );
}
function providerReason(capabilities, id, fallback) {
  const capability = capabilities.find((entry) => entry.id === id);
  return capability?.status === "available" ? `${capability.reason} knowledge provider` : fallback;
}
function knowledgeProviders(capabilities) {
  const providers = /* @__PURE__ */ new Map([
    ["built-in", "Built-in Repository Intelligence"]
  ]);
  for (const capability of capabilities) {
    if (capability.status !== "available" || capability.reason === "built-in") {
      continue;
    }
    for (const name of capability.reason.split(", ")) {
      providers.set(providerId(name), name);
    }
  }
  return [...providers.entries()].map(([id, name]) => ({ id, name }));
}
function providerId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
}
function semanticSummary(knowledge) {
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

// src/cli.ts
var program = new Command();
program.name("component-intent-audit").description(
  "Analyze repository knowledge and health using registered extractors."
).version(version).option("--diff", "analyze the current diff").option("--health", "analyze repository health without reading Git diff").option("--json", "emit JSON output").option("--markdown", "emit Markdown output").action((options) => {
  try {
    const reporter = options.json === true ? new JsonReporter() : options.markdown === true ? new MarkdownReporter() : new TextReporter();
    const construction = new KnowledgePipelineRunner().construct(process.cwd());
    const result = construction.status === "limited" ? new RepositoryHealthResultAssembler().assembleLimited(construction) : options.health === true ? new RepositoryHealthRunner().run(construction.knowledge, {
      capabilities: construction.capabilities,
      repositoryStructure: construction.repositoryStructure
    }) : new ChangeAnalysisRunner().run(
      construction.knowledge,
      new GitChangedFileProvider().getChangedFiles(
        construction.knowledge.context
      )
    );
    console.log(reporter.render(result));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
});
program.parse();
