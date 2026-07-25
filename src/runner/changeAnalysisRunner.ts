import { CandidateDiscovery } from "../analysis/candidateDiscovery";
import { CandidateRanker } from "../analysis/candidateRanker";
import { ChangedFactsProjector } from "../analysis/changedFactsProjector";
import { ChangedPatternDetector } from "../analysis/changedPatternDetector";
import { ChangeAnalysisResultAssembler } from "../analysis/changeAnalysisResultAssembler";
import { ConfidenceCalculator } from "../analysis/confidenceCalculator";
import { RoleAnalyzer } from "../analysis/roleAnalyzer";
import { SimilarityScorer } from "../analysis/similarityScorer";
import { SourceOfTruthWarningGenerator } from "../analysis/sourceOfTruthWarningGenerator";
import type { ChangeAnalysisResult } from "../model/changeAnalysisResult";
import type { ChangedFile } from "../model/diff";
import type { RepositoryKnowledge } from "../model/repositoryKnowledge";

// Runs change analysis mode from repository knowledge and changed files.
// This runner reuses shared reasoning stages and contains no knowledge construction.
export class ChangeAnalysisRunner {
  constructor(
    private readonly roleAnalyzer = new RoleAnalyzer(),
    private readonly candidateDiscovery = new CandidateDiscovery(),
    private readonly changedProjector = new ChangedFactsProjector(),
    private readonly patternDetector = new ChangedPatternDetector(),
    private readonly similarityScorer = new SimilarityScorer(),
    private readonly ranker = new CandidateRanker(),
    private readonly confidenceCalculator = new ConfidenceCalculator(),
    private readonly warningGenerator = new SourceOfTruthWarningGenerator(),
    private readonly resultAssembler = new ChangeAnalysisResultAssembler()
  ) {}

  run(
    knowledge: RepositoryKnowledge,
    changedFiles: ChangedFile[]
  ): ChangeAnalysisResult {
    const changedArtifacts = changedFiles
      .map((changedFile) => knowledge.artifactForPath(changedFile.path))
      .filter((artifact) => artifact !== undefined);
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
}
