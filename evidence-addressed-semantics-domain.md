# Domain of Validity: Evidence-Addressed Semantics

## Verdict

Evidence-addressed semantics exists, but it is not a universal computational abstraction.

It is best understood as a **decision-support abstraction for evolving semantic domains where claims must remain tied to evidence, scope, and revision**.

It generalizes beyond software repositories. It appears naturally in medicine, law, science, standards, intelligence analysis, regulation, engineering specifications, and historical scholarship.

But it adds little in domains where the core work is formal transformation, numerical optimization, compression, deterministic protocol execution, or cryptographic proof.

The abstraction survives, but only with a narrow domain:

> It applies where meaning is contested, evidence accumulates over time, authority is revisable, and decisions depend on knowing why a claim should currently be trusted.

That is the boundary.

## Part I: Generalization Test

### Scientific Publishing

| Dimension | Answer |
|---|---|
| Claims | hypotheses, results, interpretations, causal explanations |
| Evidence | experiments, datasets, methods, replications, peer review |
| Change | retraction, correction, replication, meta-analysis, paradigm shift |
| Authority | journals, citations, reproducibility, expert consensus |
| Contradiction | failed replication, conflicting studies, methodological critique |
| Uncertainty | confidence intervals, p-values, Bayesian posterior, study limitations |

Scientific publishing naturally fits evidence-addressed semantics. A paper's claim is not valuable merely because it is written; its authority depends on evidence, method, replication, and future contradiction.

### Wikipedia

| Dimension | Answer |
|---|---|
| Claims | encyclopedia statements |
| Evidence | citations, reliable sources, edit history |
| Change | edits, reversions, discussion consensus |
| Authority | source quality and community policy |
| Contradiction | conflicting sources, dispute tags |
| Uncertainty | citation needed, disputed, unclear, consensus status |

Wikipedia is close to an existing partial implementation: claims are linked to citations, but revision and confidence are mostly social/process-based rather than first-class computational state.

### Medical Guidelines

| Dimension | Answer |
|---|---|
| Claims | recommendations for diagnosis/treatment |
| Evidence | clinical trials, observational studies, systematic reviews |
| Change | guideline updates, downgraded evidence, adverse-event data |
| Authority | evidence quality, expert panels, regulatory bodies |
| Contradiction | new trials, subgroup failures, safety signals |
| Uncertainty | GRADE certainty, recommendation strength |

This is one of the strongest examples. GRADE explicitly separates certainty of evidence from strength of recommendation and changes recommendations as evidence evolves. This is effectively evidence-addressed semantics in a mature domain.

### Clinical Decision Support

| Dimension | Answer |
|---|---|
| Claims | patient-specific recommendations |
| Evidence | patient records, lab results, guidelines, risk models |
| Change | new results, new diagnosis, updated guideline |
| Authority | clinical evidence plus patient context |
| Contradiction | contraindication, conflicting diagnosis, abnormal trend |
| Uncertainty | risk score, confidence, differential diagnosis |

Clinical systems require scoped claims: a guideline may apply generally but not to a specific patient. Evidence-addressing is essential.

### Legal Systems

| Dimension | Answer |
|---|---|
| Claims | legal propositions, interpretations, case arguments |
| Evidence | statutes, precedent, facts, testimony, contracts |
| Change | new precedent, legislation, overturned cases |
| Authority | jurisdiction, court hierarchy, statutory force |
| Contradiction | conflicting precedent, factual dispute, dissent |
| Uncertainty | burden of proof, standards of evidence, probability of success |

Law fits strongly because authority is scoped. A claim may be valid in one jurisdiction, invalid in another, and superseded by later precedent.

### Building Codes

| Dimension | Answer |
|---|---|
| Claims | construction requirements and safety constraints |
| Evidence | engineering studies, failures, fire data, inspections |
| Change | new code editions, local amendments |
| Authority | code body, jurisdiction, inspector interpretation |
| Contradiction | variance, local exception, outdated code |
| Uncertainty | compliance interpretation, grandfathering |

Building codes are normative and versioned. Evidence-addressing matters especially during code transitions and exceptions.

### Accounting Standards

| Dimension | Answer |
|---|---|
| Claims | recognition, measurement, disclosure rules |
| Evidence | transactions, contracts, standards, audit trail |
| Change | new standards, interpretations, restatements |
| Authority | FASB/IASB/regulator/auditor |
| Contradiction | conflicting treatment, material misstatement |
| Uncertainty | estimate ranges, going-concern judgment |

Accounting is a strong domain because claims are normative, evidence-backed, scoped by standard, and revised over time.

### Aviation Procedures

| Dimension | Answer |
|---|---|
| Claims | safe operating procedure |
| Evidence | incident reports, simulations, human factors studies |
| Change | airworthiness directives, checklist updates, training changes |
| Authority | regulator, manufacturer, airline operations |
| Contradiction | incident, near miss, conflicting aircraft state |
| Uncertainty | emergency ambiguity, degraded sensors |

Aviation procedures are evidence-addressed in institutional form. Procedures evolve from incident evidence.

### Military Doctrine

| Dimension | Answer |
|---|---|
| Claims | operational principles and tactical guidance |
| Evidence | exercises, battlefield reports, intelligence, history |
| Change | enemy adaptation, technology, after-action review |
| Authority | command structure, doctrine bodies |
| Contradiction | failed operation, new adversary behavior |
| Uncertainty | fog of war, deception, incomplete intelligence |

Doctrine is explicitly revisable but often politically constrained. Evidence quality is uneven.

### Intelligence Analysis

| Dimension | Answer |
|---|---|
| Claims | assessments about actors, capabilities, intent |
| Evidence | signals, human sources, imagery, open sources |
| Change | new collection, disconfirmation, source reliability shift |
| Authority | source reliability, analytic confidence, corroboration |
| Contradiction | conflicting sources, deception, stale intelligence |
| Uncertainty | confidence levels, alternative hypotheses |

This is a near-perfect domain. Evidence, counterevidence, confidence, and competing hypotheses are core.

### Product Design

| Dimension | Answer |
|---|---|
| Claims | user need, design principle, interaction rationale |
| Evidence | research, analytics, usability tests, support tickets |
| Change | user behavior, market shift, design-system evolution |
| Authority | user evidence, product strategy, design leadership |
| Contradiction | failed experiment, usability issue |
| Uncertainty | confidence in user research, segment differences |

Product design fits when design decisions need traceable rationale. It does not fit for purely aesthetic exploration.

### CAD Systems / Engineering Design

| Dimension | Answer |
|---|---|
| Claims | design constraints, tolerances, load assumptions |
| Evidence | simulations, material tests, standards, calculations |
| Change | design revision, test failure, manufacturing feedback |
| Authority | engineering signoff, standards, physical test |
| Contradiction | failed simulation, field failure |
| Uncertainty | tolerance, safety factor, model error |

Engineering specifications strongly fit because design meaning depends on assumptions and constraints that must survive revisions.

### Mathematics

| Dimension | Answer |
|---|---|
| Claims | theorem, conjecture, definition, proof dependency |
| Evidence | proof, counterexample, formal verification |
| Change | proof correction, stronger theorem, definition shift |
| Authority | proof validity, peer verification, formalization |
| Contradiction | counterexample, inconsistency |
| Uncertainty | conjectural status, proof confidence before verification |

Mathematics only partially fits. Once formalized, claims are not revisable in the same evidential sense; they are derivable or not under axioms. The abstraction fits mathematical practice, conjecture, and proof development, less so settled formal mathematics.

### Standards Bodies: IETF, W3C, ISO

| Dimension | Answer |
|---|---|
| Claims | protocol/specification requirements |
| Evidence | implementation experience, interoperability tests, use cases |
| Change | drafts, RFC updates, errata, deprecation |
| Authority | standards process, consensus, adoption |
| Contradiction | implementation failure, ambiguity, security issue |
| Uncertainty | draft status, maturity level, interoperability confidence |

Standards are a strong domain: normative claims evolve through evidence and consensus.

### Manufacturing

| Dimension | Answer |
|---|---|
| Claims | process parameters, quality rules, tolerances |
| Evidence | measurements, defect rates, SPC data, audits |
| Change | process improvement, defect investigation |
| Authority | process control, engineering signoff, standards |
| Contradiction | defect trend, out-of-control process |
| Uncertainty | measurement error, process variance |

Manufacturing fits where process rules and quality claims evolve from evidence.

### Pharmaceutical Regulation

| Dimension | Answer |
|---|---|
| Claims | safety, efficacy, labeling, contraindications |
| Evidence | trials, pharmacovigilance, adverse events |
| Change | label updates, warnings, withdrawal |
| Authority | regulator, trial quality, post-market surveillance |
| Contradiction | safety signal, failed trial, subgroup harm |
| Uncertainty | risk-benefit assessment, confidence in effect |

Very strong domain. Evidence-addressed semantics already resembles regulatory decision making.

### Education

| Dimension | Answer |
|---|---|
| Claims | learning objective, intervention effectiveness, student mastery |
| Evidence | assessments, observations, longitudinal outcomes |
| Change | curriculum revision, new evidence, student progress |
| Authority | pedagogy, standards, teacher judgment |
| Contradiction | assessment failure, transfer failure |
| Uncertainty | measurement noise, contextual differences |

Fits moderately. Educational claims are often evidence-poor and context-sensitive.

### Historical Scholarship

| Dimension | Answer |
|---|---|
| Claims | interpretation of past events |
| Evidence | primary sources, artifacts, prior scholarship |
| Change | new archive, reinterpretation, source criticism |
| Authority | source reliability, historiographic method |
| Contradiction | conflicting source, forgery, new evidence |
| Uncertainty | contested interpretation, evidential gaps |

Strong fit. Historical knowledge is inherently evidence-addressed and revisable.

## Part II: Counterexamples

### JPEG Compression / Video Codecs

The core claims are mathematical and engineering trade-offs, but the runtime abstraction is fixed transformation. Evidence-addressed semantics adds little to encoding/decoding itself.

It may help standards evolution, codec design rationale, or patent analysis, but not the codec computation.

### Sorting Algorithms

Sorting correctness is formally specified. Evidence does not revise the meaning of "sorted" under normal use. Proofs, complexity, and benchmarks matter, but claim authority is not the operating substrate.

### Cryptography

Cryptographic primitives rely on formal definitions, reductions, assumptions, and attack evidence. Evidence-addressed semantics may help manage evolving trust in algorithms, but cryptographic computation itself is not evidence-addressed. The abstraction applies to cryptographic governance, not encryption.

### TCP/IP

Protocol specifications and standards evolution fit. Packet routing and protocol execution do not. The computation follows specified state machines; claim revision is outside the hot path.

### Operating System Schedulers

Schedulers optimize policies under workload evidence. Evidence-addressed semantics may document design trade-offs, but the scheduler itself needs metrics/control, not scoped semantic claims.

### Numerical Optimization

The domain is objective functions, gradients, constraints, convergence. Evidence-addressed semantics adds little unless the objective itself is socially contested.

### Signal Processing

Signal processing operates on mathematical models and noise. It has uncertainty, but not usually revisable semantic authority. Bayesian models may be enough.

### Boundary

The abstraction is unnecessary where:

```text
meaning is formalized,
authority is fixed by specification or proof,
and computation does not depend on revising semantic claims from evidence.
```

It appears where:

```text
meaning is interpreted,
authority is defeasible,
and decisions depend on evolving evidence.
```

## Part III: Underlying Property

Successful domains share these properties:

| Candidate | Present? | Necessary? |
|---|---|---|
| collaborative evolution | common but not necessary |
| long-lived knowledge | yes | usually |
| human disagreement | common | not always |
| incomplete information | yes | necessary |
| revisable truth | yes | necessary |
| normative constraints | often | not always |
| decision support | yes | necessary |
| semantic ambiguity | often | not always |
| evidence accumulation | yes | necessary |

The smallest shared property is:

> Decisions depend on defeasible semantic claims whose authority changes as evidence accumulates.

That is the underlying property.

Not all successful domains are collaborative. Not all are normative. Not all involve ambiguity. But all involve semantic claims that can gain or lose authority from evidence.

## Part IV: Existing Theory

### Provenance

W3C PROV formalizes information about entities, activities, and agents involved in producing data or things, so users can assess quality, reliability, and trustworthiness. This captures evidence lineage well.

But provenance alone does not represent revisable semantic authority. It says where information came from, not whether a claim currently governs a scope.

### Belief Revision / Truth Maintenance

Belief revision studies how beliefs change when new information arrives. Truth maintenance systems store inferred information with dependencies and restore consistency when assumptions change. These are very close.

They cover revision and justification. They do not by themselves require evidence-addressed scope, domain authority, or decision-guiding semantics.

### Argumentation Theory

Toulmin-style argumentation has claim, grounds, warrant, backing, qualifier, and rebuttal. This is extremely close: claim, evidence, authority/warrant, uncertainty, counterevidence.

Argumentation theory may already cover much of the abstraction at the discourse level.

### Evidence-Based Medicine / GRADE

GRADE explicitly assesses certainty in evidence and strength of recommendation. It distinguishes evidence confidence from recommendation authority. This is probably the most concrete existing domain instantiation.

### Semantic Web / Knowledge Graphs

Semantic Web systems represent entities and relations. They do not necessarily represent evidence, confidence, contradiction, and revision as first-class authority mechanisms.

### Knowledge Graphs

Knowledge graphs can represent claims and provenance, but many are fact stores, not revision systems. They can implement this abstraction but do not define it.

### Existing Theory Verdict

The abstraction is not entirely new.

The strongest existing description is:

```text
provenance-aware defeasible knowledge representation for decision-guiding claims
```

Or even:

```text
argumentation plus provenance plus belief revision
```

Evidence-addressed semantics is a useful compression across these traditions, but not a wholly new theoretical object.

Where existing theories stop short is integration:

- provenance tracks origin but not revision authority
- belief revision tracks consistency but not evidential grounding in domain artifacts
- argumentation models claims but not necessarily evolving computational substrates
- evidence-based domains instantiate the pattern but do not generalize it computationally
- knowledge graphs store relations but not necessarily defeasible authority

The proposed abstraction is a synthesis, not a discovery from nothing.

## Part V: Minimal General Theory

Remove software, repositories, AI, intent, code, architecture, programming.

What remains:

```text
A system contains claims about meanings or decisions.
Each claim applies within a scope.
Each claim is supported or weakened by evidence.
New evidence can revise the claim's authority, scope, or status.
Decisions consult the current claim state.
```

Domain-independent statement:

> Evidence-addressed semantics applies to systems where decisions require scoped semantic claims whose authority must be updated from supporting and contradicting evidence over time.

This stands without software.

## Part VI: Necessary And Sufficient Conditions

A system requires evidence-addressed semantics if and only if:

```text
There exists a set of decisions D and semantic claims C such that:
1. decisions in D depend on the authority of claims in C;
2. claims in C are not fully determined by formal proof or fixed specification;
3. evidence relevant to claims in C changes over time;
4. contradictory evidence is possible;
5. claim authority must be scoped to context;
6. incorrect claim authority materially worsens decisions.
```

Unnecessary when any of these are false:

- decisions do not depend on semantic claims
- claims are fully formal and decidable
- evidence does not evolve
- contradictions are impossible or irrelevant
- scope does not matter
- wrong claim authority has no meaningful consequence

This is the tightest domain boundary.

## Part VII: Falsification

The abstraction is not fundamental if:

1. **Provenance plus belief revision fully models every successful domain** without adding scoped semantic authority.
2. **Argumentation theory already provides all required primitives** with no loss.
3. **Existing evidence-grading frameworks generalize cleanly** across all successful domains.
4. **Every example reduces to metadata over claims**, with no special computational operations.
5. **Semantic scope is not needed**; global claims plus provenance are enough.
6. **Revision is not needed**; timestamped assertions are enough.
7. **Authority is not needed**; evidence retrieval alone is enough for decisions.
8. **No domain gains new operations** beyond search, provenance query, and belief update.
9. **The abstraction cannot define computations that existing KR systems cannot express.**

Several of these are plausible. This should temper claims of novelty.

## Part VIII: Strongest Alternative

### Opponent's Claim

> You've rediscovered provenance plus belief revision.

Strong version:

- Evidence-addressing is provenance.
- Revisability is belief revision.
- Contradiction handling is truth maintenance.
- Scope is context logic.
- Authority is argumentation/warrant.
- Confidence is Bayesian or Dempster-Shafer uncertainty.
- Claims are propositions.
- Therefore nothing new exists.

### Evaluation

This argument largely succeeds at the level of theory.

Evidence-addressed semantics does not appear to introduce primitives unavailable in existing knowledge representation, provenance, argumentation, and belief revision.

However, it may still be valuable as a **computational packaging**:

```text
claim + evidence + scope + revision + authority
```

as a default object model for evolving decision domains.

That is similar to how GraphQL did not invent graphs, JSON, or APIs, but packaged application data access around a useful abstraction. The novelty would be practical abstraction, not foundational theory.

The honest judgment:

> Evidence-addressed semantics is not a new logic. It is a domain-independent computational pattern that composes existing ideas into a first-class substrate for evolving decision claims.

That is weaker than "new computational abstraction" but stronger than "just metadata."

## Part IX: Final Verdict

### 1. Is Evidence-Addressed Semantics Genuinely Domain-Independent?

Yes, within a bounded class of domains.

It applies beyond software to medicine, law, science, regulation, standards, engineering specifications, intelligence analysis, historical scholarship, and other domains where decisions depend on revisable claims under evidence.

It does not apply meaningfully to many formal, numerical, compression, cryptographic, or deterministic protocol domains except at their governance/specification layer.

### 2. If Yes, What Existing Abstractions Does It Subsume?

It partially subsumes or composes:

- provenance
- belief revision
- truth maintenance
- argumentation structure
- evidence grading
- scoped assertions
- semantic annotation
- decision-support knowledge bases

It does not replace:

- formal proof
- type systems
- databases
- signal processing
- control systems
- static analysis
- domain-specific models

### 3. If No, What Is Its Actual Scope?

Its actual scope is:

> evolving decision domains with defeasible semantic claims.

That is broader than software but far from universal.

### 4. What Is It?

Best classification:

> a computational abstraction for evidence-governed semantic authority.

Not merely:

- a software engineering abstraction
- a repository abstraction
- a product design pattern
- an implementation technique

But also not a new foundational logic.

It is closer to a reusable information model.

### 5. Smallest Truthful Claim

The smallest claim that survives:

> Evidence-addressed semantics is a reusable information model for domains where decisions depend on scoped claims whose authority must change with supporting and contradicting evidence.

That is the exact boundary.

It is not grander than that.

