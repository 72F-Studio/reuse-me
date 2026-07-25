# Remaining Implementation Tasks

This document converts the revised execution roadmap into incremental implementation tasks beginning immediately after the completed foundational work.

Completed work:

- `RepositoryContext`
- `ChangedFile`
- `UiFile`
- `ParsedSource`
- `RepositoryFacts`
- Declaration extraction
- Import/export fact extraction

The obsolete task numbers beyond the completed work are intentionally not preserved. Each remaining task implements one pipeline stage, introduces either one representation or one analysis, and leaves the repository buildable.

## Final Ordering Review

The revised roadmap is sound. The remaining stages should continue moving from observable facts toward product recommendations:

```text
repository files
-> parsed sources
-> repository facts
-> fact index
-> relationships
-> usage
-> roles
-> candidates
-> JSX/style evidence
-> changed projections
-> repeated local patterns
-> similarity
-> ranking
-> confidence
-> warnings
-> reports
```

One ordering refinement is needed before the first roadmap stage: repository fact collection requires a repository-wide source file discovery stage. The current implementation can classify changed files, but it does not yet discover all candidate UI files in the repository. Without that, relationship and usage analysis would be limited to changed files and could not identify shared components reliably.

Therefore, the remaining task list begins with `Stage - Source File Discovery`, then proceeds to repository fact collection.

---

## Stage - Source File Discovery

### Objective

Implement repository-wide source file discovery for UI analysis. This stage finds source files that may contain reusable components or screens, based on configuration and repository-observable paths. It creates the repository-wide input set needed for later fact collection.

### Scope

Implement:

- Source file candidate model
- Source file discovery stage
- Directory traversal using configured shared component and screen/page directories
- Ignore pattern support using existing configuration fields
- Unit tests with temporary fixture directories

Do not implement:

- Source parsing
- Component detection
- Import/export extraction
- Git diff reading
- Similarity analysis
- Ranking
- Warnings

### Inputs

- `RepositoryContext`

### Outputs

- `SourceFileCandidate[]`

### Design Constraints

- Discovery must be independent of Git changes.
- Discovery must not inspect source contents.
- Discovery must use repository-relative paths.
- Later stages must not rediscover repository files independently.
- Unsupported file extensions should be ignored conservatively.
- Missing configured directories should not fail the pipeline; they should produce no candidates.

### Acceptance Criteria

- Source file candidates are discovered from configured directories.
- Non-source files are ignored.
- Ignore patterns are respected.
- Missing directories are handled safely.
- Paths are repository-relative.
- Existing tests pass.
- Unit tests cover shared component directories, screen/page directories, ignored files, unsupported files, and missing directories.
- Build succeeds.

### Design Notes

This stage exists because the product needs repository-wide knowledge of potential shared components, not only changed files. It appears before repository fact collection because fact extraction needs a complete file set.

---

## Stage - Repository Fact Collection

### Objective

Implement a pipeline stage that parses discovered UI source files and builds `RepositoryFacts[]` for the repository. This stage composes existing parser and fact builder infrastructure without introducing new semantic analysis.

### Scope

Implement:

- Repository fact collection stage
- Conversion from source file candidates to `UiFile` where needed
- Parsing through the existing `SourceFileParser`
- Fact extraction through the existing `RepositoryFactsBuilder`
- Unit tests for collection behavior

Do not implement:

- New fact kinds
- Relationship analysis
- Usage analysis
- Candidate ranking
- Warnings
- Output formatting

### Inputs

- `RepositoryContext`
- `SourceFileCandidate[]`

### Outputs

- `RepositoryFacts[]`

### Design Constraints

- This stage should orchestrate existing parser and fact builder APIs.
- It should preserve parse failures as facts where existing models allow.
- It must not reinterpret imports, exports, or declarations.
- Later stages should consume `RepositoryFacts[]`, not rerun parsing.

### Acceptance Criteria

- Builds repository facts for discovered source files.
- Handles empty candidate lists.
- Handles parse failures without crashing.
- Existing tests pass.
- Unit tests cover successful collection, empty collection, and parse failure behavior.
- Build succeeds.

### Design Notes

This stage establishes the repository-wide fact base. It appears before indexing because indexes should be derived from the complete fact collection.

---

## Stage - Repository Facts Index

### Objective

Implement a queryable index over `RepositoryFacts[]`. The index should support later stages that need efficient lookup by path, declaration name, export name, and import source.

### Scope

Implement:

- `RepositoryFactsIndex` model
- Index builder
- Lookup by file path
- Lookup by declaration name
- Lookup by exported name
- Lookup by import source
- Unit tests

Do not implement:

- Relationship resolution
- Usage counting
- Candidate discovery
- Ranking
- Warning generation

### Inputs

- `RepositoryFacts[]`

### Outputs

- `RepositoryFactsIndex`

### Design Constraints

- The index must be derived data only.
- The index must not introduce new semantic facts.
- The index must preserve ambiguous matches rather than choosing winners.
- Later stages should use the index instead of scanning arrays ad hoc.

### Acceptance Criteria

- Index can retrieve facts by path.
- Index can retrieve declarations by name.
- Index can retrieve exports by name.
- Index can retrieve imports by source module.
- Ambiguous names return all matches.
- Empty fact collections are handled.
- Existing tests pass.
- Build succeeds.

### Design Notes

This stage exists to create a stable query boundary. It appears before relationship analysis because relationships need repeatable lookup behavior without embedding array traversal logic everywhere.

---

## Stage - Relationship Analysis

### Objective

Implement relationship facts that link imports to resolvable exported declarations or files where possible. This stage derives observable dependency relationships from existing import/export/declaration facts.

### Scope

Implement:

- `RelationshipFact` model
- Relationship analyzer
- Relative import source resolution
- Import-to-export file relationships
- Import-to-declaration relationships when names can be matched
- Unit tests

Do not implement:

- Usage scoring
- Shared component classification
- Candidate ranking
- JSX analysis
- Warnings

### Inputs

- `RepositoryFactsIndex`

### Outputs

- `RelationshipFact[]`

### Design Constraints

- Relationship facts must be evidence, not recommendations.
- Unresolvable imports should be represented safely or skipped according to the model, not guessed.
- Package imports should not be resolved in V1 unless already represented inside repository facts.
- Later stages must not execute module resolution independently.

### Acceptance Criteria

- Resolves relative imports to repository files.
- Links named imports to named exports when possible.
- Links default imports to default exports when possible.
- Handles unresolved imports safely.
- Handles ambiguous exports conservatively.
- Existing tests pass.
- Unit tests cover relative import, named import, default import, unresolved import, and ambiguous match.
- Build succeeds.

### Design Notes

This stage exists because source-of-truth reasoning depends on reuse relationships, not just file names. It appears before usage analysis because usage counts are derived from relationships.

---

## Stage - Usage Analysis

### Objective

Implement usage facts that summarize how often files and declarations are referenced by other files. This stage derives reuse evidence from relationship facts.

### Scope

Implement:

- `UsageFact` model
- Usage analyzer
- File reference counts
- Declaration reference counts when available
- Unit tests

Do not implement:

- Role classification
- Candidate projection
- Similarity analysis
- Confidence calculation
- Warnings

### Inputs

- `RepositoryFactsIndex`
- `RelationshipFact[]`

### Outputs

- `UsageFact[]`

### Design Constraints

- Usage facts must remain descriptive.
- Counts should be deterministic.
- Self-imports or circular relationships should not crash the analyzer.
- Later stages must consume usage facts rather than recomputing counts.

### Acceptance Criteria

- Counts file-level usage.
- Counts declaration-level usage where relationships identify declarations.
- Handles files with zero usage.
- Handles cycles safely.
- Existing tests pass.
- Unit tests cover single usage, multiple usage, zero usage, declaration usage, and cyclic relationships.
- Build succeeds.

### Design Notes

This stage exists because shared components are partly identified by being reused. It appears before role analysis because role classification should use actual reuse evidence instead of path conventions alone.

---

## Stage - Role Analysis

### Objective

Classify files and declarations as likely shared, likely local, likely screen/page, or unknown using configuration, UI file classification, and usage facts. This stage assigns repository roles without producing recommendations.

### Scope

Implement:

- `RoleFact` model
- Role analyzer
- File role classification
- Declaration role classification where supported
- Unit tests

Do not implement:

- Candidate ranking
- Similarity scoring
- Warnings
- JSX analysis
- Component extraction recommendations

### Inputs

- `RepositoryContext`
- `UiFile[]`
- `RepositoryFactsIndex`
- `UsageFact[]`

### Outputs

- `RoleFact[]`

### Design Constraints

- Role classification must be conservative.
- Path evidence and usage evidence should be represented as reasons where possible.
- Unknown should be used when evidence is insufficient.
- Later stages must not infer shared/local roles independently.

### Acceptance Criteria

- Shared component directory files can be classified as likely shared.
- Page/screen directory files can be classified as likely local or screen/page.
- High-use declarations can support shared classification.
- Low evidence files are classified as unknown.
- Existing tests pass.
- Unit tests cover shared path, page path, usage-supported shared role, low evidence unknown, and conflicting evidence.
- Build succeeds.

### Design Notes

This stage exists to separate reusable abstraction candidates from local implementation files. It appears before candidate discovery because candidates should be projected from role-aware facts.

---

## Stage - Candidate Discovery

### Objective

Project declaration facts into candidate governing abstractions. This stage creates the set of shared components or abstractions that later similarity and ranking stages can compare against changed local patterns.

### Scope

Implement:

- `AbstractionCandidate` model
- Candidate discovery stage
- Candidate projection from declarations
- Candidate evidence from role and usage facts
- Unit tests

Do not implement:

- Similarity scoring
- Ranking
- Confidence
- Warnings
- JSX/style extraction

### Inputs

- `RepositoryFactsIndex`
- `RoleFact[]`
- `UsageFact[]`

### Outputs

- `AbstractionCandidate[]`

### Design Constraints

- Candidates must come from repository-observable declarations.
- This stage must not compare candidates to changed files.
- Candidates should preserve evidence, not collapse it into a final score.
- Later stages must only score against these candidates.

### Acceptance Criteria

- Exports in shared component areas become candidates.
- Reused declarations can become candidates.
- Local/screen declarations are excluded unless evidence justifies candidate status.
- Candidate evidence is retained.
- Existing tests pass.
- Unit tests cover shared export candidate, reused declaration candidate, local declaration exclusion, and unknown role handling.
- Build succeeds.

### Design Notes

This stage exists to define the candidate universe before similarity analysis. It appears before JSX/style extraction because structural similarity is only useful once there are meaningful candidates.

---

## Stage - JSX Structure Facts

### Objective

Extract JSX structure facts from parsed source files and enrich `RepositoryFacts`. This stage records structural UI evidence without deciding whether any component should be reused.

### Scope

Implement:

- `JsxStructureFact` model
- JSX structure extractor
- Enrichment of `RepositoryFacts`
- Unit tests

Do not implement:

- Similarity scoring
- Candidate ranking
- Repeated pattern detection
- Warnings
- Style token extraction

### Inputs

- `ParsedSource`
- Existing `RepositoryFacts`

### Outputs

- Enriched `RepositoryFacts`

### Design Constraints

- JSX facts must be syntax-level evidence.
- Extractor should tolerate parse failures.
- React-specific AST traversal should stay isolated.
- Later stages must not traverse ASTs directly for JSX structure.

### Acceptance Criteria

- Extracts JSX element names.
- Extracts referenced component names in JSX.
- Handles nested JSX.
- Handles files without JSX.
- Handles parse failures gracefully.
- Existing tests pass.
- Unit tests cover intrinsic elements, component elements, nesting, no JSX, and parse failure.
- Build succeeds.

### Design Notes

This stage exists to provide structural evidence for later similarity and repeated-pattern detection. It appears after candidate discovery because JSX structure should support source-of-truth reasoning, not replace it.

---

## Stage - Style Token Facts

### Objective

Extract static style and class token facts from parsed source files and enrich `RepositoryFacts`. This stage records visual implementation evidence without making architectural decisions.

### Scope

Implement:

- `StyleTokenFact` model
- Static class token extraction
- Static inline style key extraction where simple
- Enrichment of `RepositoryFacts`
- Unit tests

Do not implement:

- Design token enforcement
- Theme validation
- Similarity scoring
- Ranking
- Warnings

### Inputs

- `ParsedSource`
- Existing `RepositoryFacts`

### Outputs

- Enriched `RepositoryFacts`

### Design Constraints

- Extract only statically observable tokens.
- Do not evaluate expressions.
- Dynamic styles should be skipped or represented as unknown, not guessed.
- Later stages must not inspect source text for style evidence directly.

### Acceptance Criteria

- Extracts static `className` string tokens.
- Extracts static React Native `style` object keys where directly observable.
- Skips dynamic class/style expressions safely.
- Handles parse failures gracefully.
- Existing tests pass.
- Unit tests cover static class names, dynamic class names, inline style keys, no styles, and parse failure.
- Build succeeds.

### Design Notes

This stage exists to add visual similarity evidence. It appears after JSX structure facts because both are source-level evidence, and JSX structure is the stronger, more general signal.

---

## Stage - Changed Facts Projection

### Objective

Project repository facts corresponding to changed UI files into a focused changed-facts representation. This creates the local-change side of later repeated pattern and similarity analysis.

### Scope

Implement:

- `ChangedFacts` model
- Changed facts projector
- Mapping from `ChangedFile[]` to repository facts through the index
- Unit tests

Do not implement:

- Repeated pattern detection
- Similarity scoring
- Candidate ranking
- Warnings

### Inputs

- `ChangedFile[]`
- `UiFile[]`
- `RepositoryFactsIndex`

### Outputs

- `ChangedFacts[]`

### Design Constraints

- This stage must not read Git.
- Deleted files may have no repository facts and must be represented safely or skipped according to the model.
- Later stages should reason over `ChangedFacts[]`, not raw changed files.

### Acceptance Criteria

- Projects modified UI files to changed facts.
- Handles added files.
- Handles deleted files safely.
- Ignores non-UI changed files.
- Existing tests pass.
- Unit tests cover modified UI file, added UI file, deleted file, non-UI file, and missing facts.
- Build succeeds.

### Design Notes

This stage exists to separate repository-wide facts from the changed subset. It appears before repeated local pattern detection because repeated local patterns should be detected only in changed local files.

---

## Stage - Repeated Local Pattern Detection

### Objective

Detect repeated local implementation patterns across changed local files. This stage identifies the failure mode where multiple screens receive similar local patches instead of a shared component being modified.

### Scope

Implement:

- `RepeatedLocalPattern` model
- Pattern detector over changed facts
- Grouping by JSX structure and style token overlap
- Role-aware filtering to focus on local/screen files
- Unit tests

Do not implement:

- Candidate similarity scoring
- Ranking
- Confidence
- Warnings

### Inputs

- `ChangedFacts[]`
- `RoleFact[]`

### Outputs

- `RepeatedLocalPattern[]`

### Design Constraints

- This stage must only identify repeated local patterns.
- It must not decide which shared component should be changed.
- It should prefer false negatives over noisy false positives.
- Later stages must consume repeated patterns, not re-group changed files.

### Acceptance Criteria

- Detects repeated JSX structure across changed local files.
- Detects repeated style tokens across changed local files.
- Requires at least two related changed local files.
- Ignores shared component changes as local pattern evidence.
- Handles empty changed facts.
- Existing tests pass.
- Unit tests cover repeated pattern, single file no pattern, shared file ignored, style overlap, and empty input.
- Build succeeds.

### Design Notes

This stage exists because the original product failure is repeated screen-level patching. It appears after changed facts and role analysis because it must know both what changed and whether those files are local leaves.

---

## Stage - Candidate Similarity Scoring

### Objective

Compare repeated local patterns against abstraction candidates and produce similarity results. This stage measures evidence that an existing shared candidate may govern the local changes.

### Scope

Implement:

- `SimilarityResult` model
- Candidate similarity scorer
- JSX structure similarity
- Style token similarity
- Declaration/name signal similarity where available
- Unit tests

Do not implement:

- Final ranking
- Confidence thresholds
- Warning generation
- Output formatting

### Inputs

- `RepeatedLocalPattern[]`
- `AbstractionCandidate[]`
- `RepositoryFactsIndex`

### Outputs

- `SimilarityResult[]`

### Design Constraints

- Similarity results must expose evidence components, not only a number.
- Scoring must be deterministic.
- No candidate should be fabricated by this stage.
- Later ranking must consume similarity results rather than recomputing similarity.

### Acceptance Criteria

- Produces similarity results for candidate/pattern pairs.
- Includes JSX similarity evidence.
- Includes style token similarity evidence.
- Handles no candidates.
- Handles no repeated patterns.
- Existing tests pass.
- Unit tests cover high similarity, low similarity, no candidates, no patterns, and evidence breakdown.
- Build succeeds.

### Design Notes

This stage exists to connect local repeated patches to existing abstractions. It appears after repeated local pattern detection because similarity needs both the local pattern and the candidate universe.

---

## Stage - Candidate Ranking

### Objective

Rank candidate governing abstractions for each repeated local pattern using similarity, usage, and role evidence. This stage orders candidates but does not decide whether to warn.

### Scope

Implement:

- `CandidateRanking` model
- Candidate ranking stage
- Ranking by similarity evidence
- Ranking tie-breakers using usage and role evidence
- Unit tests

Do not implement:

- Confidence thresholds
- Warning generation
- Reporter output

### Inputs

- `SimilarityResult[]`
- `UsageFact[]`
- `RoleFact[]`

### Outputs

- `CandidateRanking[]`

### Design Constraints

- Ranking must preserve evidence and ordering.
- Ranking must not apply final warning policy.
- Ties should be deterministic.
- Later confidence calculation should consume ranking results directly.

### Acceptance Criteria

- Ranks candidates by similarity.
- Uses usage evidence as a tie-breaker.
- Uses role evidence as a tie-breaker.
- Produces deterministic ordering.
- Handles empty similarity results.
- Existing tests pass.
- Unit tests cover ranking by similarity, usage tie-breaker, role tie-breaker, deterministic ties, and empty input.
- Build succeeds.

### Design Notes

This stage exists to produce "inspect this shared component first" ordering. It appears before confidence because confidence depends on the quality and separation of ranked evidence.

---

## Stage - Confidence Calculation

### Objective

Convert ranking evidence into bounded confidence scores. This stage determines how strongly the system believes a warning should be surfaced, without constructing the warning itself.

### Scope

Implement:

- `ConfidenceScore` model
- Confidence calculator
- Positive evidence weighting
- Penalties for ambiguity and weak evidence
- Unit tests

Do not implement:

- Warning text
- Reporter output
- CLI behavior

### Inputs

- `CandidateRanking[]`
- `RepeatedLocalPattern[]`

### Outputs

- `ConfidenceScore[]`

### Design Constraints

- Confidence must be bounded and deterministic.
- Confidence should expose contributing reasons.
- Ambiguous rankings should reduce confidence.
- Later warning generation must not recalculate confidence.

### Acceptance Criteria

- Calculates bounded confidence scores.
- High confidence requires strong candidate evidence.
- Ambiguous candidates reduce confidence.
- Weak repeated patterns reduce confidence.
- Existing tests pass.
- Unit tests cover high confidence, low confidence, ambiguity penalty, weak pattern penalty, and empty input.
- Build succeeds.

### Design Notes

This stage exists to keep warnings conservative and explainable. It appears after ranking because confidence summarizes ranked evidence quality.

---

## Stage - Warning Generation

### Objective

Generate actionable source-of-truth warnings when confidence exceeds the configured threshold. This stage creates the product-facing recommendation object.

### Scope

Implement:

- `SourceOfTruthWarning` model
- Warning generator
- Threshold application using configuration
- Warning evidence summary
- Unit tests

Do not implement:

- Text, JSON, or Markdown formatting
- CLI orchestration
- Similarity calculation
- Ranking

### Inputs

- `RepositoryContext`
- `CandidateRanking[]`
- `ConfidenceScore[]`
- `ChangedFacts[]`

### Outputs

- `SourceOfTruthWarning[]`

### Design Constraints

- Warnings must be derived only from prior analysis outputs.
- Warnings must identify changed local files and the candidate shared component.
- Warnings below threshold must not be emitted.
- Later reporters must render warnings without additional analysis.

### Acceptance Criteria

- Emits warnings above configured confidence threshold.
- Suppresses warnings below threshold.
- Includes changed file paths.
- Includes candidate component path/name.
- Includes evidence summary.
- Existing tests pass.
- Unit tests cover above threshold, below threshold, missing candidate, evidence summary, and empty input.
- Build succeeds.

### Design Notes

This stage exists to translate analysis into the core product output: "this local change likely belongs in that shared component." It appears after confidence because warning policy should not be mixed into scoring.

---

## Stage - Analysis Result

### Objective

Introduce a single `AnalysisResult` model that packages warnings and lightweight run metadata for reporters. This stage creates the stable boundary between analysis and presentation.

### Scope

Implement:

- `AnalysisResult` model
- Analysis result assembler
- Run metadata needed by reporters
- Unit tests

Do not implement:

- Text formatting
- JSON formatting
- Markdown formatting
- CLI wiring

### Inputs

- `SourceOfTruthWarning[]`
- Relevant pipeline counts or metadata already produced

### Outputs

- `AnalysisResult`

### Design Constraints

- Analysis result must not contain raw ASTs.
- Analysis result must not require reporters to inspect internal facts.
- Keep metadata minimal for V1.
- Later reporters should depend only on `AnalysisResult`.

### Acceptance Criteria

- Packages warnings into an analysis result.
- Includes minimal run metadata.
- Handles no-warning results.
- Existing tests pass.
- Unit tests cover warnings present, no warnings, and metadata.
- Build succeeds.

### Design Notes

This stage exists to separate product analysis from output rendering. It appears before reporters because every reporter should consume the same result.

---

## Stage - Text Reporter

### Objective

Implement the default human-readable text reporter for `AnalysisResult`. This reporter should make warnings immediately usable in terminal output.

### Scope

Implement:

- Text reporter
- No-warning output
- Warning output with changed files, candidate, confidence, and evidence
- Unit tests

Do not implement:

- JSON reporter
- Markdown reporter
- CLI flags
- Analysis behavior

### Inputs

- `AnalysisResult`

### Outputs

- Text output string

### Design Constraints

- Reporter must be presentation-only.
- Reporter must not perform analysis or filtering.
- Output should be concise and stable for tests.

### Acceptance Criteria

- Renders no-warning result clearly.
- Renders warning result clearly.
- Includes candidate path/name.
- Includes changed file paths.
- Includes confidence and evidence summary.
- Existing tests pass.
- Unit tests cover no-warning and warning output.
- Build succeeds.

### Design Notes

This stage exists to provide the first usable V1 output. It appears before other reporters because terminal text is the simplest product surface.

---

## Stage - JSON Reporter

### Objective

Implement a JSON reporter for machine-readable `AnalysisResult` output. This stage enables future integration without changing analysis internals.

### Scope

Implement:

- JSON reporter
- Stable JSON shape
- Unit tests

Do not implement:

- CLI flags
- Markdown reporter
- Analysis behavior

### Inputs

- `AnalysisResult`

### Outputs

- JSON output string

### Design Constraints

- Reporter must serialize existing result data only.
- Reporter must not recalculate warnings or confidence.
- Output shape should be stable and tested.

### Acceptance Criteria

- Produces valid JSON.
- Includes warnings.
- Includes metadata.
- Handles no-warning results.
- Existing tests pass.
- Unit tests cover valid JSON, warnings, metadata, and no-warning output.
- Build succeeds.

### Design Notes

This stage exists to make the MVP scriptable. It appears after the text reporter because text output proves the basic warning experience first.

---

## Stage - Markdown Reporter

### Objective

Implement a Markdown reporter for `AnalysisResult`. This stage provides a readable artifact for copying into reviews or issue comments without integrating with PR systems.

### Scope

Implement:

- Markdown reporter
- Warning table or sections
- No-warning Markdown output
- Unit tests

Do not implement:

- PR comments
- GitHub integration
- CLI flags unless already introduced by another task
- Analysis behavior

### Inputs

- `AnalysisResult`

### Outputs

- Markdown output string

### Design Constraints

- Reporter must be presentation-only.
- Output should remain useful as plain text.
- No external integration should be added.

### Acceptance Criteria

- Renders warnings in Markdown.
- Renders no-warning result.
- Includes candidate, changed files, confidence, and evidence.
- Existing tests pass.
- Unit tests cover warning and no-warning Markdown output.
- Build succeeds.

### Design Notes

This stage exists to support lightweight review workflows without expanding into PR automation. It appears after JSON because Markdown is useful but not required for machine integration.

---

## Stage - CLI Pipeline Wiring

### Objective

Wire the existing CLI entry point to execute the V1 analysis pipeline end to end and print the default text reporter output. This stage connects completed pipeline stages without adding new analysis behavior.

### Scope

Implement:

- CLI orchestration for repository context discovery
- Changed file discovery
- Source file discovery
- Fact collection
- Indexing
- Relationship, usage, role, candidate, similarity, ranking, confidence, warning stages
- Default text output
- Basic exit behavior
- Integration tests where feasible

Do not implement:

- New heuristics
- New output formats beyond invoking existing reporters
- Watch mode
- PR comments
- IDE integration

### Inputs

- CLI invocation directory

### Outputs

- Terminal text output

### Design Constraints

- CLI must orchestrate existing stages only.
- Pipeline stages must remain independently testable.
- CLI should not contain analysis logic.
- Configuration loading must still happen through `RepositoryContext`.

### Acceptance Criteria

- CLI runs the full pipeline.
- CLI prints text reporter output.
- CLI handles missing Git repository errors clearly through existing discovery behavior.
- CLI handles no-warning result.
- Existing tests pass.
- Integration test covers a minimal end-to-end no-warning run where practical.
- Build succeeds.

### Design Notes

This stage exists to make the accumulated pipeline usable. It appears after reporters because orchestration should connect completed boundaries rather than invent output behavior.

---

## Stage - Positive Fixture Coverage

### Objective

Add fixture repository coverage for cases where repeated local screen changes should point to an existing shared component. This stage validates the product's core behavior under controlled examples.

### Scope

Implement:

- Positive fixture repositories or fixture trees
- Integration tests using the CLI or pipeline
- Assertions that expected warnings are produced

Do not implement:

- New heuristics unless required to satisfy already-defined behavior
- Reporter redesign
- PR integration
- Dogfood tuning

### Inputs

- Working CLI pipeline

### Outputs

- Integration tests

### Design Constraints

- Fixtures should be small and readable.
- Fixtures should model the original problem directly.
- Tests should assert behavior, not implementation details.

### Acceptance Criteria

- Fixture with repeated screen-level patch produces a warning.
- Warning points to the expected shared component.
- Warning includes changed local files.
- Existing tests pass.
- Build succeeds.

### Design Notes

This stage exists to prove the product can catch the target failure mode. It appears after CLI wiring because the full product behavior must be demonstrable end to end.

---

## Stage - Negative Fixture Coverage

### Objective

Add fixture coverage for cases where the system should not warn. This stage protects against noisy recommendations and false positives.

### Scope

Implement:

- Negative fixture repositories or fixture trees
- Integration tests asserting no warnings
- Cases for legitimate local changes and weak evidence

Do not implement:

- New product features
- New output modes
- Heuristic expansion beyond what is necessary to preserve intended behavior

### Inputs

- Working CLI pipeline

### Outputs

- Integration tests

### Design Constraints

- Negative fixtures should be as important as positive fixtures.
- Tests should guard against over-eager warnings.
- False-positive protection should not be hidden in reporter logic.

### Acceptance Criteria

- Single local screen change does not warn.
- Shared component direct change does not warn.
- Unrelated repeated changes do not warn.
- Existing tests pass.
- Build succeeds.

### Design Notes

This stage exists because a noisy architectural auditor will be ignored. It appears after positive fixtures so the implementation is tested against both product value and restraint.

---

## Stage - README Usage

### Objective

Document the actual V1 CLI behavior, configuration file, and limitations. This stage makes the working tool understandable without expanding scope.

### Scope

Implement:

- README usage section or project README update
- Configuration example
- Example output
- Known limitations

Do not implement:

- New features
- Future roadmap beyond brief non-goals if already documented
- Marketing copy

### Inputs

- Working CLI behavior
- Existing configuration model
- Reporter output

### Outputs

- Documentation update

### Design Constraints

- Documentation must describe current behavior only.
- Limitations should be explicit.
- Usage should not imply unsupported integrations.

### Acceptance Criteria

- README explains how to run the CLI.
- README shows configuration filename and fields.
- README includes example warning output.
- README states V1 limitations.
- Existing tests pass if documentation checks exist.
- Build succeeds.

### Design Notes

This stage exists to make V1 usable by another developer. It appears near the end because docs should reflect implemented behavior.

---

## Stage - Dogfood Notes

### Objective

Run the V1 tool on one or more real repositories and record observed false positives, false negatives, and usability issues. This stage validates whether V1 is ready for evaluation.

### Scope

Implement:

- Dogfood notes document
- Recorded command and repository context
- Observed warnings
- False positive/negative notes
- Follow-up backlog items if needed

Do not implement:

- Heuristic changes
- Product redesign
- New integrations

### Inputs

- Working CLI
- Real repository run output

### Outputs

- Dogfood notes document

### Design Constraints

- This task records observations only.
- Any code changes discovered during dogfooding must become separate implementation tasks.
- Notes should distinguish tool defects from environment issues.

### Acceptance Criteria

- Dogfood run is recorded.
- At least one no-warning or warning outcome is documented.
- False positives and false negatives are recorded if observed.
- Follow-up issues are listed separately.
- Existing tests pass if code was touched.
- Build succeeds if code was touched.

### Design Notes

This stage exists as final V1 validation pressure. It appears last because dogfooding should evaluate the implemented MVP rather than guide speculative development.

---

## Natural Architectural Boundaries

| Boundary | Owns | Must Not Own |
|---|---|---|
| Discovery | Repository context, changed files, source file candidates | Semantic analysis |
| Classification | UI file type from repository-observable paths | Reuse recommendations |
| Parsing | Source text and AST | Imports, components, JSX interpretation |
| Fact Extraction | Syntax-level facts | Ranking or warnings |
| Fact Indexing | Lookup and relationship support | Product decisions |
| Relationship Analysis | Observable dependency relationships | Shared component policy |
| Usage Analysis | Reference counts | Candidate recommendation |
| Role Analysis | Shared/local/screen classification evidence | Similarity scoring |
| Candidate Discovery | Candidate governing abstractions | Changed-file comparison |
| Changed Projection | Changed local fact subset | Repository-wide inference |
| Pattern Detection | Repeated local implementation evidence | Candidate selection |
| Similarity | Candidate-pattern comparison | Warning policy |
| Ranking | Candidate ordering | Confidence thresholds |
| Confidence | Warning strength | Formatting |
| Warning Generation | Actionable product object | Console rendering |
| Reporting | Output format | Analysis logic |

## Implementation Discipline

Each task should be implemented independently by Codex using the same execution contract:

1. Read the current task.
2. Explain what will be implemented.
3. Implement only that task.
4. Run relevant tests.
5. Fix only issues introduced by that task.
6. Stop.

No task should begin the next stage automatically.
