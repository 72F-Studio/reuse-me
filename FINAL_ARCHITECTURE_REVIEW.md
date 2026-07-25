# Final Architecture Review

The architecture should introduce a first-class `RepositoryKnowledge` model.

Without it, later stages will pass around `RepositoryFacts[]`, indexes, relationships, usage facts, roles, candidates, JSX facts, style facts, and configuration as separate arguments. That creates accidental coupling. Each new stage would need to know which collections are current, which are derived, and which combinations are valid.

`RepositoryKnowledge` becomes the single source of truth for everything known about the repository after Knowledge Construction.

## Final Architecture

```text
Repository
  |
  v
RepositoryContext
  |
  v
Knowledge Construction
  |
  v
RepositoryKnowledge
  |
  v
Shared Reasoning
  |
  +-------------------------+
  |                         |
  v                         v
Change Analysis        Repository Health
  |                         |
  v                         v
ChangeAnalysisResult   RepositoryHealthResult
  |
  v
Reporters
```

The important boundary is:

```text
Before RepositoryKnowledge: observe and extract.
After RepositoryKnowledge: query and reason.
```

## RepositoryKnowledge

### Responsibilities

`RepositoryKnowledge` should encapsulate:

- repository context
- discovered source files
- classified UI files
- parsed source references if still needed internally
- repository facts
- fact index
- relationship facts
- usage facts
- JSX structure facts
- style token facts

It should answer repository-level questions through query methods, not expose every internal collection as the default interaction model.

Examples:

```ts
knowledge.files()
knowledge.factsForPath(path)
knowledge.relationshipsForPath(path)
knowledge.usageForPath(path)
knowledge.declarationsByName(name)
knowledge.exportsByName(name)
knowledge.importsFrom(path)
knowledge.uiFiles()
```

Keep it boring. No lazy graph engine, no cache layer, no plugin registry.

### Boundaries

`RepositoryKnowledge` owns stable repository knowledge only.

It must not own:

- Git diff state
- changed file projections
- warnings
- health findings
- output formatting
- CLI behavior
- mode-specific thresholds beyond shared config access

### What Becomes Internal

These models can remain exported for tests and extension, but should become implementation details behind `RepositoryKnowledge` for normal pipeline consumers:

- `RepositoryFacts[]`
- `RepositoryFactsIndex`
- `RelationshipFact[]`
- `UsageFact[]`
- `ParsedSource[]`

These remain useful as domain models, but later stages should not receive five parallel arrays when one coherent knowledge object is available.

### What Stays Public

These should be treated as public pipeline APIs:

- `RepositoryContext`
- `RepositoryKnowledge`
- `RoleFact`
- `AbstractionCandidate`
- `ObservedPattern`
- `SimilarityResult`
- `CandidateRanking`
- `ConfidenceScore`
- `ChangeAnalysisResult`
- `RepositoryHealthResult`

## Final Pipeline

### Knowledge Construction

```text
RepositoryContext
-> SourceFileDiscovery
-> UiFileClassification
-> SourceParsing
-> RepositoryFactExtraction
-> JSXStructureExtraction
-> StyleTokenExtraction
-> FactIndexing
-> RelationshipAnalysis
-> UsageAnalysis
-> RepositoryKnowledgeAssembly
```

Knowledge construction should produce exactly one public output:

```ts
RepositoryKnowledge
```

### Shared Reasoning

```text
RepositoryKnowledge
-> RoleAnalysis
-> CandidateDiscovery
```

These can be modeled as queries/derivations over `RepositoryKnowledge`.

Output:

```ts
RoleFact[]
AbstractionCandidate[]
```

### Change Analysis

```text
RepositoryKnowledge
ChangedFile[]
RoleFact[]
AbstractionCandidate[]
  |
  v
ChangedFactsProjection
-> ChangedPatternDetection
-> SimilarityScoring
-> CandidateRanking
-> ConfidenceCalculation
-> SourceOfTruthWarningGeneration
-> ChangeAnalysisResult
```

Change analysis is the only branch that consumes Git changes.

### Repository Health

```text
RepositoryKnowledge
RoleFact[]
AbstractionCandidate[]
  |
  v
RepositoryPatternDetection
-> SimilarityScoring
-> CandidateRanking
-> ConfidenceCalculation
-> HealthFindingGeneration
-> RepositoryHealthResult
```

Health mode never reads Git diff.

## Stage Review

| Stage | Keep As Stage? | Reason |
|---|---:|---|
| Source File Discovery | Yes | Produces initial repository file set. |
| UI File Classification | Yes | Derives path-based file facts. |
| Source Parsing | Yes | Creates reusable parsed representation. |
| Repository Fact Extraction | Yes | Extracts syntax facts. |
| JSX Structure Extraction | Yes | Extracts syntax evidence. |
| Style Token Extraction | Yes | Extracts syntax evidence. |
| Repository Facts Index | Internal to `RepositoryKnowledge` | Consumers should query knowledge, not the raw index. |
| Relationship Analysis | Yes, but internal to knowledge construction | Relationships are repository knowledge. |
| Usage Analysis | Yes, but internal to knowledge construction | Usage is repository knowledge. |
| RepositoryKnowledge Assembly | Yes | Establishes the public boundary. |
| Role Analysis | Could be query-backed | It is reasoning over knowledge. Keep as service for testability. |
| Candidate Discovery | Could be query-backed | It is reasoning over knowledge. Keep as service for testability. |
| Changed Facts Projection | Yes | Mode-specific projection. |
| Changed Pattern Detection | Yes | Change-only pattern producer. |
| Repository Pattern Detection | Yes | Health-only pattern producer. |
| Similarity Scoring | Yes | Shared reasoning primitive. |
| Candidate Ranking | Yes | Shared reasoning primitive. |
| Confidence Calculation | Yes | Shared policy primitive. |
| Warning Generation | Yes | Change-only output creation. |
| Health Finding Generation | Yes | Health-only output creation. |
| Reporters | Yes | Presentation boundary. |

## Public APIs

Minimal public surface:

```ts
interface RepositoryKnowledge {
  context: RepositoryContext;

  files(): UiFile[];
  factsForPath(path: string): RepositoryFacts | undefined;
  allFacts(): RepositoryFacts[];

  declarationsByName(name: string): IndexedDeclaration[];
  exportsByName(name: string): IndexedExport[];
  importsBySource(sourceModule: string): IndexedImport[];

  relationships(): RelationshipFact[];
  relationshipsForPath(path: string): RelationshipFact[];

  usage(): UsageFact[];
  usageForPath(path: string): UsageFact | undefined;
}
```

Pipeline services should prefer:

```ts
RoleAnalyzer.analyze(knowledge)
CandidateDiscovery.discover(knowledge, roles)
ChangedFactsProjector.project(knowledge, changedFiles, changedUiFiles)
RepositoryPatternDetector.detect(knowledge, roles)
```

Avoid APIs like:

```ts
analyze(facts, index, relationships, usage, config, uiFiles)
```

That is the complexity leak this review is removing.

## Internal Models

Internal or semi-internal:

- `SourceFileCandidate`
- `ParsedSource`
- `RepositoryFactsIndex`
- `IndexedDeclaration`
- `IndexedExport`
- `IndexedImport`

Shared but lower-level:

- `RepositoryFacts`
- `RelationshipFact`
- `UsageFact`

Mode-specific:

- `ChangedFacts`
- `SourceOfTruthWarning`
- `UnusedAbstractionFinding`
- `CompetingImplementationFinding`
- `MissingAbstractionFinding`

## Stable Extension Points

Keep these stable:

- fact extractors
- relationship analyzers
- role analyzers
- candidate discovery
- pattern producers
- similarity scorers
- reporters

Do not introduce a plugin system yet. Plain functions/classes are enough. The extension point is the interface, not a framework.

## Architectural Principles

1. Build knowledge once.
2. Query knowledge everywhere else.
3. Git diff is a mode input, not repository knowledge.
4. Repository health must not depend on Git.
5. Facts are not recommendations.
6. Reasoning stages must preserve evidence.
7. Mode-specific stages must not reimplement shared analysis.
8. Reporters must never analyze.
9. Ambiguity should be represented, not hidden.
10. Add framework support at extraction boundaries, not reasoning boundaries.

Final simplification:

```text
RepositoryKnowledge is the product's core abstraction.
Everything before it constructs knowledge.
Everything after it asks a question of that knowledge.
```
