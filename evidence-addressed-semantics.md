# Computational Abstraction Review

## Verdict

Yes, a candidate abstraction exists, but it is smaller than the previous work.

It is not Repository Intelligence.  
It is not an AI system.  
It is not a knowledge graph.  
It is not better documentation.  
It is not semantic search.

The abstraction is:

> **Evidence-addressed meaning.**

More precisely:

> A computational substrate where semantic claims are first-class objects whose authority derives from linked evidence and revision over time.

This is the smallest abstraction that survives the prior papers.

## Part I: Historical Compression

Major computing shifts usually introduce one durable information abstraction:

| System | Core Abstraction |
|---|---|
| Filesystem | named byte sequences in hierarchical storage |
| Database | structured records under queryable relations |
| Hypertext | linked documents |
| Objects | state plus behavior behind identity |
| Functional programming | computation as expression transformation |
| Package managers | named reusable dependency units |
| Containers | portable execution environments |
| Git | content-addressed version history |
| GraphQL | client-shaped application data graph |
| React | declarative UI as state-to-view function |
| Kubernetes | desired state reconciliation |

The prior work does not introduce "intelligent repositories." That is a product framing.

The information abstraction is:

```text
claim + evidence + scope + revision
```

A claim says something meaningful. Evidence supports or weakens it. Scope limits where it applies. Revision records how it changes.

That is the new unit.

## Part II: Missing Information

Current repositories represent:

- files
- directories
- commits
- branches
- tags
- diffs
- dependencies
- symbols
- references
- test results
- issues
- documentation

They do not natively represent:

| Missing Information | Actually Absent? | Why |
|---|---|---|
| Meaning | yes | meaning is inferred from artifacts, not stored as an object |
| Intent | yes | intent may appear in docs/ADRs, but not as queryable, revisable structure |
| Constraint | partially | static constraints exist; semantic constraints usually do not |
| Evidence | partially | evidence exists, but is not bound to claims |
| Normativity | yes | repositories rarely encode "this ought to remain true" |
| Concept | partially | symbols encode names, not conceptual identity |
| Identity over time | partially | Git tracks content identity, not semantic identity |
| Purpose | yes | purpose is scattered, not first-class |
| Evolution of meaning | yes | Git tracks file evolution, not concept/intent evolution |

The absent information is not "knowledge" in general. It is **justified semantic commitment**: a claim about meaning whose support can be inspected and revised.

## Part III: Semantic Computing

Compare current operations:

```text
Find references
```

with:

```text
Find everything whose correctness depends on this concept.
```

The first operates over syntax and symbol edges. The second requires meaning, dependency, scope, and evidence.

```text
Go to definition
```

becomes:

```text
Go to governing intent.
```

The first needs a symbol table. The second needs a semantic claim plus authority.

```text
Search files
```

becomes:

```text
Search meaning.
```

This is not merely a better index if the system can distinguish:

- asserted meaning
- inferred meaning
- contradicted meaning
- deprecated meaning
- scoped meaning
- uncertain meaning

A semantic index retrieves. An evidence-addressed semantic substrate adjudicates.

The distinction is normativity. Search says "this may be relevant." The new abstraction says "this claim currently governs this region, with this evidence and this confidence."

## Part IV: Knowledge Substrate

Every major abstraction creates a substrate:

| Abstraction | Substrate |
|---|---|
| Filesystem | file tree |
| Database | tables/relations |
| Git | content-addressed object graph |
| DOM | document object tree |
| Kubernetes | desired-state resource graph |
| Package manager | dependency graph |

The substrate here is not intent alone. Intent without evidence is documentation. Evidence without claim is raw history. Graph without normativity is indexing.

The smallest substrate is:

```text
Evidence-addressed claim graph
```

Objects:

```text
Claim
Evidence
Scope
Revision
Relation
```

This substrate can express:

- intent
- constraints
- design decisions
- conventions
- exceptions
- uncertainty
- semantic identity
- evolution
- conflict
- deprecation

Earlier work called this many things: repository laws, intent evidence layer, living repository claims. Those collapse into one substrate.

## Part V: Computation

If this substrate exists, new computations become possible.

Not merely easier: possible in a principled way.

| Computation | Requires New Abstraction? | Why |
|---|---|---|
| Semantic diff | yes | needs meaning before/after, not just text before/after |
| Intent-preserving merge | yes | needs governing claims to decide whether both changes preserve purpose |
| Concept-level blame | yes | Git blame tracks lines, not meaning changes |
| Constraint-aware search | yes | needs normative claims, not just matching |
| Intent conflict detection | yes | needs two claims with overlapping scope and incompatible predicates |
| Evidence decay detection | yes | needs claim-evidence links over time |
| Deprecated-meaning detection | yes | needs semantic identity across revisions |
| Source-of-truth ambiguity detection | yes | needs claims about authority |
| Architectural simulation | partially | can be approximated without this, but semantic consequences require it |
| Evolution forecasting | partially | MSR can forecast change, but not meaning drift without semantic claims |

The decisive examples are:

```text
semantic diff
intent-preserving merge
concept-level blame
intent conflict detection
```

These cannot be reduced to file diffs, static analysis, or retrieval without smuggling in semantic claims.

## Part VI: Expressiveness

Can the abstraction represent existing systems?

| Existing Artifact | Representable? | How |
|---|---|---|
| `CLAUDE.md` | yes | claims with broad scope and human-authored evidence |
| README | yes | descriptive claims with weak/moderate authority |
| ADR | yes | decision claims with rationale and date |
| lint rule | yes | enforced normative claim |
| design system | yes | claims about components, tokens, allowed variants |
| repository graph | yes | evidence and relations among artifacts |
| static analysis result | yes | evidence supporting or violating claims |
| AI memory | yes | claims with source and confidence |
| issue discussion | yes | evidence and competing interpretations |
| test | yes | behavioral evidence |

Is it strictly more expressive?

In one sense, yes: it can encode every static instruction as a claim plus evidence/scope/revision.

In another sense, no: it does not replace all specialized representations. A type system, database schema, or test suite remains more precise for its own domain.

So the correct claim is:

> It is meta-expressive: it represents the authority, evidence, and evolution of other artifacts' meanings.

It is not a replacement substrate for computation. It is a substrate for semantic governance.

## Part VII: Irreducibility

Compress repeatedly.

Candidate objects:

- Repository Claim
- Semantic Entity
- Intent Node
- Constraint
- Meaning
- Evidence
- Belief
- Concept
- Identity

Remove "repository": the abstraction can apply outside repositories.

Remove "intent": not every claim is intent; some are facts, constraints, conflicts, deprecations.

Remove "concept": claims may concern relationships, rules, histories, or exceptions.

Remove "belief": too epistemological; "claim" is simpler.

Remove "meaning": too broad unless anchored.

Remove "constraint": too narrow.

The minimum object is:

```text
Claim
```

But a claim alone is just documentation.

Add:

```text
Evidence
```

Now it is grounded.

Add:

```text
Scope
```

Without scope, claims become globally false too easily.

Add:

```text
Revision
```

Without revision, it is static documentation.

Minimum irreducible object:

```text
Scoped, revisable, evidence-backed claim.
```

Everything else can be derived.

## Part VIII: Category Theory

Do not force it. But one simplification is useful.

Today:

```text
Repository = files + history
```

Under the new abstraction:

```text
Semantic Repository = artifacts + history + claims over artifacts/history
```

Objects:

```text
Repository states with claim sets
```

Morphisms:

```text
Changes that transform one repository state and claim set into another
```

Composition:

```text
Sequential changes compose if their artifact deltas and claim revisions compose
```

Identity:

```text
A no-op change preserves artifacts and claims
```

Preserved invariants:

```text
claims whose predicates remain valid under transformation
```

This gives one useful result:

A normal diff maps files to files.  
A semantic diff maps **claim states to claim states**.

That is the category-level distinction.

But category theory is not necessary for the core idea. It mainly clarifies that the new abstraction treats change as transformation of meaning-bearing state, not only artifact state.

## Part IX: Alternative Theories

### Alternative A: Better Retrieval

Claim: software only needs better retrieval.

This explains:

- missing context
- inability to find prior patterns
- repeated reinvention
- weak onboarding

It fails to explain:

- whether retrieved context is still valid
- which retrieved pattern is normative
- how confidence changes over time
- how contradictory evidence should revise guidance

Retrieval returns candidates. It does not maintain semantic authority.

### Alternative B: Richer Metadata

Claim: software only needs better metadata.

This explains:

- missing labels
- ownership
- trace links
- design decisions
- richer navigation

It fails if metadata is static. Metadata can assert meaning, but unless it is continuously tied to evidence and revision, it becomes another stale layer.

Richer metadata becomes the proposed abstraction only when it becomes scoped, evidence-backed, and revisable.

### Alternative C: Semantic Indexing

Claim: software only needs semantic indexing.

This explains:

- concept search
- similarity
- semantic navigation
- clustering related artifacts

It fails to capture normativity.

A semantic index can say:

```text
These files relate to billing status.
```

The new abstraction can say:

```text
BillingService is currently the authoritative source for billing status in product flows,
supported by these uses and contradicted by these exceptions.
```

The difference is authority under evidence.

### Does The Abstraction Survive?

Yes, but narrowly.

It survives because retrieval, metadata, and indexing do not by themselves represent **revisable semantic authority**.

## Part X: One Sentence Test

Candidate sentences:

- "The Web is a graph of linked documents."
- "Git is content-addressed version control."
- "React is declarative user interface composition."
- "Kubernetes is desired-state orchestration."

Equivalent sentence:

> **This work is evidence-addressed semantics for evolving systems.**

More explicit:

> **An evidence-addressed semantic system represents meaning as scoped claims whose authority changes with supporting and contradicting evidence.**

That sentence survives without AI, repositories, current tooling, or prompt engineering.

## Final Judgment

A computational abstraction exists, but it is not as broad as the earlier work implied.

It is:

```text
scoped, revisable, evidence-backed claims
```

or, as a substrate:

```text
evidence-addressed semantics
```

This abstraction explains the prior papers:

- Intent Recoverability: ability to reconstruct claims from evidence.
- Intent Evidence Layer: storage and revision layer for those claims.
- Living repository claims: claim objects whose authority changes.
- Evidence-backed revision: update rule for claim authority.
- Repository Intelligence: one application domain.

If this abstraction does not exist as a first-class layer, all previous ideas collapse into documentation, search, static analysis, and RAG.

If it does exist, it creates a new kind of computation: transformations over meaning-bearing state, not just file state.

The one durable sentence is:

> **Evidence-addressed semantics represents meaning as scoped claims whose authority evolves with evidence.**

