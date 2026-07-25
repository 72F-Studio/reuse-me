# Revised Execution Roadmap

## Conclusion

The remaining roadmap should be reordered. The current plan jumps from declaration facts straight into JSX fingerprints, but the product needs to answer "what is the governing abstraction?" before it can compare local UI structure. That requires repository-level relationships first: which declarations are exported, imported, reused, and referenced by changed files.

JSX fingerprints still remain, but they should move later. They are evidence for similarity, not the foundation of source-of-truth reasoning.

## Task Review

| Original Task | Decision | Reason |
|---|---|---|
| `T10 Extract JSX Fingerprints` | Move later | JSX shape is useful only after we know candidate declarations and relationships. |
| `T11 Extract Class And Style Tokens` | Move later, after JSX facts | Style tokens are similarity evidence, not repository structure. |
| `T12 Build Component Inventory` | Split and move earlier | "Inventory" currently mixes scanning, declarations, relationships, fingerprints, and import counts. Split into fact index and candidate projection. |
| `T13 Classify Component Role` | Keep, but after relationship facts | Shared vs leaf needs import counts and path evidence. |
| `T14 Extract Changed JSX Signals` | Move after JSX/style facts | Changed UI signals should be derived from existing parsed/fact representations. |
| `T15 Detect Repeated Local Patterns` | Keep after changed UI facts | This is the first local-diff reasoning stage. |
| `T16 Compute Similarity` | Keep after candidate and changed-pattern stages | Similarity needs both sides already represented. |
| `T17 Rank Candidate Components` | Keep after similarity | Ranking consumes facts, roles, and similarity evidence. |
| `T18 Calculate Confidence` | Keep after ranking | Confidence should summarize evidence and penalties. |
| `T19 Generate Warnings` | Keep after confidence | Warning generation is product output, not analysis. |
| `T20-T22 Reporters` | Keep after warnings | Output formatting remains last-mile. |
| `T23-T24 E2E Fixtures` | Move earlier in thin form, then expand | Need fixture pressure before tuning heuristics too deeply. |
| `T25 README Usage` | Keep near end | Only document once CLI behavior exists. |
| `T26 Dogfood` | Keep final | Needs warning flow and fixtures first. |

## Missing Prerequisites

| Missing Stage | Why Needed |
|---|---|
| `RepositoryFactsIndex` | The system needs a repository-wide view of facts before it can compute import counts, declaration reuse, and source-of-truth candidates. |
| `ReferenceRelationshipFacts` | Imports and exports are not enough; we need relationships from import usage to exported declarations. |
| `ChangedFactsProjection` | Changed files should be represented as facts before JSX-specific changed signals are derived. |

## Revised Roadmap

| Stage | Responsibility | Input | Output | Why It Exists | Why Here |
|---|---|---|---|---|---|
| 1. Repository Fact Collection | Parse all relevant UI files and build `RepositoryFacts[]`. | `RepositoryContext`, `UiFile[]`, `ParsedSource[]` | `RepositoryFacts[]` | Establishes a fact base for the repository. | First stage after current completed facts. |
| 2. Repository Facts Index | Index facts by path, declaration name, export, and import source. | `RepositoryFacts[]` | `RepositoryFactsIndex` | Makes facts queryable without rescanning arrays everywhere. | Required before relationship derivation. |
| 3. Import/Export Relationship Facts | Link imports to possible exported declarations where resolvable. | `RepositoryFactsIndex` | enriched `RepositoryFactsIndex` or `RelationshipFacts` | Computes observable dependency relationships. | Source-of-truth candidates depend on reuse relationships. |
| 4. Declaration Usage Counts | Count how often declarations/files are referenced. | `RelationshipFacts`, `RepositoryFactsIndex` | `UsageFacts` | Provides reuse evidence for governing abstractions. | Needed before classifying shared vs leaf. |
| 5. File Role Classification | Classify files/declarations as likely shared, likely leaf, or unknown. | `RepositoryFacts`, `UsageFacts`, config, `UiFile[]` | `RoleFacts` | Separates reusable candidates from local implementation files. | Should use actual usage, not just paths. |
| 6. Abstraction Candidate Projection | Project declarations into candidate governing abstractions. | `DeclarationFacts`, `RoleFacts`, `UsageFacts` | `AbstractionCandidate[]` | Creates the candidate set the product will rank later. | Must happen before similarity. |
| 7. JSX Structure Facts | Extract JSX element/component structure from parsed sources. | `ParsedSource[]`, `RepositoryFacts[]` | enriched `RepositoryFacts` with JSX facts | Adds structural evidence for components. | Now useful because candidates already exist. |
| 8. Style Token Facts | Extract static class/style tokens from parsed sources. | `ParsedSource[]`, `RepositoryFacts[]` | enriched `RepositoryFacts` with style facts | Adds visual similarity evidence. | Depends naturally on JSX/source traversal. |
| 9. Changed Facts Projection | Select repository facts corresponding to changed files. | `ChangedFile[]`, `UiFile[]`, `RepositoryFactsIndex` | `ChangedFacts[]` | Creates the local-change side of the comparison. | Before repeated-pattern detection. |
| 10. Repeated Local Pattern Detection | Detect repeated JSX/style/declaration patterns across changed leaf files. | `ChangedFacts[]`, `RoleFacts` | `RepeatedLocalPattern[]` | Identifies the original failure mode: screen-level repeated patches. | Requires changed facts and leaf classification. |
| 11. Candidate Similarity Scoring | Compare repeated local patterns against abstraction candidates. | `RepeatedLocalPattern[]`, `AbstractionCandidate[]`, JSX/style facts | `SimilarityResult[]` | Measures whether an existing shared abstraction matches the local patch. | Only meaningful after both sides are represented. |
| 12. Candidate Ranking | Rank likely governing abstraction candidates. | `SimilarityResult[]`, `UsageFacts`, `RoleFacts` | `CandidateRanking[]` | Produces "inspect this shared component first." | Consumes all evidence types. |
| 13. Confidence Calculation | Convert ranking evidence into bounded warning strength. | `CandidateRanking[]`, repeated-pattern facts | `ConfidenceScore[]` | Keeps warnings conservative and explainable. | After ranking. |
| 14. Warning Generation | Create actionable source-of-truth warnings. | rankings, confidence, changed files | `SourceOfTruthWarning[]` | Product-facing recommendation. | After evidence is complete. |
| 15. Output Formatting | Render text, JSON, Markdown. | `AnalysisResult` | stdout strings | Separates presentation from analysis. | Last stage. |
| 16. Fixture Coverage | Add positive and negative fixture repositories around the full pipeline. | CLI pipeline | integration tests | Prevents heuristic drift. | Once the first full warning can run. |
| 17. README And Examples | Document current real behavior and limitations. | working CLI | docs | Makes tool usable. | After behavior stabilizes. |
| 18. Dogfood | Run on real repos and record false positives/negatives. | working CLI | dogfood notes | Validates product signal. | Final V1 validation step. |

## Natural Boundaries

| Boundary | Owns | Must Not Own |
|---|---|---|
| Discovery | repo context, changed files, UI files | semantic analysis |
| Parsing | source text and AST | imports, components, JSX interpretation |
| Fact Extraction | syntax-level facts | ranking or warnings |
| Fact Indexing | lookup and relationship support | product decisions |
| Candidate Projection | likely reusable abstractions | warning text |
| Changed Projection | changed local facts | repository-wide inference |
| Similarity | pattern comparison | confidence policy |
| Ranking | candidate ordering | final user recommendation |
| Confidence | warning strength | formatting |
| Warning Generation | actionable product object | console rendering |
| Reporting | output format | analysis logic |

## JSX Fingerprints

JSX fingerprints should not be next.

They answer:

```text
What does this UI look structurally like?
```

But the product first needs to answer:

```text
What existing declarations are reusable abstractions?
Which ones are exported?
Which ones are imported broadly?
Which ones are touched by the changed files?
```

Without symbol and relationship facts, JSX similarity has no good candidate universe. It would compare shapes before knowing which shapes belong to governing abstractions. That pushes the system toward superficial visual matching instead of the product goal: redirecting Claude to the correct shared component.

The better order is:

```text
facts -> relationships -> usage -> roles -> candidates -> JSX/style evidence -> similarity -> ranking -> warning
```

That is the compiler-like pipeline this implementation has naturally revealed.

