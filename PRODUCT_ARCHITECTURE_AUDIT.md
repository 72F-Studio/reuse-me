# Product Architecture Audit — `component-intent-audit`

**Reviewer stance:** Principal engineer for AI developer tooling, pre-ship review.
**Date:** 2026-07-05
**Scope:** Entire repository at current HEAD. Product idea is taken as given; this audit evaluates execution: architecture, information modeling, reasoning pipeline, CLI/API ergonomics, extensibility, explainability, error handling, performance, naming, documentation, and maintainability.
**Method:** Full source read (`src/`, `test/`, adapters, docs) plus live dogfooding: `--health`, `--diff`, flag-conflict runs, non-git-directory runs, and output-size measurement. Every finding cites observed evidence. No fixes are implemented here; each finding states what a redesign must accomplish, not how.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Findings](#critical-findings)
   - [C1. First-match-wins extractor selection defeats the polyglot claim](#c1)
   - [C2. The flagship analyses are silently dead for most repositories](#c2)
   - [C3. Change analysis cannot see the changes agents actually care about](#c3)
   - [C4. The "knowledge provider" architecture is a fiction](#c4)
   - [C5. Failure output is catastrophic for the tool's own value proposition](#c5)
3. [High-Priority Findings](#high-priority-findings)
   - [H1. The tool fails its own audit](#h1)
   - [H2. CLI command design: boolean flag soup](#h2)
   - [H3. Performance: multiple full repo walks, all synchronous, no guards](#h3)
   - [H4. Signal quality: test code and noise dominate real findings](#h4)
   - [H5. Confidence numbers are pseudo-precision; config options are dead](#h5)
   - [H6. The information model can represent at most one pattern per run](#h6)
4. [Medium-Priority Findings](#medium-priority-findings)
   - [M1. Naming and mental-model drift](#m1)
   - [M2. JSON output is not designed for its stated consumer](#m2)
   - [M3. Configuration surface: rigid, already carrying legacy debt](#m3)
   - [M4. Seventeen hand-maintained adapters with no drift protection](#m4)
   - [M5. Repository detection disagrees with git itself](#m5)
   - [M6. Wasted and contradictory work inside the TypeScript/React extractor](#m6)
   - [M7. Role model claims declaration precision it does not have](#m7)
   - [M8. No graceful-degradation philosophy for per-file failures](#m8)
5. [Low-Priority Findings](#low-priority-findings)
6. [Recommended Execution Order (Highest ROI First)](#recommended-execution-order)
7. [What Is Already Good](#what-is-already-good)
8. [Appendix: Dogfood Evidence](#appendix-dogfood-evidence)

---

## Executive Summary

The codebase is unusually disciplined at the micro level: small single-responsibility stages, enforced layer boundaries (`test/unit/architectureGuards.test.ts`), honest comments, 110 fast passing tests, and a clean pipeline shape (construct knowledge → analyze → assemble → report). This is well above typical v0.1 quality in craftsmanship.

The problems are macro. The product promises three things — polyglot repository intelligence, abstraction-drift detection, and context savings for AI agents — and the architecture currently under-delivers all three:

1. **Polyglot:** only one extractor ever runs per repository (first match wins), so mixed-language repos lose entire languages silently.
2. **Drift detection:** the pattern features that power all three flagship findings (missing abstraction, competing implementation, source-of-truth warnings) are only produced by the React extractor. For every other repository the analyses can never fire, while the output reports "no findings" — a false negative indistinguishable from a healthy repo. The tool's own repository, which contains textbook duplication, gets a clean bill of health.
3. **Context savings:** the JSON output recommended to agents is 5.7× larger than the text output, is one-third fixed boilerplate, has no schema version, and the failure mode observed live dumped ~200 lines of raw git usage text into the agent conversation — twice.

None of these is hard to see from the inside; all of them are invisible without dogfooding on a non-React repo and on a repo with committed branch changes. The single highest-leverage change in this roadmap is not a feature: it is making the tool run honestly on itself and report what it cannot see.

Finding counts: **5 Critical, 6 High, 8 Medium, 8 Low.**

---

## Critical Findings

<a name="c1"></a>
### C1. First-match-wins extractor selection defeats the polyglot claim

**Evidence:** `src/runner/knowledgePipelineRunner.ts:33-35` — `this.extractors.find((candidate) => candidate.detect(context).supported)` selects exactly one extractor. `TypeScriptReactExtractor` is registered first (`:18-21`). Its `detect()` passes whenever any `.ts/.tsx/.js/.jsx` file exists under the configured shared/local source dirs (`src/extractors/typescript-react/TypeScriptReactExtractor.ts:49-60`).

**What happens:** In a repository with `src/components/Button.tsx` and 400 Python files, the React extractor wins and the 400 Python files do not exist as far as declarations, imports, relationships, usage, or findings are concerned. Nothing in the output says so; the capability report happily lists `declaration-extraction: available`. The inverse also holds: a React repo whose components don't live under the default directory names silently falls through to the generic regex extractor and loses all JSX/style intelligence.

**Why it matters:** This is the load-bearing architectural decision of the whole product, and it is wrong for the product's own goal. A repository is not "a TypeScript repo or a Python repo" — it is a set of files, each of which some provider can read. Extraction must be *compositional* (union of what all capable providers contribute, per file), not *exclusive* (one provider owns the repo). Every serious analyzer in this space (tree-sitter-based tools, Sourcegraph, Semgrep) composes per-language backends.

**Hiring-signal read:** A reviewer sees `find()` where the domain demands `filter()` + merge, and concludes the multi-provider architecture was designed around the demo repo, not the problem.

**A redesign must accomplish:** per-file (or per-language) provider assignment; a merged fact stream with provenance (`extractorId` already exists on `SourceArtifact` — the model is ready, the runner is not); capability reporting derived from what actually ran per language, not from which single extractor won.

---

<a name="c2"></a>
### C2. The flagship analyses are silently dead for most repositories

**Evidence:** `MissingAbstractionDetector`, `CompetingImplementationDetector`, and `SourceOfTruthWarningGenerator` all consume `ObservedPattern`s. Both pattern detectors (`src/analysis/changedPatternDetector.ts`, `src/analysis/repositoryPatternDetector.ts`) only build patterns from `FeatureFact`s of category `structure`/`style`. The only code in the repository that ever emits a `FeatureFact` is the JSX/style extractor pair; the generic extractor hardcodes `features: []` (`src/extractors/generic-declarations/GenericDeclarationsExtractor.ts:213`).

**Confirmed by dogfooding:** `--health` on this repository — which contains at least seven verbatim-duplicated helper implementations (see H1) — produced **zero** unused-abstraction, competing-implementation, or missing-abstraction findings. The output section that is the product's reason to exist is structurally empty for every repository that is not a React app with default directory layout, and the report gives no hint of it.

**Why it matters:** This is worse than a missing feature; it is a *misleading* capability claim. An agent (or human) reading "No repository health findings" concludes the repo is clean. The tool has a rich vocabulary for honesty — `coverage`, `confidence`, `unavailable`, `reason` — and does not use it here: pattern-based analyses should be reported as *unavailable* when no provider contributed features, exactly the way UI Semantics already is.

**A redesign must accomplish:** (a) findings availability must be derived from actual input coverage — "pattern detection ran over 0 files with feature facts" must be visible in the output; (b) the generic provider needs *some* language-independent feature signal (declaration shape, import fingerprints, name n-grams — whatever is chosen, it must feed the same pattern pipeline) so the flagship analyses function outside React; (c) an end-to-end fixture in CI that asserts the drift detectors fire on a known-duplicated polyglot repo.

---

<a name="c3"></a>
### C3. Change analysis cannot see the changes agents actually care about

**Evidence:** `src/git/diffReader.ts:23-29` runs exactly `git diff --name-status --find-renames` — unstaged working-tree changes only.

**What is invisible:** staged files (`--cached`), anything already committed on the branch (`main...HEAD`), and any PR-style review target. The dominant agent workflows — "review this branch," "audit this PR," "check what I did before I push" — see an empty diff and report "No source-of-truth warnings," another false negative presented as a clean result. There is no `--base`, `--staged`, or ref argument anywhere in the CLI surface.

**Additional correctness bug:** `parseGitNameStatusLine` (`:50-84`) throws on legitimate git output: copies (`C75`), type changes (`T`), and unmerged (`U`) lines produce `Unsupported git diff status line`, killing the entire run instead of skipping the line.

**Why it matters:** The diff mode is one of the two product modes. As shipped, it answers a question almost nobody is asking ("what have I edited but not staged or committed?") and crashes on repositories that use `git mv`-heavy or conflicted workflows.

**A redesign must accomplish:** an explicit comparison-target concept (working tree, staged, ref range) exposed in the CLI; tolerant parsing that degrades per-line with a note rather than aborting; a documented default that matches the primary use case (branch vs merge-base is the industry default for review tools).

---

<a name="c4"></a>
### C4. The "knowledge provider" architecture is a fiction

**Evidence:**
- Output speaks the language of a plugin system: "no UI knowledge provider *installed*", "Registered knowledge providers", `KnowledgeProviderSummary`. There is no install, registration, or discovery mechanism anywhere — the provider list is a hardcoded constructor default (`knowledgePipelineRunner.ts:18-21`).
- The pipeline special-cases one provider by string ID: `extractor.id === "typescript-react" ? available("ui-extraction", ...)` (`knowledgePipelineRunner.ts:86`). A hypothetical Vue or SwiftUI provider could never light up `ui-extraction` without editing the runner — the exact coupling the extractor interface exists to prevent (and which `architectureGuards.test.ts` polices everywhere else).
- Intelligence-area coverage/confidence labels are hardcoded constants, not measurements: Repository Structure is always `complete/high` (`repositoryHealthRunner.ts:220-223`), Declaration Analysis is always `partial/medium` whenever any provider exists, regardless of how much of the repo it could actually read. Only Relationship Analysis computes its rating from data (`:277-304`) — proving the team knows how, and making the hardcoded neighbors look worse.
- There is no documentation for writing a provider, despite README language ("Language-specific knowledge providers can replace it when precision matters") that invites exactly that.

**Why it matters:** Extensibility is the stated long-term strategy (README "Repository Intelligence" section, `05_PIPELINE.md`). Right now the extension story is: fork the repo, edit two hardcoded lists, and hope your provider's ID doesn't need special-casing in the runner. Meanwhile the vocabulary in the user-facing output over-promises a marketplace-like model that doesn't exist. Users and agents calibrate trust on these labels; fabricated `high` confidence corrodes the product's core currency, which is honesty about what it knows.

**A redesign must accomplish:** either (a) genuinely pluggable providers — a registration surface, a capability contract that lets a provider declare what areas it contributes (killing the `id === "typescript-react"` check), and a short "writing a provider" doc — or (b) honest simplification: drop the installed/registered vocabulary and present the two built-in backends as what they are. Both are defensible; the current midpoint is not. Coverage/confidence must be computed from observed data (files read vs files present, parse successes vs failures) in every area, not just relationships.

---

<a name="c5"></a>
### C5. Failure output is catastrophic for the tool's own value proposition

**Evidence (observed live):** running `--diff` where `git diff` fails printed the full ~200-line git usage screen **twice** (once via inherited stderr, once again inside the thrown error message that the CLI echoes), followed by `Command failed: git diff --name-status --find-renames`. Total: ~400 lines of noise for a one-line problem.

**Why it matters:** The product's one-sentence pitch is "give agents a compact map before they spend model context." An agent that runs this CLI and hits any git failure pays more context for the error spew than the tool would ever save. Error output is not a corner case for an agent-first tool — it *is* the interface, because agents retry and quote errors. The `.claude-plugin`/skill files instruct agents to run this exact command, so this failure lands verbatim in real conversations.

**A redesign must accomplish:** a defined error contract: one line of cause, one line of remedy, stable exit codes distinguishing "environment problem" from "invalid usage" from "ran fine, found things" — and suppression/capture of child-process stderr so it can be summarized rather than replayed. The error contract should be treated as part of the output schema and tested as such.

---

## High-Priority Findings

<a name="h1"></a>
### H1. The tool fails its own audit

**Evidence — duplication inside a duplication-detection tool:**

| Duplicated logic | Locations |
|---|---|
| `repeatedByName`, `featureIdentity`, `isPatternFeature`, `isLocalPath` (verbatim, ~40 lines) | `changedPatternDetector.ts`, `repositoryPatternDetector.ts` |
| Threshold-policy loop (find pattern, find rank-1, emit) | `sourceOfTruthWarningGenerator.ts`, `competingImplementationDetector.ts` |
| `formatLanguages`, `formatProviders`, `coverageSymbol`, `formatRepository` (verbatim) | `textReporter.ts`, `markdownReporter.ts` |
| Recursive directory walk | `languageDetector.ts`, `repositoryStructureAnalyzer.ts`, `GenericDeclarationsExtractor.ts`, `sourceFileDiscovery.ts` (4 implementations) |
| `IGNORED_DIRECTORIES` constant | 3 copies, **already drifted** — `languageDetector.ts:33-40` lacks `coverage`, `out`, `target`, `.next`, `.agents` that the other two have |
| `globToRegExp` + `escapeRegExp` | `GenericDeclarationsExtractor.ts`, `sourceFileDiscovery.ts` |
| `src/main/...` source-prefix-stripping regex | `GenericDeclarationsExtractor.ts:583`, `repositoryHealthRunner.ts:142` |
| Intelligence-area table construction | `repositoryHealthRunner.ts` (ready path), `repositoryHealthResultAssembler.ts` (limited path) — two hand-maintained copies of the same 8-row table |

**Why it matters:** Beyond ordinary maintenance risk (the ignored-dirs drift is already a live inconsistency: language detection sees directories that structure analysis skips, so the two headline numbers in the same report disagree about what the repo contains), this is a credibility problem specific to this product. The first thing a skeptical engineer will do is run the reuse auditor on the reuse auditor. Today it returns nothing (C2) — and if C2 is fixed, it will return *this table*. Dogfooding must become the acceptance test: the tool's own repo should be its first fixture, with its own findings tracked to zero or explicitly accepted.

---

<a name="h2"></a>
### H2. CLI command design: boolean flag soup

**Evidence:**
- `--diff` is declared (`cli.ts:22`) but never read — the action handler destructures only `health`, `json`, `markdown` (`cli.ts:26`). Diff mode is simply the default. Consequence observed live: `--diff --health` silently runs health mode; the flag the docs and all 17 adapters tell agents to pass is a no-op.
- `--json --markdown` together: JSON silently wins (`cli.ts:28-33`). No error, no warning.
- Modes and formats are orthogonal axes crammed into four independent booleans, so the CLI accepts 16 combinations of which 6 are meaningful and 0 are validated.
- No `--base`/ref (C3), no path scoping (`component-intent-audit src/billing`), no `--config` override, no `--quiet`/`--verbose`, no documented exit-code contract (findings and no-findings both exit 0, so CI cannot gate on the tool without parsing output).

**Why it matters:** Command surface is the product's API. Agents compose commands from docs; a documented flag that does nothing (`--diff`) means the docs lie, and silent conflict resolution means user intent is discarded without notice. Both are trust-killers for programmatic consumers, and both are cheap to get right at v0.1 and expensive to change after adapters ship.

**A redesign must accomplish:** mutually exclusive modes expressed as subcommands (or one validated `--mode`), a single `--format <text|json|markdown>` enum, hard errors on contradictory input, and an explicit, documented, tested exit-code contract.

---

<a name="h3"></a>
### H3. Performance: multiple full repo walks, all synchronous, no guards

**Evidence:** One `--health` run walks the entire tree at least three times — `RepositoryStructureAnalyzer.walk` (`repositoryStructureAnalyzer.ts:74`), `LanguageDetector.walkFiles` (`languageDetector.ts:60`), and the winning extractor's discovery; the TS extractor then discovers **twice more** because both `detect()` and `extract()` call `sourceDiscovery.discover()` independently (`TypeScriptReactExtractor.ts:50,63`), and the generic extractor likewise re-discovers in `extract()` after `detect()`. Every file is then `readFileSync`-ed fully and regex-scanned serially. There is no `.gitignore` awareness (only hardcoded directory-name lists; `vendor`, `.venv`, `Pods`, `__pycache__`, `.turbo` are all scanned), no file-size ceiling (a vendored 200 MB bundle gets read and regexed), no symlink-cycle guard in any of the four recursive walkers (a self-referencing symlink is an infinite loop), no parallelism, no caching, and no incremental mode.

**Why it matters:** The tool is positioned as a pre-flight step agents run *routinely*. Routine tools must be fast on monorepos or they get dropped from prompts. Sub-second on this 156-file repo says nothing; the scaling curve here is `O(walks × files × regexes)` with several silent hazards that convert "slow" into "hung."

**A redesign must accomplish:** one shared traversal that all consumers (structure, language, extractors) read from; `.gitignore`-aware filtering; size/binary guards; symlink cycle protection; and a stated performance budget with a large-repo fixture in CI. Incremental caching can wait; single-walk correctness cannot.

---

<a name="h4"></a>
### H4. Signal quality: test code and noise dominate real findings

**Evidence (own-repo `--health` output):** the duplicate-declaration signal list is `createTempDir (6 files)`, `facts (6 files)`, `writeFixture (5 files)`, `visit (4 files)`, `artifact (3 files)` — entirely test helpers and generic local names. The unresolved-import hotspots include `../package.json` (a legitimate JSON import) and `../cx` (a test fixture). The default `ignore` list excludes only React-flavored test files (`**/*.test.tsx`, `.jsx` — `config/defaults.ts:14-24`); plain `*.test.ts` and `test/` directories flow straight into "intelligence signals."

**Why it matters:** Agents consume this output verbatim. A signal list where 5 of 5 entries are noise teaches the consumer (human or model) to ignore the section — and then the one real duplicate-declaration signal gets ignored too. Precision is the product; a heuristics tool that doesn't curate its own false positives has negative value in an agent prompt because it actively misdirects attention. There is also no severity, no line numbers, and no per-finding explanation of *why this matters*, which pushes interpretive burden back onto the context-constrained consumer.

**A redesign must accomplish:** test/fixture classification as a first-class role (not just ignore globs) applied across all languages; suppression of known-benign import shapes (JSON assets, package manifests); ranking by informativeness rather than raw count; and per-finding location + rationale so a consumer can act without re-deriving the evidence.

---

<a name="h5"></a>
### H5. Confidence numbers are pseudo-precision; config options are dead

**Evidence:**
- Similarity is Jaccard overlap on className tokens / JSX tag names / style keys with fixed weights `0.5 / 0.3 / 0.2` (`similarityScorer.ts:36-38`); confidence subtracts fixed penalties of `0.2` (`confidenceCalculator.ts:24-28`); the warning gate is `0.7`. None of these constants is justified, sourced, or validated anywhere in the repo (no evaluation corpus, despite `05_EVALUATION_PLAN.md` existing at the root).
- `strongWarningThreshold` and `includeLowConfidenceNotes` are defined in the model, defaulted, validated with dedicated assertions, documented in the README example — and **referenced by zero lines of runtime logic** (grep-verified). Users who set them see no behavior change.
- Output prints `confidence 0.72`-style two-decimal values, implying calibration that does not exist.

**Why it matters:** Dead configuration is a broken promise with a validation error message attached — the worst combination, because the tool actively confirms it accepted a setting it will ignore. And numeric confidence is the API agents will branch on ("only surface warnings above 0.8"); shipping uncalibrated numbers with two decimal places invites downstream thresholding on noise. Honest ordinal buckets (the output vocabulary `high/medium/low` already exists) are strictly better until an evaluation corpus exists.

**A redesign must accomplish:** every config key either drives behavior or is removed; numeric scores either get an evaluation harness (the plan file already sketches one) or are presented as ordinal evidence-strength labels; weights/penalties become named, documented policy in one place.

---

<a name="h6"></a>
### H6. The information model can represent at most one pattern per run

**Evidence:** Both pattern detectors emit either zero or exactly one `ObservedPattern`, with hardcoded IDs `"changed-pattern-1"` / `"repository-pattern-1"`, whose `sourcePaths` is *all* local files and whose `features` is the union of *all* repeated features (`changedPatternDetector.ts:34-41`, `repositoryPatternDetector.ts:29-37`).

**What this means:** If `screens/A` and `screens/B` share a duplicated card layout, and `screens/C` and `screens/D` share a duplicated form, the tool produces one mushy pattern spanning A, B, C, D with card-features and form-features mixed, matched against one best candidate. Distinct duplication clusters — the actual unit of the domain — cannot be expressed, located, or separately scored. Every downstream stage (scorer, ranker, confidence, warnings) is built to handle multiple patterns and is fed at most one.

**Why it matters:** This is an information-modeling failure at the heart of the reasoning pipeline. The pipeline's sophistication (scoring, ranking, ambiguity penalties) is wasted on an input that has already destroyed the structure it needs. It also caps output usefulness at "something somewhere repeats," which is not actionable.

**A redesign must accomplish:** patterns as clusters — grouped by feature cohesion and file affinity, each with its own source set, feature set, and lifecycle ID stable enough to track across runs.

---

## Medium-Priority Findings

<a name="m1"></a>
### M1. Naming and mental-model drift

**Evidence:** The product is simultaneously: directory `Reuse-me`, package/binary `component-intent-audit`, output heading `RRR Health` (an acronym defined nowhere in the repo), and docs describing "Ponytail-style adapters." The domain vocabulary stacks seven near-synonyms — *extractor*, *knowledge provider*, *intelligence*, *capability*, *signal*, *finding*, *heuristic*, *warning* — with real but undocumented distinctions. The `RepositoryKnowledge` interface exposes `sourceArtifacts()`, `sourceFiles()`, and `files()` as three aliases of the same array (`repositoryKnowledgeAssembler.ts:17-19`). `ChangedFactsProjector`'s comment says "Projects changed **UI** files" while the pipeline is nominally UI-agnostic.

**Why it matters:** Mental-model clarity is the primary interface for two audiences: contributors (who must decide where code goes) and agent-prompt authors (who must describe the tool to a model in few tokens). Alias methods are how naming debates escape into an API; unexplained acronyms in output headers cost every reader a lookup that has no answer.

**A redesign must accomplish:** one product name; a glossary in the README that gives each term a crisp scope (or merges terms); one name per concept in code and output; deletion of interface aliases before external consumers exist.

<a name="m2"></a>
### M2. JSON output is not designed for its stated consumer

**Evidence:** On this small repo, `--health --json` is 9,680 bytes vs 1,717 for text — 5.7× — while every adapter and skill file instructs agents to use `--json`. ~2.1 KB of the JSON is fixed-string boilerplate repeated identically every run (`capabilities` 489 B + `intelligence` 1,658 B). The payload has no schema-version field, no stable per-finding IDs, and is always pretty-printed with 2-space indent (`jsonReporter.ts:8`).

**Why it matters:** For a context-compression product, output bytes are the unit of value. Unversioned JSON means the first key rename silently breaks every adapter parser; missing finding IDs prevent diffing results across runs (the natural agent workflow: "what's new since my change?").

**A redesign must accomplish:** a versioned, documented output schema treated as a public API; a compact agent profile (boilerplate elided or referenced, not repeated); stable finding identities.

<a name="m3"></a>
### M3. Configuration surface: rigid, already carrying legacy debt

**Evidence:** Single filename at repo root only (`loadConfig.ts:8,32`); no env-var or flag override; no per-package configs for monorepos. Unknown-key rejection is good discipline, but the error doesn't list valid keys. At version 0.1.0 with zero external users, the loader already maintains legacy aliases (`sharedComponentDirs`, `screenDirs`) with normalization logic and a guard test — permanent complexity purchased to preserve compatibility with... nothing shipped.

**Why it matters:** Carrying compatibility shims before first release signals decision-avoidance; the cost is paid on every future config change. Monorepo users (the primary audience for repo-intelligence tooling) cannot express per-workspace source roles at all.

**A redesign must accomplish:** delete pre-release aliases; decide the monorepo config story (nested configs or workspace mapping) before the schema hardens; helpful validation errors.

<a name="m4"></a>
### M4. Seventeen hand-maintained adapters with no drift protection

**Evidence:** `docs/agent-portability.md` lists 17 host surfaces (Codex, Claude Code, Gemini, Copilot, Copilot CLI, OpenCode, pi, Hermes, Devin, Cursor, Windsurf, Cline, Kiro, generic AGENTS.md, Swival, OpenClaw, agents-rules marketplace), each a separately maintained copy of essentially the same instruction text. No test verifies that adapter instructions match the CLI's real flags — and they already don't: every adapter documents `--diff`, which is a no-op flag (H2).

**Why it matters:** Adapter breadth before product depth is inverted priority at v0.1: each copy is a place for instructions to rot, and rot here means agents issuing wrong commands in other people's sessions. The one thing that would make breadth cheap — generating adapters from a single source of truth, plus a CI check that flags mentioned in adapters exist in `cli.ts` — is absent.

<a name="m5"></a>
### M5. Repository detection disagrees with git itself

**Evidence:** `findRepositoryRoot` accepts any directory containing a `.git` *entry* (`repoRoot.ts:18`). This repository's own `.git` is present but not a valid git database (git reports "Not a git repository"; the harness shows branch `HEAD`, no commits) — so knowledge construction proceeds, and then diff mode explodes with the C5 error dump. Two components of the same tool hold different opinions about whether this is a git repo.

**Why it matters:** The repo-root contract underpins every path in every fact. It must match git's own answer (worktrees, submodules, `GIT_DIR` setups included), or diff mode must verify git works before promising it.

<a name="m6"></a>
### M6. Wasted and contradictory work inside the TypeScript/React extractor

**Evidence:** `buildFacts` parses every file with `framework: "unknown", kind: "unknown"` (`TypeScriptReactExtractor.ts:98-101`) — the `UiFileClassifier`'s output is computed in `toArtifacts` and never reaches the parser that takes a `UiFile` parameter. To call the classifier at all, the extractor fabricates fake `ChangedFile` objects with `status: "modified"` (`:78-81`) — a diff-domain type smuggled into whole-repo discovery as a shim. The classifier itself is 130 lines of path heuristics whose `framework` result (`react` vs `react-native`) influences nothing downstream.

**Why it matters:** Dead inputs and type-shims are how a codebase this disciplined starts to rot; they confuse the next contributor about what actually affects results, and the guard tests can't catch semantic dead weight.

<a name="m7"></a>
### M7. Role model claims declaration precision it does not have

**Evidence:** `RoleAnalyzer` computes a role per *file*, then stamps every declaration in the file with the same role and reasons (`roleAnalyzer.ts:20-32`). Downstream, candidate evidence lists "shared role" per declaration and findings name specific declarations — precision the model never established. A shared file's private helper and its exported API get identical treatment.

**Why it matters:** The finding text is the product's testimony; testimony should not be more specific than the evidence. Either roles stay file-scoped (and findings say so) or declaration roles must use declaration-level signals (visibility, per-declaration reference counts — both already exist in the model).

<a name="m8"></a>
### M8. No graceful-degradation philosophy for per-file failures

**Evidence:** The only error boundary is the CLI's top-level try/catch (`cli.ts:27,51`). Any single unreadable file (permissions, transient lock), any oversized file, any walker exception aborts the entire analysis. Yet the output model was *built* for partial results — coverage levels, confidence levels, `unavailable` reasons — and the TS parser already demonstrates the right pattern locally (parse errors become per-file `parseError`, `sourceFileParser.ts:33-40`).

**Why it matters:** A repository-intelligence tool meets hostile filesystems constantly. "Analyzed 4,982/5,000 files; 18 unreadable" is an honest, useful answer; a stack trace is not. The architecture is one policy decision away from doing this right — the vocabulary exists and is unused (the same gap as C2, in a different layer).

---

## Low-Priority Findings

**L1. Output copy and formatting.** `RRR Health` header (M1); the Confidence block re-lists all eight areas immediately after the Knowledge Sources block lists the same eight (double vertical space for one table's information); `[ok]`/`[none]` ASCII badges; no TTY/color awareness; markdown reporter doesn't escape `|` in file paths, so a path containing a pipe breaks the change-analysis table.

**L2. Parser hacks visible in results.** `filter((declaration) => declaration.name !== "if")` (`GenericDeclarationsExtractor.ts:832`) blacklists one keyword; the Java/C# method regex (`:292`) will still match other keyword-led lines (`return foo(`-shaped code, constructors, etc.). Symptomatic of regex-parsing limits — acceptable for Level 1, but the "declarations" count in output should carry its heuristic health warning with it (the README's caveat doesn't travel with the JSON).

**L3. JS/TS import extraction misses common forms.** No `require()`, no `export ... from`, no dynamic `import()`, no multi-line import statements (regex is line-anchored, `:758`). Ironically the generic extractor only applies to JS/TS repos that failed React discovery — exactly the repos most likely to use `require()`.

**L4. `typescript` is a runtime dependency (~40 MB) of a tool whose non-React path needs none of it.** Heavy install for a "run everywhere as a pre-flight" CLI; also `package.json` is `private: true` with a `bin` entry and no LICENSE file, so the distribution story (npm? checkout-only?) is undefined.

**L5. Test suite gaps at the boundaries.** 110 unit/integration tests pass in ~1 s (good), but nothing tests: CLI flag conflicts (would have caught H2), the git error path (C5), polyglot fixtures (C1/C2), status letters C/T/U (C3), or symlink cycles (H3). Coverage concentrates on the layers that were easy to test.

**L6. Repo hygiene.** Root carries ~20 planning/vision markdown files with two colliding numbering schemes (`01_PRODUCT_VISION.md` vs `01_REPOSITORY_STRUCTURE.md`), plus `__pycache__/` committed alongside a TypeScript project (Hermes adapter artifact), and an invalid `.git` with zero commits — no history, no provenance, no bisectability for a repo this documented.

**L7. Version flag reads `package.json` via import (`cli.ts:4`)** — bundler-dependent behavior worth verifying in the built `dist/cli.js` (tsup must inline it; if config changes, `--version` breaks silently).

**L8. `defaults.ts` comment admits the bias** — "These values intentionally target the built-in TypeScript React extractor" — meaning zero-config behavior on non-React repos runs with role directories that don't exist, so *every* file gets role `unknown` unless referenced ≥2 times. Role analysis is thus near-inert exactly where the generic extractor runs. (This compounds C2.)

---

## Recommended Execution Order

Ordered by leverage: each item unblocks or de-risks the ones after it.

1. **Honesty layer first (C2 + M8 + C4-labels).** Make every analysis report what it actually ran on: pattern detection unavailable without feature facts, coverage/confidence computed from data, partial-failure reporting. Cheapest set of changes; converts silent false negatives into truthful output; restores the product's core promise (trustworthy signal) before any new capability is built.
2. **CLI contract (H2 + C5 + exit codes).** Subcommands, one format enum, conflict errors, one-line error contract, documented exit codes. Must precede adapter regeneration and any external adoption, because every later fix ships through this surface.
3. **Diff targets (C3).** Ref-range/staged/working-tree comparison plus tolerant status parsing. Makes the change mode answer the question agents actually ask; small, isolated to `git/`.
4. **Compositional extraction (C1).** Per-file provider assignment with merged, provenance-tagged facts. The largest structural change — do it while the codebase is still small, before provider count grows.
5. **Generic feature signal (rest of C2).** Give the generic provider a language-independent feature stream so drift detection works everywhere; add the polyglot end-to-end fixture and a dogfood-on-self CI job.
6. **Pattern clustering (H6).** Multiple patterns with stable IDs. Do after 5 so clustering is designed against real polyglot features, not React-only ones.
7. **Single traversal + filesystem guards (H3).** One walk, `.gitignore`, size/symlink guards, perf fixture. Mechanical once 4 exists (the walk consolidates naturally into the new pipeline).
8. **Noise control (H4).** Test-role classification, benign-import suppression, finding locations and rationale. Highest polish-per-effort on perceived quality once the signal actually flows.
9. **Config truthfulness (H5 + M3).** Delete dead keys and pre-release aliases, wire or drop numeric confidence, decide monorepo config.
10. **De-duplication pass on own code (H1) + extractor cleanup (M6, M7).** After 4–6, much of the duplicated code is restructured anyway; finish the sweep and let the tool's own audit gate CI.
11. **Naming/glossary + output schema versioning (M1, M2).** Lock vocabulary and JSON contract immediately before widening distribution.
12. **Adapter regeneration from single source + drift check (M4), then hygiene (L-items).** Last, because adapters should be regenerated once — against the final CLI contract — not repeatedly.

---

## What Is Already Good

Credit where due, because the redesign should preserve these properties:

- **Enforced architecture boundaries.** `architectureGuards.test.ts` mechanically prevents extractor types, compiler APIs, and private models from leaking across layers. Rare at any stage; almost unheard of at v0.1.
- **Stage discipline.** Each analysis stage has one job, a comment stating what it deliberately does *not* do, and constructor-injected collaborators. The pipeline is genuinely easy to reason about.
- **Honest epistemology in the parser layer.** "Dynamic expressions are skipped instead of guessed" (`styleTokenExtractor.ts`), parse errors captured rather than crashed on, README's explicit "static syntax evidence only; treat results as review prompts, not proof."
- **Deterministic output.** Sorting everywhere; stable, diffable results — exactly right for an agent-consumed tool.
- **Fast, green test suite** (110 tests, ~1 s) with real fixture-based integration tests.

The gap, throughout, is that these virtues live at the micro level while the macro-level claims (polyglot, drift detection, context savings, extensibility) are unvalidated against real usage. The roadmap above is, in essence: make the honesty that already exists in the parser layer propagate all the way up to the product surface.

---

## Appendix: Dogfood Evidence

All runs executed 2026-07-05 against this repository.

1. **`--health` (text):** reports `[ok] … complete/high` for four areas (hardcoded labels), `323 declarations, 511 imports, 310/511 resolved`, duplicate-declaration signals consisting entirely of test helpers (`createTempDir`, `writeFixture`, `visit`, `facts`, `artifact`), unresolved-import "hotspots" including `../package.json`, and **zero** unused/competing/missing-abstraction findings despite the duplication table in H1.
2. **`--diff`:** git failure produced ~400 lines of output — the full git usage screen twice plus `Command failed: git diff --name-status --find-renames`. Exit code 1 (correct), output contract (absent).
3. **`--diff --health --json --markdown`:** accepted silently; ran health mode with JSON output. No warning about the three discarded intents.
4. **Non-git directory:** clean one-line error (`No Git repository found from … Searched: …`) — the *good* error path, showing the team can do this when the failure is anticipated.
5. **Output sizes:** `--health --json` = 9,680 bytes; `--health` text = 1,717 bytes; fixed boilerplate within JSON (`capabilities` + `intelligence`) = 2,147 bytes.
6. **Dead config:** `grep` confirms `strongWarningThreshold` and `includeLowConfidenceNotes` appear only in definition, defaulting, and validation code — never in behavior.
