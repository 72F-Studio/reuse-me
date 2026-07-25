# Intent Recoverability: Scientific Construct Evaluation

## Executive Judgment

**Intent Recoverability is scientifically meaningful, but only as a latent empirical construct.** It is not simply readability, maintainability, documentation quality, traceability, architecture, or technical debt. It overlaps all of them, but its target is narrower and more specific:

> the probability that a maintainer can reconstruct the purpose and constraints that should govern a future change.

The concept deserves investigation if, and only if, it predicts maintenance safety beyond existing metrics such as complexity, coupling, documentation coverage, traceability, churn, test quality, and architecture fitness.

The burden of proof is high. Requirements traceability already studies the recoverable relationship between requirements, design, code, tests, and rationale. Program comprehension already studies how maintainers understand code. ISO-style quality models already include analyzability and maintainability. Intent Recoverability must therefore earn its place by focusing on a specific missing construct: **recovering change-governing intent from repository evidence when intent was not fully encoded as a formal requirement.**

## Part I: Formalization

### Definition

Let:

- `R` be a software repository at time `t`
- `I` be a target intent relevant to a change task
- `M` be a maintainer, human or machine
- `O_R` be the observations available from the repository
- `C` be contextual background knowledge available to the maintainer
- `A` be the correct action constraints implied by `I`

**Intent Recoverability** is the degree to which `I` can be inferred from `O_R` and `C` with sufficient accuracy to select or reject future changes according to `A`.

More compactly:

```text
IR(I, R, M, C) = P_M(I is correctly reconstructed | O_R, C)
```

Task-relative recoverability:

```text
IR_task(I, R, M, C, T) =
P_M(action constraints implied by I are correctly applied to task T | O_R, C)
```

This distinction matters. A maintainer may reconstruct intent abstractly but fail to apply it during a change.

### Distinctions

| Construct | What It Measures | Why Intent Recoverability Is Different |
|---|---|---|
| Readability | ease of reading local code | readable code may not reveal why it exists |
| Maintainability | ease of modifying software | modification ease can exist without original intent recovery |
| Understandability | ability to form a mental model of code behavior | behavior understanding is not purpose reconstruction |
| Traceability | links among requirements, artifacts, tests, and rationale | strong overlap, but traceability usually assumes identifiable upstream artifacts |
| Documentation quality | quality of written explanatory material | intent may be recoverable from tests/history/conventions without docs |
| Software architecture | structure and principles of a system | architecture constrains intent but is not identical to it |
| Technical debt | future cost created by suboptimal choices | debt may exist even when intent is highly recoverable |
| Code quality | local correctness, style, simplicity, robustness | high-quality code can still hide intent |

### Construct Status

Intent Recoverability is best treated as a **latent variable**.

It is not directly observable. It must be estimated from outcomes:

- human reconstruction accuracy
- AI reconstruction accuracy
- correct future modification choices
- agreement with original authors or authoritative records
- prediction of future regression risk
- ability to distinguish valid variants from accidental divergence

It is not merely a derived metric because no existing metric captures the full construct. It is not fully independent either; it is partially caused by documentation, naming, tests, trace links, architecture, and history. The scientific question is whether it has **incremental validity** beyond those predictors.

If it does not, reject it as rebranding.

## Part II: Necessary Conditions

No single artifact is necessary in every repository. Intent can be recoverable through different evidence channels. The necessary condition is not a specific artifact type; it is **sufficient discriminative evidence**.

### Evidence Channels

| Evidence | Necessary? | Sufficient? | Role |
|---|---|---|---|
| Tests | no | sometimes for behavioral intent | identify expected behavior and invariants |
| Commit history | no | rarely | reveals evolution, reversions, rationale fragments |
| Architecture | no | rarely | constrains where intent belongs |
| Naming | no | rarely | provides semantic handles |
| Design systems | no | in UI domains, partially | encode visual and interaction intent |
| API conventions | no | partially for interface intent | reveal contract expectations |
| Ownership | no | no | identifies who may know or approve intent |
| Discussions | no | often for historical intent | capture trade-offs and rejected alternatives |
| ADRs | no | often for architectural intent | explicit decision rationale |
| Requirements | no | often for product/regulatory intent | upstream purpose and constraints |
| Types/schemas | no | partially | encode structural intent |
| Documentation | no | sometimes | externalizes rationale |
| Runtime telemetry | no | partially | reveals actual use and operational constraints |

### Minimal Necessary Condition

Intent is recoverable only if the repository contains enough evidence to distinguish:

```text
intended behavior from accidental behavior
canonical pattern from local workaround
valid variant from duplication
current law from deprecated law
safe change from intent violation
```

That is the necessary condition.

### Sufficiency

Sufficiency is task-relative. For a simple bug fix, tests plus names may be sufficient. For a safety-critical architectural migration, requirements, trace links, ADRs, tests, ownership, and history may all be needed.

General sufficiency condition:

```text
Intent I is sufficiently recoverable for task T if a qualified maintainer can infer
the action constraints implied by I with error probability below the task's risk threshold.
```

## Part III: Recoverability Theory

### Bayesian Form

Let `I` be latent intent and `O = {o_1, ..., o_n}` be observations from the repository.

```text
P(I | O, C) = P(O | I, C) P(I | C) / P(O | C)
```

Recoverability increases when:

- observations are informative about intent
- observations are mutually consistent
- alternative intents are unlikely
- the maintainer has appropriate background knowledge
- evidence is current
- evidence links to action constraints

Recoverability decreases when:

- multiple intents explain the same artifacts
- evidence is stale
- vocabulary is ambiguous
- tests encode accidental behavior
- documentation contradicts code
- history contains unresolved migrations

### Information-Theoretic Form

Intent Recoverability can be framed as reduction in uncertainty:

```text
IR_info(I, R) = H(I | C) - H(I | O_R, C)
```

Where:

- `H(I | C)` is uncertainty about intent before repository observations
- `H(I | O_R, C)` is uncertainty after observing repository evidence

The repository is recoverable when it significantly reduces uncertainty about the intent relevant to future change.

### Signal Detection Form

Many maintenance tasks require detecting whether a proposed change violates intent.

| Signal Detection Term | Repository Meaning |
|---|---|
| hit | correctly detects intent violation |
| miss | fails to detect intent violation |
| false alarm | rejects safe change as violation |
| correct rejection | accepts safe change |

Intent Recoverability should improve sensitivity:

```text
d' = separation between valid-change and intent-violation evidence distributions
```

This matters because overzealous recoverability can create false alarms: maintainers may infer constraints that were never intended.

### Epistemic Form

Recovered intent should be treated as justified belief, not certainty:

```text
RecoveredIntent = <claim, evidence, confidence, scope, alternatives, action_constraints>
```

The action constraints are crucial. Intent that cannot guide action is explanatory history, not recoverable maintenance intent.

## Part IV: Measuring Recoverability

No single measurement strategy is enough.

| Strategy | Method | Strength | Weakness |
|---|---|---|---|
| Human blind reconstruction | remove docs/authors; ask maintainers to infer intent | direct construct measure | expensive, subjective |
| AI blind reconstruction | agents infer intent from controlled evidence | scalable, relevant to AI maintenance | model-dependent |
| Hybrid reconstruction | human+AI teams infer intent | realistic future setting | hard to isolate causes |
| Original-author comparison | compare inferred intent to author/ADR/issue record | strong gold standard where available | original author may misremember |
| Architecture prediction | infer intended architecture boundaries, compare to expert labels | measures structural intent | may conflate architecture skill |
| Concept prediction | ask subjects to identify concepts and variants | targets semantic recoverability | concept labels are hard to validate |
| Future modification prediction | infer correct future change from repo evidence | highly practical | task design difficult |
| Repository completion tasks | hide files/decisions; ask participants to reconstruct missing constraints | controlled measurement | artificial |
| Change-review classification | classify proposed changes as intent-preserving or violating | directly measures action constraints | requires expert labels |
| Longitudinal field study | measure recoverability and later regressions | high ecological validity | slow, confounded |

Best program: triangulate.

```text
construct validity: blind reconstruction
predictive validity: future modification outcomes
ecological validity: field studies
AI relevance: agent reconstruction tasks
```

## Part V: Existing Metrics

Existing metrics partially capture Intent Recoverability but do not exhaust it.

| Metric | Captures | Misses |
|---|---|---|
| Cyclomatic complexity | control-flow difficulty | purpose, rationale, source of truth |
| Coupling | dependency risk | why dependency exists |
| Cohesion | conceptual locality | hidden intent and history |
| Code churn | instability | whether instability reflects intended evolution |
| Change amplification | future edit cost | whether edits preserve intent |
| Architecture fitness | structural rule compliance | unstated product/domain intent |
| Documentation coverage | written explanation volume | accuracy, actionability, contradiction |
| Traceability completeness | artifact linkage | informal intent outside requirements |
| Semantic similarity | textual/conceptual closeness | normativity and action constraints |
| Test coverage | behavioral evidence | rationale and intended variants |
| Defect density | outcome quality | recoverability before failure |
| Ownership concentration | responsibility clarity | semantic intent |

Intent Recoverability should be rejected if a model using existing metrics predicts reconstruction accuracy and intent-preserving modification just as well.

The empirical test:

```text
Outcome ~ existing metrics
Outcome ~ existing metrics + Intent Recoverability estimate
```

If the second model does not significantly improve prediction, the construct lacks incremental validity.

## Part VI: Five-Year Experimental Program

### Year 1: Construct Validity

Goal: determine whether Intent Recoverability is distinguishable from comprehension, traceability, documentation quality, and maintainability.

Experiments:

1. Create a benchmark of repository slices with known intent from issues, ADRs, requirements, tests, and author interviews.
2. Ask human maintainers to reconstruct intent under controlled evidence conditions.
3. Ask AI systems to perform the same reconstruction.
4. Measure agreement between reconstructed intent and gold-standard intent.
5. Conduct factor analysis: does Intent Recoverability load separately from readability, documentation quality, and complexity?

Failure condition:

```text
Intent Recoverability collapses statistically into documentation quality or program comprehension.
```

### Year 2: Measurement Reliability

Goal: determine whether recoverability can be measured reproducibly.

Experiments:

1. Build multiple independent measurement instruments: blind reconstruction, change classification, concept prediction.
2. Test inter-rater reliability among experts.
3. Test test-retest reliability across participant groups.
4. Compare human, AI, and hybrid measurements.
5. Determine which repository evidence channels improve measurement stability.

Failure condition:

```text
Different instruments do not agree, or expert labels are too unstable.
```

### Year 3: Predictive Validity

Goal: determine whether Intent Recoverability predicts maintenance outcomes.

Experiments:

1. Measure recoverability across repository modules.
2. Run controlled maintenance tasks.
3. Track correct changes, regressions, review comments, time, prompt turns, and patch reversions.
4. Compare models with and without Intent Recoverability.
5. Replicate across human-only, AI-only, and hybrid maintenance.

Failure condition:

```text
Recoverability does not predict outcomes beyond existing metrics.
```

### Year 4: Repository Interventions

Goal: determine whether improving recoverability improves outcomes.

Interventions:

1. add intent-bearing tests
2. improve trace links
3. write ADRs
4. clarify naming
5. encode design-system conventions
6. preserve commit rationale
7. add source-of-truth markers

Experimental design:

- matched modules
- randomized intervention where possible
- pre/post measurement
- delayed maintenance tasks

Failure condition:

```text
Interventions improve docs/traceability but not future maintenance safety.
```

### Year 5: Industrial Deployment

Goal: determine whether Intent Recoverability matters in real organizations.

Studies:

1. longitudinal observation across industrial repositories
2. measure recoverability trend by subsystem
3. correlate with incident rate, review latency, AI patch success, refactor cost
4. compare teams adopting recoverability interventions against controls
5. study cost-benefit trade-offs

Failure condition:

```text
Recoverability measurement is too expensive, too noisy, or not actionable in practice.
```

## Part VII: Competing Explanations

If high-recoverability repositories also have better documentation, architecture, engineers, tests, and lower complexity, causal isolation is difficult.

### Isolation Strategies

| Confound | Isolation Method |
|---|---|
| documentation quality | compare modules with equal doc coverage but different intent reconstruction accuracy |
| architecture quality | hold architecture fitness constant, vary rationale/evidence availability |
| engineer quality | within-subject experiments across repo slices |
| test quality | matched test coverage with different rationale clarity |
| complexity | match cyclomatic/coupling metrics |
| domain familiarity | recruit unfamiliar maintainers and control training |
| ownership | compare owned vs unowned modules with similar artifact quality |
| code quality | synthetic repositories with identical code but varied intent evidence |

### Strong Experimental Design

Create repository variants:

```text
Variant A: code only
Variant B: code + tests
Variant C: code + tests + docs
Variant D: code + tests + docs + rationale/trace/history
```

Keep code constant. Vary only intent evidence.

If participants perform better on intent-sensitive future modifications in Variant D, Intent Recoverability has evidence beyond code quality.

### Causal Claim

Intent Recoverability is independently causal only if:

```text
Increasing intent evidence while holding code structure constant improves future change correctness.
```

That is the cleanest test.

## Part VIII: Failure Modes

Maximizing Intent Recoverability is not always desirable.

| Context | Harm |
|---|---|
| Highly optimized systems | intent evidence may expose abstractions that mislead performance-critical local reasoning |
| Generated code | intent belongs in generator/spec, not generated artifact |
| DSLs | surface code may intentionally hide implementation intent |
| Compilers | excessive rationale may distract from formal semantics and tests |
| Security-sensitive systems | exposing intent may reveal threat model or attack surface |
| Research software | intent is exploratory and changes quickly |
| One-off scripts | recoverability cost exceeds future value |
| Competitive product code | rationale may expose business strategy |
| Safety-critical systems | informal recovered intent may be dangerous if it bypasses formal traceability |

Recoverability should not be maximized globally. It should be optimized relative to:

- expected lifespan
- change frequency
- risk
- maintainer turnover
- AI maintenance likelihood
- regulatory burden
- security exposure

Principle:

```text
Optimize Intent Recoverability only where future change depends on intent that is otherwise likely to be lost.
```

## Part IX: Reviewer Discussion

### Reviewer A: Supportive

This paper identifies a real gap between program comprehension, traceability, and AI-assisted maintenance. The core construct is promising because it focuses not on whether code can be read, but whether the purpose and constraints governing future change can be reconstructed. The proposed experimental agenda is credible, especially if it demonstrates incremental validity beyond documentation and complexity metrics. The AI angle strengthens the contribution because non-human maintainers make intent loss more visible and measurable.

### Reviewer B: Highly Skeptical

The construct is underdefined and risks becoming a catch-all for "good engineering context." Most examples are already covered by traceability, rationale management, program comprehension, and maintainability. The mathematical notation gives a false sense of rigor unless intent can be reliably labeled. The paper must show that Intent Recoverability predicts outcomes beyond existing measures. Without that, this is not a new construct; it is a new name for documentation and traceability quality.

### Reviewer C: Existing Software Engineering With New Terminology

The work appears to repackage known research. Requirements traceability already asks whether artifacts can be connected to their reason for existing. Program comprehension already studies whether maintainers understand code. Architecture research already studies erosion and rationale. Maintainability already includes analyzability. The authors need to identify a precise empirical phenomenon not explained by those fields. The strongest candidate is intent-sensitive AI maintenance, but the paper must make that the center rather than a motivation.

### Reviewer D: AI Changes Everything

The construct matters because AI maintainers amplify old weaknesses. Humans can ask colleagues, remember past meetings, and infer social context. AI systems rely more heavily on repository evidence. Therefore, recoverability becomes measurable in a new way: can an agent infer the correct change constraints from repository artifacts alone? This may turn an old concern into a new empirical field. The paper should focus on AI/human comparative experiments and define "agent recoverability" as a separate but related construct.

## Part X: Final Judgment

Intent Recoverability deserves to become a software engineering research concept, but not yet a fundamental concept alongside coupling, cohesion, modularity, and maintainability.

It deserves investigation because it targets a real gap:

```text
the recoverability of purpose and change-governing constraints from repository evidence
```

That is not fully captured by readability, maintainability, traceability, documentation, architecture, or code quality. It becomes especially important when maintainers are unfamiliar with the repository or are AI systems with no organizational memory.

It does not yet deserve fundamental status because:

1. it lacks validated measurement instruments
2. it may collapse into traceability plus documentation quality
3. it may fail to predict outcomes beyond existing metrics
4. intent labels are difficult to establish
5. optimal recoverability is context-dependent, not universal

Precise final answer:

> Intent Recoverability deserves to exist as a candidate latent construct in empirical software engineering. It should become fundamental only if experiments show that it has reliable measurement, incremental predictive validity, and causal effect on future maintenance safety beyond established constructs.

That is the honest bar.

## Sources

- Program comprehension research studies how maintainers understand existing source code and highlights long-standing construct-validity challenges: https://en.wikipedia.org/wiki/Program_comprehension
- Contemporary source-code comprehension work argues that empirical studies often lack clear construct definitions, creating construct-validity risks: https://arxiv.org/abs/2310.11301
- ISO/IEC quality models include maintainability/analyzability-related concepts, making overlap with existing quality constructs a serious concern: https://en.wikipedia.org/wiki/ISO/IEC_9126
- Requirements traceability already covers links among requirements, artifacts, reasons for existence, and evolution paths: https://en.wikipedia.org/wiki/Requirements_traceability
- Recent traceability work continues to address degradation of requirement-code-test links as systems evolve: https://arxiv.org/abs/2603.13999

