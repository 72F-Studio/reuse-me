# Peer Review: Architectural Governance Skills

## Review Position

The report's central weakness is that it still frames architectural governance as a *skill design problem*. That is too narrow. The stronger framing is: AI coding agents need a repository-level control system that combines retrieval, static analysis, graph models, fitness functions, and procedural prompting. A skill may be the UI layer, but it should not be treated as the governing mechanism itself.

## Part 1: Attack The Premise

Architectural Governance Skills may be solving symptoms.

| Criticism | Verdict | Reason |
|---|---|---|
| Better repository indexes would eliminate the need | Partly survives | A good index beats prompting for discovery. If the agent can query component graphs, token inventories, API schemas, and ownership maps, many "search before coding" rules become unnecessary. |
| This is a context-window problem | Survives | Governance failures often happen because the relevant architecture is outside the active context. Skills are a workaround unless paired with scoped retrieval. |
| This is fundamentally a planning problem | Partly survives | Agents often patch before forming a repository-level plan. But planning without retrieval still hallucinates architecture. |
| Better retrieval outperforms better prompting | Survives strongly | A prompt cannot know the existing abstraction catalog. Retrieval/indexing should be primary; prompting should orchestrate. |
| Static analysis outperforms an LLM skill | Survives for measurable rules | Token violations, duplicate literals, import cycles, dependency boundaries, API schema drift, and dead exports are better enforced by tools. LLMs are better for semantic judgment. |
| Drift is caused by incentives, not capability | Survives | Teams reward feature throughput. Agents mimic that incentive unless architecture gates are built into workflow/CI. |
| Governance skills cause over-engineering | Survives conditionally | If every change triggers abstraction review, the skill becomes bureaucracy. Governance must be risk-scaled. |
| Prompt rules can enforce architecture | Does not survive | Prompting alone is weak enforcement. It can bias behavior, but cannot reliably preserve architecture without repository intelligence and objective checks. |

The premise survives only if narrowed: an architectural governance skill is useful as an *agent control interface*, not as the complete governance system.

## Part 2: First Principles

If AI coding skills did not exist, the optimal system would not start as Markdown instructions. It would start as a control loop:

```text
observe repository state
-> infer architectural model
-> classify proposed change
-> evaluate candidate changes
-> select least-drift option
-> implement
-> measure architectural delta
-> update repository memory
```

The primitive objects are not files. They are concepts, relations, constraints, and change costs.

A first-principles system needs:

| Layer | Role |
|---|---|
| Repository model | graph of components, APIs, state owners, tokens, domains, dependencies |
| Architectural laws | enforceable invariants and soft preferences |
| Fitness functions | measurable health signals |
| Retrieval engine | task-scoped architectural context |
| Planner | compares candidate changes |
| Static analyzers | deterministic drift detection |
| LLM reviewer | semantic interpretation and exception handling |
| Memory | records decisions, deviations, and recurring patterns |
| Feedback loop | tracks whether architecture improves or degrades |

The report currently treats the skill as the main artifact. The deeper theory should treat the skill as the *policy surface* for a repository intelligence system.

## Part 3: Missing Theories

The report names entropy, drift, and maintenance cost, but it does not yet define them rigorously.

| Missing Theory | Why It Matters | Effect On Proposed Architecture |
|---|---|---|
| Architectural entropy | Need a measure of disorder, not just examples | Requires metrics: duplicate concepts, divergent APIs, token violations, dependency disorder |
| Knowledge entropy | Architecture degrades when conventions are implicit or forgotten | Requires repository memory and discoverable laws |
| Semantic drift | Same concept slowly gets different names/shapes | Requires concept graph, not just file search |
| Concept duplication | More important than code duplication | Requires semantic clustering of components, APIs, state, and domain terms |
| Naming consistency | Names are retrieval handles for humans and agents | Requires vocabulary inventory and synonym detection |
| Change amplification | Measures how many places change for one conceptual edit | Should become a core fitness function |
| Change coupling | Files changed together reveal hidden architecture | Requires mining commit history |
| Cognitive load | Maintainability is partly human/agent comprehension cost | Requires measuring concept count, pattern count, and local novelty |
| Conway's Law | Architecture reflects ownership/communication structure | Governance must include ownership graph, not just code graph |
| Lehman's laws | E-type systems increase complexity unless actively maintained | Governance must be continuous/adaptive, not a one-shot checklist |
| Architectural fitness functions | Rules should become measurable objectives | Moves skill from procedural advice to evaluable control system |
| Program analysis | Many checks should be static, typed, graph-based | Reduces reliance on LLM judgment |
| Technical debt economics | Some debt is rational; not all drift should be blocked | Requires cost model and paydown threshold |

Lehman's law of increasing complexity is especially relevant: evolving systems become more complex unless work is explicitly done to reduce that complexity. That supports governance, but argues for continuous measurement rather than prompt-only intervention. Conway's Law also changes the model: architectural drift may reflect team boundaries, not agent ignorance.

## Part 4: Other Disciplines

Software engineering is not the best source for all governance models.

| Discipline | Transferable Model | Better Than Current Report? |
|---|---|---|
| City planning | zoning, permits, local variance, infrastructure capacity | Yes. Better model for allowing local change under global constraints. |
| Immune systems | self/non-self detection, anomaly response, memory cells | Yes. Good model for detecting architectural foreign bodies. |
| Control systems | feedback loops, sensors, setpoints, drift correction | Yes. Stronger than static rules. |
| Manufacturing | statistical process control, defect prevention, standard work | Yes. Supports continuous measurement and process gates. |
| Aviation checklists | short mandatory checks for high-risk operations | Yes. Good for pre-merge architecture gates. |
| Economics | debt, interest, option value, externalities | Yes. Explains when debt is rational and when it compounds. |
| Biology/ecology | invasive species, local adaptation, ecosystem balance | Useful metaphor, less operational. |
| Game design | incentive shaping and feedback timing | Useful for agent/team behavior, not architecture itself. |

The strongest borrowed model is control systems: architecture governance needs sensors, thresholds, actuators, and feedback. A skill without sensors is just a policy memo.

## Part 5: Dynamic Governance

The report still assumes architecture is mostly static. That is wrong for living systems.

Governance should be adaptive:

| Capability | Required Mechanism |
|---|---|
| Infer repository laws | mine repeated patterns, imports, schemas, token usage, naming |
| Learn conventions over time | update repository memory from accepted diffs |
| Detect health trend | compare architectural metrics across commits |
| Maintain health score | weighted fitness functions by subsystem |
| Detect emerging duplication | cluster similar new code before repeated copies harden |
| Recommend investments | identify high-interest debt: many edits, many clones, high churn |
| Adapt strictness | stricter in stable shared systems, looser in prototypes |

This implies the skill should not merely ask "does a component exist?" It should ask "what laws does this repo appear to obey, how confident are we, and does this change strengthen or weaken them?"

## Part 6: Architectural Fitness Functions

The paper should shift from rule compliance to measurable governance.

Candidate framework:

| Metric | Definition | Tooling |
|---|---|---|
| Source-of-truth count | number of authoritative owners for same concept | concept graph + schema/config scan |
| Duplication index | semantic/code clones weighted by concept criticality | clone detector + embeddings |
| Design-system compliance | percentage of UI built from approved primitives | AST/import scan |
| Token compliance | raw style values vs token references | CSS/AST scan |
| API consistency | deviation from route/error/pagination/schema conventions | schema diff + endpoint classifier |
| Change amplification | files touched per conceptual change | history mining |
| Blast radius | downstream dependents affected by change | dependency graph |
| Concept density | number of distinct concepts per module | semantic clustering |
| Abstraction quality | reuse count, cohesion, extension stability | graph + churn metrics |
| Dependency complexity | cycles, fan-in/fan-out, unstable dependencies | static graph analysis |
| Ownership clarity | files with clear major owner or owning team | commit/CODEOWNERS graph |
| Drift velocity | rate of new violations per time/change | metric trend |

Fitness functions are not new; evolutionary architecture already uses them as automated checks for architectural characteristics. The novelty would be adapting them to AI-agent decision-making, especially pre-generation and post-diff evaluation.

## Part 7: Repository Intelligence

Reasoning over files is inferior to reasoning over graphs.

Needed graphs:

| Graph | Nodes | Edges | Governance Use |
|---|---|---|---|
| Concept graph | domain concepts, names, schemas | synonym, ownership, implementation | detects semantic duplication |
| Component graph | UI primitives/screens | imports, composition, variants | enforces reuse/design system |
| Dependency graph | modules/packages | imports/build deps | finds cycles/blast radius |
| Feature graph | features/routes/screens | ownership, shared services | scopes changes |
| Ownership graph | teams/people/files | commits, reviews, CODEOWNERS | applies Conway-aware governance |
| Navigation graph | routes/pages/nav items | parent/child/link | prevents orphan UX paths |
| State graph | stores, caches, server data, local state | ownership, derivation, mutation | prevents parallel state |
| API graph | endpoints, clients, DTOs | calls, schemas, versions | enforces contract consistency |
| Theme graph | tokens, aliases, modes, components | references, overrides | prevents theme drift |

Graph reasoning is superior because architecture is relational. A file view hides coupling, ownership, and concept duplication. The W3C design tokens draft already treats tokens as named values with aliases/references, groups, and inheritance-like structure; that is naturally graph-shaped, not file-shaped.

## Part 8: Architecture As Optimization

The report needs an explicit multi-objective optimization model.

Objectives conflict:

| Objective | Conflicts With |
|---|---|
| Correctness | speed, small diff |
| Safety | speed, aggressive refactor |
| Maintainability | immediate implementation effort |
| Discoverability | abstraction density |
| Simplicity | extensibility |
| Consistency | local optimality |
| Extensibility | YAGNI |
| Token efficiency | deep architectural reasoning |
| Refactor cost | long-term drift reduction |
| Human comprehension | clever generic abstractions |
| AI comprehension | implicit conventions, dynamic magic |

Recommended hierarchy:

```text
1. Correctness
2. Safety/security/data integrity
3. Architectural invariants
4. Existing source-of-truth preservation
5. Repository consistency
6. Future maintenance cost
7. Local simplicity
8. Implementation speed
9. Token efficiency
```

This hierarchy must be risk-scaled. For low-risk leaf changes, architecture checks should collapse to a lightweight scan. For shared abstractions, APIs, state, and design systems, governance should become strict.

## Part 9: Novelty Assessment

Known ideas:

| Idea | Already Known As |
|---|---|
| architecture rules | architecture governance, ADRs |
| measurable checks | architectural fitness functions |
| dependency boundaries | static analysis, module constraints |
| duplication detection | clone detection |
| source of truth | standard state/config/design-system practice |
| design tokens | design-system tooling |
| graph reasoning | program analysis, knowledge graphs |
| repository ownership | code ownership research |
| change coupling | mining software repositories |
| adaptive evolution | Lehman/evolutionary architecture |

Potentially novel ideas:

| Idea | Why It Could Be Novel |
|---|---|
| Agent-facing architectural fitness functions | Fitness functions usually gate humans/CI; here they guide generation before code exists. |
| Repository law inference | Deriving implicit architectural laws from code history and accepted patterns. |
| Concept drift detection for codebases | Treat semantic duplication/naming divergence as drift, not just clone/code smell. |
| Architecture-aware retrieval planner | Retrieval based on graph surfaces, not file similarity. |
| AI comprehension as an architecture quality attribute | Codebases may need to optimize for future agent maintainability, not only human maintainability. |
| Prompt plus graph plus fitness control loop | Moves beyond "better prompt" into cybernetic governance of AI-driven software evolution. |
| Architectural immune system | Detects anomalous new concepts/patterns and routes them through stricter review. |

## Missing Theories

1. A formal definition of architectural entropy.
2. A distinction between code duplication and concept duplication.
3. A repository-law model: explicit, inferred, violated, deprecated.
4. A theory of AI-induced architectural drift.
5. A graph model of repository intelligence.
6. A measurable fitness-function framework.
7. A cost model for architectural debt interest.
8. A control-loop model for adaptive governance.
9. A Conway-aware ownership model.
10. A cognitive-load model for humans and agents.
11. A theory of semantic drift across names, APIs, components, and state.
12. A risk-scaled governance model.

## Assumptions To Challenge

1. Prompting is the right governance mechanism.
2. The skill should be text-first rather than tool-first.
3. Architecture can be discovered just-in-time from files.
4. Reuse is usually better than local implementation.
5. Fewer files affected means lower maintenance cost.
6. Consistency is always good.
7. Design-system adherence should be strict.
8. Existing abstractions are trustworthy.
9. Agents fail mainly because they do not reason enough.
10. Architecture is stable enough to encode in rules.
11. A single skill can generalize across repo maturity levels.
12. Human maintainability and AI maintainability are the same thing.

## New Concepts Worth Introducing

1. **Repository Laws**: inferred and explicit invariants that describe how a repository wants to evolve.
2. **Architectural Delta**: the measured change in architecture health caused by a diff.
3. **Concept Duplication Index**: semantic duplication across code, components, APIs, tokens, and state.
4. **Drift Velocity**: rate at which architectural violations accumulate.
5. **AI Change Amplification**: number of future prompts/files required because an agent chose a local patch.
6. **Architecture Retrieval Surface**: the minimal graph neighborhood needed for a change.
7. **Agent-Readable Architecture**: architecture optimized for both human and AI comprehension.
8. **Governance Strictness Function**: maps change risk to required discovery/verification depth.
9. **Architectural Immune Response**: anomaly detection and escalation for new patterns.
10. **Fitness-Guided Generation**: candidate diffs scored before implementation.

## Three Highest-Value Improvements

1. **Replace "skill as governance" with "skill as control surface over repository intelligence."**

   This is the largest conceptual upgrade. The paper becomes about AI-mediated software evolution, not prompt engineering.

2. **Introduce measurable architectural fitness functions and architectural delta.**

   This makes the theory falsifiable. Without metrics, the work remains advice. With metrics, it can be evaluated.

3. **Add repository graph intelligence and repository law inference.**

   This addresses the real failure mode: agents lack a durable model of the codebase. Graphs plus inferred laws would make the architecture actionable before generation, not merely auditable afterward.

## Bottom Line

The paper's current architecture chapter is useful but still procedural. To become intellectually stronger, it needs to move from "rules an agent should follow" to "a measurable, adaptive control system for repository evolution under AI-generated change."

