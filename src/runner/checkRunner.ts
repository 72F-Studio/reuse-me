import { CandidateDiscovery } from "../analysis/candidateDiscovery";
import { CandidateRanker } from "../analysis/candidateRanker";
import { RoleAnalyzer } from "../analysis/roleAnalyzer";
import { SimilarityScorer } from "../analysis/similarityScorer";
import type { ChangeAnalysisResult } from "../model/changeAnalysisResult";
import type { ObservedPattern } from "../model/observedPattern";
import type { RepositoryFacts } from "../model/repositoryFacts";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";
import type { SourceOfTruthWarning } from "../model/sourceOfTruthWarning";

// Checks named files against the abstractions the repository already has.
//
// Change analysis asks whether several changed files repeat *each other*, and
// needs at least two of them to say anything. Prevention asks a different
// question about a single file: does this one re-implement something that
// already exists? An agent writes one file at a time, so a check that needs a
// second copy before it speaks arrives exactly one duplication too late.
//
// One file is therefore treated as a pattern in its own right. The
// weak-pattern penalty that change analysis applies to single-file evidence is
// not applied here, because a single file is the unit of interest rather than
// thin evidence for a repeated one.
export class CheckRunner {
  constructor(
    private readonly roleAnalyzer = new RoleAnalyzer(),
    private readonly candidateDiscovery = new CandidateDiscovery(),
    private readonly similarityScorer = new SimilarityScorer(),
    private readonly ranker = new CandidateRanker()
  ) {}

  run(knowledge: RepositoryKnowledge, paths: string[]): ChangeAnalysisResult {
    const roles = this.roleAnalyzer.analyze(knowledge);
    const candidates = this.candidateDiscovery.discover(knowledge, roles);
    const threshold = knowledge.context.config.warningThreshold;
    const warnings: SourceOfTruthWarning[] = [];

    for (const path of paths) {
      const facts = knowledge.factsForPath(path);

      if (facts === undefined) {
        continue;
      }

      // A shared component is allowed to look like itself.
      if (isShared(roles, path)) {
        continue;
      }

      const pattern = patternForFile(path, facts);

      if (pattern.features.length === 0) {
        continue;
      }

      const candidatesElsewhere = candidates.filter(
        (candidate) => candidate.path !== path
      );
      const similarities = this.similarityScorer.score(
        [pattern],
        candidatesElsewhere,
        knowledge
      );
      const top = this.ranker
        .rank(similarities, roles, knowledge.usage())
        .find((ranking) => ranking.rank === 1);

      if (top === undefined || top.score < threshold) {
        continue;
      }

      warnings.push({
        changedFiles: [path],
        candidatePath: top.candidate.path,
        candidateName: top.candidate.name,
        confidence: top.score,
        evidence: top.reasons
      });
    }

    return {
      mode: "change",
      warnings,
      metadata: {
        changedFileCount: paths.length,
        warningCount: warnings.length
      }
    };
  }
}

function patternForFile(path: string, facts: RepositoryFacts): ObservedPattern {
  const features = facts.features.filter(
    (feature) => feature.category === "structure" || feature.category === "style"
  );
  const names = new Set<string>();

  for (const declaration of facts.declarations) {
    if (declaration.name !== undefined) {
      names.add(declaration.name);
    }
  }

  for (const feature of features) {
    if (feature.category === "structure") {
      names.add(feature.value);
    }
  }

  return {
    id: `check-${path}`,
    sourcePaths: [path],
    features,
    names: [...names].sort()
  };
}

function isShared(
  roles: { scope: string; path: string; role: string }[],
  path: string
): boolean {
  return roles.some(
    (role) => role.scope === "file" && role.path === path && role.role === "shared"
  );
}
