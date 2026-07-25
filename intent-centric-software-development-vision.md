# Intent-Centric Software Development

## Product Philosophy

Today the primary abstraction in software development is the file. That made sense when repositories were passive storage and humans were the only maintainers. Files are good containers for code. They are poor containers for intent.

In an intelligent repository, the primary abstraction becomes the **change objective**: what the developer is trying to evolve, why it matters, what concepts it touches, what constraints govern it, and what evidence supports safe modification.

Files do not disappear. They become the lowest layer, like blocks on disk after Git. Developers still inspect code when needed, but they no longer begin by asking:

```text
Where is the file?
```

They begin by asking:

```text
What concept am I changing?
What intent must survive?
What constraints already govern this area?
What does the repository know, and where is it uncertain?
```

The repository becomes an active participant because software work is no longer treated as editing text. It is treated as evolving accumulated knowledge.

## Repository Experience

Opening a repository no longer shows a project tree first.

The first screen is a repository briefing:

```text
This system manages subscription billing for 42 active product surfaces.

Stable concepts:
- Account
- Workspace
- Subscription
- Invoice
- Entitlement

Unstable concepts:
- Plan and Package are currently overlapping.
- Invoice adjustment has two competing implementations.

Current migrations:
- Billing API v2 is replacing legacy account billing endpoints.
- Design tokens are moving from palette names to semantic roles.

High-confidence laws:
- Entitlements are derived from subscription state.
- Billing state is server-owned.
- Public billing errors use the shared error envelope.

Open uncertainty:
- Trial extension behavior differs between admin and self-serve flows.
```

Onboarding changes from "read these docs and explore the code" to "ask the repository what it believes." A new developer can understand a million-line repository by moving through concepts, active constraints, recent decisions, and uncertain areas before opening code.

What disappears:

- wandering through folders to infer architecture
- asking Slack why something exists
- treating stale docs as equal to current practice
- re-learning the same historical context per person
- code review comments that say "we already have a pattern for this"
- AI agents reinventing components because the source of truth was hidden

## Repository Conversations

The repository should not sound like a chatbot. It should speak as a system with memory, evidence, and uncertainty.

Natural conversations:

```text
You are changing InvoiceAdjustment. This concept has two implementations.
The newer one is used by self-serve billing. The older one remains in admin tools.
I am 72% confident the intended direction is consolidation into the newer model.
```

```text
This component resembles SelectMenu, but bypasses keyboard behavior and tokenized spacing.
If this is a visual variant, extend SelectMenu.
If this is a distinct interaction model, record that distinction.
```

```text
You are editing a derived value. The source of truth is SubscriptionState.
Changes here may fix the screen but leave entitlement evaluation unchanged.
```

```text
This API shape conflicts with the billing error envelope used by six adjacent endpoints.
No accepted exception exists.
```

```text
This convention is weakening. Three new flows bypass the shared empty-state component.
Should this become a new pattern, or should these be reconciled?
```

Conversations that should never happen:

- vague praise
- unsolicited lectures
- speculative architecture advice without evidence
- blocking statements without explanation
- pretending uncertainty is certainty
- repeating things the developer can see directly in code

The repository should remain silent when:

- the change is local and low-risk
- it has no relevant evidence
- the developer is intentionally exploring
- the cost of interruption exceeds the architectural risk

Its initiative should scale with consequence. Quiet for local edits. Active for source-of-truth changes, public APIs, shared components, migrations, security boundaries, and repeated patterns.

## Repository Memory

The repository remembers what future maintainers cannot safely reconstruct.

Remember long-term:

- architectural decisions and their scope
- canonical concepts
- source-of-truth ownership
- stable product intent
- design philosophy
- migration history
- important trade-offs
- rejected alternatives
- known exceptions
- high-cost failures and their causes

Decay gradually:

- temporary workarounds
- experimental branches
- old rationale tied to retired concepts
- deprecated conventions
- one-off decisions
- migration notes after completion

Memory ages by evidence. A decision referenced by active code, tests, and current changes stays fresh. A decision contradicted by accepted changes loses confidence. Forgotten knowledge is not deleted; it moves to historical memory, visible when explaining legacy code but no longer treated as guidance.

Maintainers browse memory by concept, not by document title:

```text
Account
- current meaning
- historical meanings
- source of truth
- related APIs
- decisions
- migrations
- unresolved disagreements
- confidence level
```

## Navigating Software

Files remain available, but they are no longer primary navigation.

| Navigation Model | Use |
|---|---|
| Concept | best default for understanding what exists |
| Intent | best for knowing what must remain true |
| Architecture | best for boundaries and allowed dependencies |
| User journey | best for product behavior |
| Feature | best for delivery work |
| Business capability | best for large organizations |
| Evolution timeline | best for migrations and historical reasoning |
| Ownership | best for review and accountability |
| Evidence | best when repository confidence is contested |
| Confidence | best for finding risky or poorly understood areas |
| Dependencies | best for blast radius |
| Change history | best for instability and debt |

Developers naturally think in goals, behaviors, and concepts. Repositories currently force them into files, packages, and implementation artifacts. Intelligent repositories reverse that. They let people enter through meaning and descend into code only when necessary.

## Implementing A Feature

Request:

```text
We need to add prorated refunds for annual subscriptions.
```

Flow:

1. The repository identifies touched concepts: Subscription, Invoice, Refund, Entitlement, Payment Provider.
2. It explains current intent: refunds are currently manual, invoices are source of truth, entitlements follow subscription state.
3. It shows uncertainty: refund behavior differs between admin tooling and support scripts.
4. It maps affected journeys: cancellation, downgrade, support adjustment, renewal failure.
5. It lists governing constraints: billing state server-owned, public errors use shared envelope, provider IDs are never exposed to UI.
6. Human and AI propose a change objective: introduce prorated refund calculation as a billing-domain capability, not as UI logic.
7. The repository evaluates candidate paths:
   - local admin patch: fast, high drift
   - provider-specific helper: medium drift
   - billing-domain refund policy: higher initial cost, lower future cost
8. Human chooses the path.
9. AI prepares the change using repository guidance.
10. The repository evaluates the result:
    - source of truth preserved
    - API convention preserved
    - entitlement flow unaffected
    - new refund policy concept recorded
    - one uncertainty remains: support script behavior
11. Human approves the architectural effect, not just the diff.
12. The repository learns: refund policy is now a canonical billing concept with initial evidence and scope.

The flow of thought shifts from "write code, then review code" to "agree on intent, choose an evolution path, then make code follow."

## Architectural Drift

When an AI introduces drift, the repository detects a mismatch between the change and existing intent.

Example:

```text
A new UI component calculates entitlement access locally.
```

The repository responds:

```text
This duplicates entitlement logic outside the billing domain.
Original intent: entitlement access is derived from SubscriptionState.
Evidence:
- billing ADR-014
- EntitlementService usage in 18 flows
- prior removal of local entitlement checks in 2024 migration

Recovery options:
1. Replace local check with EntitlementService result.
2. Add a new entitlement variant if this flow has distinct rules.
3. Record an exception if this is temporary.
```

The repository should resist architectural decay, but not by refusing change outright. It should first explain, then offer recovery paths, then ask for human judgment when intent or evidence is contested.

## The IDE Of 2035

The project tree is replaced by a **repository map**:

```text
Concepts
Journeys
Boundaries
Migrations
Uncertainty
Recent evolution
```

"Find in Files" becomes:

```text
Where is this concept represented?
Where is this intent enforced?
Where has this decision been applied?
Where are variants intentional?
Where is this convention weakening?
```

"Go To Definition" becomes:

```text
Go to source of truth.
Go to governing decision.
Go to canonical implementation.
Go to known exception.
Go to historical origin.
```

Pull requests become **change proposals**:

```text
Objective
Affected concepts
Intent preserved
Intent changed
Repository laws touched
Architectural delta
Evidence
Open uncertainty
Human decisions required
```

Code review becomes evolution review. Reviewers stop spending time saying "use the shared component" or "this violates the API shape." The repository says that first. Humans review trade-offs, intent changes, and unresolved uncertainty.

New panels:

- Concept Map
- Intent Ledger
- Source of Truth
- Active Migrations
- Architectural Delta
- Uncertainty Queue
- Evidence Trail
- Memory Timeline
- Review Consequences

Obsolete workflows:

- manual onboarding tours
- tribal-knowledge code review
- searching commit history by guesswork
- stale architecture diagrams as separate artifacts
- AI chat sessions with no repository memory
- file-first exploration for large systems

## Team Collaboration

Architectural discussions become repository memory, not lost conversation.

Disagreements are represented explicitly:

```text
Concept: Package
Conflict:
- Growth team uses Package as purchasable bundle.
- Billing team uses Package as pricing container.
Status: unresolved.
Risk: new API work may preserve ambiguity.
```

Uncertainty becomes shared work, not individual confusion.

Senior engineers teach the repository by confirming laws, recording exceptions, retiring stale decisions, and explaining why an unusual design exists. Junior engineers learn from the repository by following concepts, evidence, and change consequences.

AI becomes a teammate when it stops acting from session memory and starts operating through shared repository memory. It can propose, compare, and execute, but the repository remains the shared source of context.

## Failure Stories

The repository remembers the wrong intent.

Recovery: show evidence, allow correction, preserve old belief historically, lower confidence in similar inferred claims.

The repository becomes overconfident.

Recovery: confidence must be visible and challengeable. High-impact enforcement requires evidence diversity, not just repeated pattern matching.

Humans disagree with repository memory.

Recovery: disagreement is recorded as a decision point, not treated as an error. Human override updates memory with rationale.

The repository becomes conservative.

Recovery: distinguish stable law from habit. Encourage experiments in scoped areas. Require intent recording for divergence, not universal conformity.

AI overfits conventions.

Recovery: repository identifies when a convention is descriptive but not normative. Humans can mark "do not generalize."

Knowledge becomes stale.

Recovery: memory decays with churn, contradiction, and time. Stale claims remain visible but lose authority.

The repository blocks necessary change.

Recovery: every block must offer paths: comply, justify exception, change the law, or mark migration.

## Product Principles

1. **Meaning before files.** The first interface is the concept being changed, not the file containing code.

2. **Evidence before authority.** The repository must show why it believes something.

3. **Confidence is part of the interface.** Uncertainty should be visible wherever guidance appears.

4. **Every exception has a memory.** If a deviation is accepted, future maintainers should know why.

5. **The repository guides change, not taste.** It should protect intent and constraints, not enforce arbitrary uniformity.

6. **Silence is a feature.** Low-risk work should not be interrupted by architectural narration.

7. **History must remain actionable.** Memory matters only when it helps future decisions.

8. **Humans decide contested intent.** The repository can surface evidence, but it cannot own purpose.

9. **AI shares the same memory as the team.** No private assistant context should become the hidden architecture.

10. **Evolution is the product.** The repository is not a place where software sits. It is the medium through which software changes.

## Closing

Software development changes when repositories stop being passive storage and become participants in their own evolution.

The developer experience moves from:

```text
open files
search code
infer architecture
make change
hope review catches context
```

to:

```text
state objective
inspect intent
understand constraints
choose evolution path
apply change
evaluate consequence
update memory
```

That is the shift.

Git made collaboration durable. Figma made design multiplayer. The next step is making software knowledge durable, inspectable, and shared by humans and AI alike.

The future repository does not merely contain code. It knows what the code is trying to preserve.

