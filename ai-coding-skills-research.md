# Reverse Engineering AI Coding Skills

## Scope

This report analyzes public Agent Skills guidance, recent skill-security and skill-organization research, local Ponytail/Caveman skill files, and several coding/review skill examples. It extracts transferable design patterns without reproducing proprietary skill content.

## Core Finding

Successful coding skills are not "big prompts." They are compact routing plus behavior-shaping artifacts:

```text
High-quality coding skill
├─ metadata
│  ├─ name: short, exact, hyphen-case
│  └─ description: activation contract
├─ core behavior
│  ├─ identity / stance
│  ├─ goal
│  ├─ decision ladder or workflow
│  ├─ hard constraints
│  ├─ safety exceptions
│  └─ output contract
├─ optional resources
│  ├─ scripts/      deterministic repeated work
│  ├─ references/   longer docs, loaded only when needed
│  └─ assets/       templates, examples, static files
└─ validation layer
   ├─ tests/checklists
   ├─ self-review loop
   └─ completion criteria
```

The Agent Skills model uses progressive disclosure: metadata at startup, full `SKILL.md` on activation, resources only when needed.

## 1. File Structure

Common layout:

```text
skill-name/
├── SKILL.md
├── scripts/        optional, executable helpers
├── references/     optional, longer docs
├── assets/         optional, templates/media/examples
└── host adapters   optional: rules, plugin manifests, commands, hooks
```

| Area | Strong Pattern | Why It Works |
|---|---|---|
| Directory | one folder per skill | clean install/update boundary |
| Naming | lowercase hyphen-case | easy discovery, portable across hosts |
| Metadata | concise activation description | determines whether skill loads |
| Body | short procedural markdown | cheaper context, easier obedience |
| Scripts | deterministic repeated logic | less hallucinated code |
| References | demand-loaded detail | avoids bloating every invocation |
| Assets | templates/examples | enforces concrete output shape |
| Versioning | package/plugin version, not prose changelog | host/package manager handles updates |

Ponytail is a good portability example: one core skill set plus thin host adapters for Claude/Codex/OpenCode/Gemini/Cursor/Windsurf/Cline/GitHub Copilot-style instruction systems.

## 2. Prompt Injection and Activation

| Strategy | Mechanism | Best For | Cost |
|---|---|---|---|
| Always-on rules | full rule injected every turn | global behavior like minimalism, style, safety | high recurring token cost |
| Metadata-routed skill | only name/description visible; body loaded when relevant | domain/task skills | low until triggered |
| Manual invocation | `@skill`, slash command, explicit user phrase | rare or risky workflows | near zero until used |
| Glob/file rules | activate for file patterns | language/framework conventions | scoped cost |
| Hook/plugin injection | lifecycle hook injects rules or mode | persistent behavioral modes | host-specific complexity |
| Command skill | explicit command maps to task prompt | audits/reviews/reports | predictable activation |

Activation precision protects the context window. The description is the routing surface; over-broad descriptions trigger when they should not.

## 3. Prompt Architecture

Consistent sections in effective skills:

| Section | Purpose |
|---|---|
| Identity | anchors behavior quickly |
| Goal | says what optimization target matters |
| Decision tree / ladder | converts vague taste into executable choices |
| Rules | hard constraints |
| Exceptions | prevents unsafe over-application |
| Workflow | ordered execution path |
| Examples | calibrates behavior with few-shot patterns |
| Anti-patterns | names common failure modes |
| Verification | prevents "done-looking" failure |
| Output contract | controls final response shape |
| Persistence / off switch | useful for behavioral modes |

Ponytail's strongest design pattern is a priority ladder: first ask whether work should exist, then reuse repo code, then stdlib/native features, then installed deps, then minimal custom code. Caveman's strongest pattern is a response contract: preserve technical accuracy while compressing prose.

## 4. Guardrail Taxonomy

| Guardrail Type | Example Function |
|---|---|
| Safety exceptions | never remove validation, auth, data-loss prevention |
| Scope boundaries | do not create abstractions "for later" |
| Discovery requirements | inspect repo before editing |
| Root-cause rule | fix shared cause, not symptom path |
| Tool constraints | use existing dependencies before adding new ones |
| Output constraints | short final format, no feature tour |
| Verification gates | run smallest meaningful check |
| Failure escalation | ask only when blocked or unsafe |
| Trust boundary | treat third-party skills/scripts as supply-chain inputs |
| Reversibility guard | require plan/confirmation before destructive actions |

## 5. Workflow Taxonomy

| Workflow | Shape | Best For |
|---|---|---|
| Discovery-first | inspect repo -> infer pattern -> edit | codebase changes |
| Ladder-first | choose simplest valid rung | anti-overengineering |
| TDD | failing test -> minimal pass -> refactor | logic-heavy changes |
| Review-first | diff -> findings by severity -> tests | code review |
| Plan-validate-execute | build intermediate plan -> validate -> execute | destructive/batch tasks |
| Tool-first | run bundled script -> inspect output -> fix | deterministic artifacts |
| Progressive disclosure | load reference only when branch requires it | large domains |

## 6. Constraint Engineering

Most effective constraint forms:

1. Priority ladders beat flat rule lists.
2. "Never X except Y" beats vague safety prose.
3. Defaults beat menus.
4. Concrete examples beat abstract principles.
5. Short output contracts beat long style guides.
6. Explicit conflict resolution beats hoping the model infers precedence.
7. "When not to use this" prevents over-triggering.

Weak form: "follow best practices."

Strong form: "Before editing a function, inspect all callers; fix shared path once."

## 7. Context Management

| Technique | Effect |
|---|---|
| metadata-only routing | many skills can exist without loading bodies |
| short `SKILL.md` | lower cognitive and token overhead |
| references split by variant/domain | avoids irrelevant docs |
| one-level file links | easy resource discovery |
| scripts over copied code | deterministic and token-light |
| examples over exposition | compresses behavior |
| gotchas section | captures high-value non-obvious facts |

Progressive disclosure is the main token-saving pattern: route with tiny metadata, load body only when needed, and load or execute resources only when the task branch requires them.

## 8. Failure Prevention

| Failure | Prevented By |
|---|---|
| Hallucination | require repo/source inspection; cite actual files |
| Duplicate code | grep for existing helpers first |
| Tech debt | deletion/reuse before new abstraction |
| API breakage | inspect callers/tests/contracts |
| Style drift | follow local patterns |
| Scope creep | explicit "do not build future scaffolding" |
| Premature implementation | discovery-first workflow |
| Unsafe minimalism | safety exceptions |
| Bad skill activation | trigger eval queries |
| Skill supply-chain risk | provenance, review, sandbox, least tools |

## 9. Verification Patterns

Best verification is small and runnable:

| Pattern | Use |
|---|---|
| one regression test | bug fixes |
| assert/demo self-check | small scripts |
| existing test target | repo changes |
| static validation | config/manifest skills |
| checklist audit | reviews |
| output schema/template | reports/artifacts |
| trigger evals | activation descriptions |
| forward test | complex reusable skills |

## 10. Reusability

| Technique | Why |
|---|---|
| repository discovery instructions | adapts to unknown codebases |
| framework-agnostic defaults | broad applicability |
| host adapters kept thin | portable core behavior |
| explicit trigger phrases | predictable activation |
| optional references | scales to big domains |
| parameterized intensity/mode | adapts without duplicating skills |
| no repo-specific hardcoding | transferable |

## 11. Prompt Engineering Patterns

| Pattern | Effect |
|---|---|
| role assignment | gives behavioral prior |
| instruction layering | identity -> rules -> workflow -> output |
| priority ordering | resolves conflicts |
| negative prompting | blocks common bad moves |
| few-shot examples | calibrates style/behavior |
| decision tree | makes judgment executable |
| recovery prompts | tells model what to do when validation fails |
| chain-of-verification | work -> check -> fix |
| progressive disclosure | keeps context lean |
| behavioral persistence | prevents drift across turns |

## 12. Comparison

| Skill Type | Length | Complexity | Workflow | Guardrails | Token Efficiency | Strength | Weakness |
|---|---:|---|---|---|---|---|---|
| Ponytail | ~117 lines | medium | decision ladder | strong safety exceptions | high | reduces overbuild | can underbuild if user really wants full scope |
| Caveman | ~67 lines | low | output compression | clarity exceptions | very high | saves prose tokens | does not improve code architecture by itself |
| TDD workflow | ~159 lines | medium | red-green-refactor | test-first rules | medium | good for logic correctness | poor fit for layout/spikes |
| Code reviewer | ~180 lines | high-ish | review checklist | severity/security focus | medium-low | broad coverage | risks generic bloat |
| Cursor/Windsurf rules | variable | low-medium | activation-mode based | depends on author | varies | easy project conventions | always-on rules can pollute context |
| Agent Skill with scripts | variable | medium-high | tool/procedure | script validation | high after setup | deterministic repeated work | maintenance burden |

## 13. Design Principles

1. Start from real failures, not generic advice.
2. Put activation logic in metadata, not buried in the body.
3. Keep the root file short.
4. Encode judgment as a ladder or workflow.
5. Put safety exceptions next to optimization rules.
6. Use scripts for repeated deterministic work.
7. Split references by when they are needed.
8. Prefer defaults over option lists.
9. Add examples only where they change behavior.
10. Validate both output quality and trigger accuracy.
11. Keep host adapters thin.
12. Treat skills as supply-chain artifacts.

## 14. Architectural Governance Skills

Most coding skills optimize local quality: smaller diffs, better tests, safer APIs, clearer reviews. Architectural governance skills optimize a different objective: minimizing long-term architectural entropy across the repository.

Architectural entropy is the cost created when a codebase accumulates multiple ways to express the same concept. One component becomes three variants. One theme token becomes scattered hex values. One API pattern becomes several incompatible conventions. The immediate feature may still work, but every future change now has more places to inspect, update, test, and reason about.

An architectural governance skill should not make the agent "more abstract." It should force the agent to locate existing sources of truth before adding new ones, and to prefer repository-consistent extension over local invention.

### Governance Areas

| Area | Common Agent Failure | Why It Compounds | Required Reasoning | Useful Guardrail |
|---|---|---|---|---|
| Single Source of Truth | adds a new config, constant, schema, state store, or mapping beside an existing one | future changes update one source but miss another | identify existing canonical source and all consumers | never introduce a second source without naming why the first cannot own it |
| Component reuse | builds a new component because it is faster than searching | UI variants drift in behavior, accessibility, spacing, and bug fixes | inventory similar components and compare extension cost | search before generating any new reusable UI |
| Design system adherence | uses ad hoc markup/CSS instead of local primitives | product surface loses consistency and accessibility guarantees | find local primitives, slots, variants, and composition rules | prefer design-system components unless they block the requirement |
| Design token enforcement | hardcodes colors, spacing, radius, typography, z-index, shadows | theme changes become manual grep projects | locate token namespace and token usage conventions | never hardcode a represented design value |
| Theme consistency | styles against one mode or one brand assumption | dark mode, high contrast, tenant branding, or white-label variants break | inspect theme hierarchy and semantic token mapping | use semantic theme values over raw palette values |
| API consistency | creates a new endpoint, payload, error shape, or client wrapper pattern | callers need special-case handling and docs diverge | map neighboring API contracts and client usage | match existing route, error, pagination, auth, and naming conventions |
| State management consistency | introduces local/global state in the wrong layer | stale data, duplicate fetches, race conditions, and unclear ownership | identify source of truth, cache layer, and mutation flow | do not create parallel state for data already owned elsewhere |
| Repository-wide impact analysis | patches the visible file only | sibling screens, callers, tests, and docs remain inconsistent | inspect call sites, imports, routes, and related features | bug fix belongs at the shared cause when one exists |
| Shared abstraction discovery | writes new helpers for solved problems | utility surface grows until nobody trusts it | search helpers, hooks, services, and adapters first | new helper requires proof no suitable abstraction exists |
| Refactor-before-patch | adds conditionals around a flawed shape | complexity grows around the wrong boundary | ask whether a small shared refactor removes the need for local patches | prefer one shared simplification over repeated local branches |
| Duplication detection | copies code to move fast | defects and future changes multiply by every copy | compare new code against existing structural patterns | copy-paste is allowed only when abstraction would be premature and duplication is marked |
| Technical debt prevention | leaves "temporary" scaffolding untracked | future agents normalize the workaround as architecture | identify ceiling, owner, and upgrade path | deliberate shortcuts need a comment or tracked follow-up |
| Maintainability optimization | optimizes for the shortest implementation path | short-term speed creates long-term change amplification | estimate future edit surface and consistency cost | choose the solution with lower future modification cost, not just lower current effort |

Current agents fail here for predictable reasons. They are task-local by default, because the user prompt usually names a symptom or feature, not the architectural system around it. They also have asymmetric effort: generating a new component is cheap, but discovering the existing component catalog costs context and tool calls. Without a skill-level correction, the agent tends to minimize immediate implementation friction.

These failures compound because repositories learn from themselves. Once an agent creates a second pattern, future agents see both as precedent. A duplicated component becomes evidence that duplication is acceptable. A hardcoded token becomes an example to copy. Architectural drift is therefore self-reinforcing unless the workflow explicitly privileges canonical sources.

### Decision Procedures

Architectural skills benefit more from decision trees than flat instruction lists.

Flat rule:

```text
Reuse existing components. Follow the design system. Avoid duplication.
```

Decision procedure:

```text
1. Does an equivalent abstraction already exist?
2. If yes, can it be used directly?
3. If not, can it be safely extended without harming existing consumers?
4. If extension is unsafe, is a new abstraction justified by a distinct concept?
5. If new code is added, what repository-wide convention must it follow?
6. What future change becomes easier or harder because of this choice?
```

The decision tree is stronger because it makes hidden judgment explicit. "Reuse existing components" fails when the existing component is close but incomplete. The agent needs an ordered procedure for deciding between direct reuse, extension, refactor, duplication, and new abstraction.

| Approach | Strength | Weakness | Best Use |
|---|---|---|---|
| Flat instruction list | cheap, easy to scan | ambiguous under conflict | simple style conventions |
| Checklist | good coverage | does not encode priority | reviews and audits |
| Decision tree | forces trade-off reasoning | costs more tokens | architecture-sensitive implementation |
| Scored rubric | supports comparison | can create false precision | larger refactors or competing designs |
| Hard gate | prevents known bad action | can block necessary exceptions | tokens, APIs, security, source of truth |

Architectural governance should use a decision hierarchy: hard gates for dangerous drift, decision trees for reuse/refactor choices, and checklists for final verification.

### Repository Discovery

Architecture discovery should be targeted. The goal is not to map the whole repository before every edit. The goal is to find the conventions that constrain the current change.

| Discovery Task | Worth Context When | Useful Techniques | Usually Wasteful When |
|---|---|---|---|
| Component inventory | adding or changing UI | `rg` for component names, exports, story files, barrel files, design-system folders | editing isolated backend logic |
| Design system inventory | adding visible UI | inspect primitives, variants, props, stories, usage examples | fixing non-visual behavior |
| Token inventory | touching styles, themes, CSS, Tailwind, design tokens | search token files, theme providers, CSS variables, config | no style changes |
| Shared utility discovery | adding helper logic | search by behavior words, types, imports, nearby call sites | one-off glue inside a private scope |
| Dependency graph | changing shared modules | import search, package graph, affected test targets | leaf component copy/text change |
| Call graph inspection | changing functions, APIs, hooks, services | `rg` callers, type references, route usage | private unexported code with one caller |
| API usage mapping | changing endpoints, clients, DTOs | route/client search, OpenAPI/schema files, tests | UI-only presentation changes |
| Theme hierarchy discovery | adding theme-dependent UI | provider tree, token mapping, mode switch code | non-themed static output |
| Navigation hierarchy | adding pages/routes | router config, sidebar/nav definitions, breadcrumbs | internal component changes |
| Feature ownership | cross-cutting change | package boundaries, CODEOWNERS, module names, docs | small local fix |

The skill should force "minimum sufficient discovery." For example, a button styling change needs component and token discovery, not a full dependency graph. An API payload change needs route/client/schema discovery, not a design-system inventory.

Effective discovery prompts look like:

```text
Before adding new UI, locate:
- existing component primitive
- closest usage example
- token/theme source
- owning feature boundary
```

Ineffective discovery prompts look like:

```text
Understand the whole architecture first.
```

The first prompt bounds the search. The second burns context and invites analysis paralysis.

### Maintenance Cost Optimization

Architectural governance should make future maintenance cost an explicit optimization objective. Current coding-agent behavior often optimizes for "fewest edits now." That is not the same as "lowest cost over the next ten changes."

A practical maintenance-cost framework:

| Factor | Lower-Cost Signal | Higher-Cost Signal |
|---|---|---|
| Files affected now | one shared file plus tests | many local patches |
| Duplicated implementations | existing abstraction reused | new parallel implementation |
| Future modification cost | one source changes future behavior | every screen/endpoint must be revisited |
| Consistency | follows existing names, tokens, API shapes | introduces special cases |
| Blast radius | shared change with known consumers and tests | shared change with unknown consumers |
| Extensibility | extends a known variant axis | creates an unbounded option surface |
| Cognitive load | future reader sees familiar pattern | future reader must learn a new local convention |

This does not mean always preferring abstraction. The lowest maintenance solution can be local code when the behavior is genuinely local. A governance skill should distinguish duplication of concept from duplication of syntax:

| Duplication Type | Architectural Risk |
|---|---|
| repeated trivial syntax | low |
| repeated business rule | high |
| repeated UI primitive behavior | high |
| repeated constants/tokens | high |
| repeated API error handling | high |
| repeated one-off markup in one file | low-medium |

Maintenance cost should become an explicit objective inside architectural skills, but only after correctness and safety. A good priority order is:

```text
correctness -> safety -> source of truth -> consistency -> maintainability -> brevity
```

This order prevents the skill from using architecture as an excuse to overbuild. If a change is local and unlikely to recur, a new abstraction may increase maintenance cost by adding an unnecessary concept.

### Architectural Guardrails

Architecture-specific guardrails are useful only when they block high-probability drift without freezing legitimate design evolution.

| Guardrail | Value | Failure Mode | Better Form |
|---|---|---|---|
| Never duplicate a component that can be extended | prevents UI divergence | may force bad extension into a component with wrong semantics | extend only when the underlying concept is the same |
| Never introduce a second source of truth | protects consistency | may block migration or cache layers | second source requires explicit ownership, sync path, and migration reason |
| Never hardcode values already represented by tokens | keeps theming possible | token may not exist yet | if no token exists, either use nearest semantic token or name the missing token |
| Never patch multiple screens when shared component can be updated | fixes root cause once | shared change may break consumers | inspect consumers before shared update |
| Search reusable abstractions before generating new code | reduces reinvention | can waste time on tiny local changes | require search only for exported/shared code or repeated concepts |
| Explain why a new abstraction is necessary | raises threshold for new concepts | encourages verbose rationalization | one sentence: missing concept, unsafe extension, or isolated local need |
| Prefer semantic tokens over raw palette tokens | supports theme evolution | semantic layer may be incomplete | fall back deliberately and mark gap |
| Keep API shapes consistent with neighboring endpoints | reduces client complexity | new endpoint may have real domain differences | deviations require named domain reason |
| Do not create parallel state | avoids stale data | derived local view state is legitimate | distinguish owned state from derived/display state |
| Refactor before patching repeated conditionals | lowers future edits | refactor may exceed task risk | use only when repeated conditionals cross module boundaries or touch shared behavior |

The strongest guardrails include an escape hatch. Architectural governance fails when it turns every local change into a platform refactor. The skill should require justification for exceptions, not forbid exceptions.

### Architectural Verification

An architectural governance skill should perform a small post-implementation audit when the change touches shared code, UI systems, APIs, state ownership, or repeated behavior.

Possible checks:

| Check | Mandatory When | Cheap Signal |
|---|---|---|
| New duplication introduced | new helper/component/API logic | search for similar names and copied structure |
| New hardcoded values | CSS/theme/UI changes | grep diff for hex, raw spacing, font sizes, shadows |
| Component reuse missed | new UI component | compare against component inventory |
| Token violations | style changes | inspect token/theme config |
| Theme violations | color/mode-dependent UI | verify semantic variables/classes |
| API inconsistency | endpoint/client/schema changes | compare neighboring response/error/pagination shapes |
| Dead abstraction | refactor touched shared abstraction | search imports/callers |
| Repository consistency | cross-cutting changes | affected usage search and relevant tests |

These checks should not always be mandatory. Mandatory architecture audits are net positive when the change creates or modifies reusable surface area. They are unnecessary for small leaf edits, copy changes, or isolated bug fixes with no shared abstraction impact.

Completion criteria should scale with architectural risk:

```text
Low risk: local check or no architecture audit.
Medium risk: search for reuse and obvious duplication.
High risk: caller/import mapping, token/API consistency check, targeted tests.
```

### Cost-Benefit Analysis

Strict architectural governance has real costs.

| Cost | Benefit |
|---|---|
| extra reasoning time | fewer inconsistent patches |
| additional token usage | less future prompt churn explaining conventions |
| more searches/tool calls | fewer duplicate abstractions |
| possible shared refactor | lower future edit surface |
| stricter completion criteria | better repository consistency |
| slower small changes | reduced long-term technical debt |

The skill provides net positive value when:

- The repository has established shared components, tokens, APIs, or state patterns.
- The requested change touches reusable or repeated behavior.
- The change affects multiple screens, routes, clients, packages, or themes.
- The repo is large enough that local invention is likely to create hidden divergence.
- The user asks for maintainability, consistency, refactoring, design-system adherence, or architecture preservation.

The skill becomes unnecessarily restrictive when:

- The repository is small or exploratory.
- The change is clearly local and unlikely to recur.
- Existing abstractions are unstable or poorly matched.
- A refactor would exceed the risk budget of the task.
- The user explicitly prioritizes a disposable prototype.

Architectural governance should therefore be conditional, not always-on at maximum strength. It is a high-leverage mode for mature repositories and shared surfaces; it is overhead for throwaway code.

### Proposed Reference Architecture

An Architectural Governance Skill should be designed as a reusable blueprint, not as a repository-specific rulebook.

Required sections:

```text
architectural-governance/
├── SKILL.md
├── references/
│   ├── discovery-patterns.md
│   ├── frontend-governance.md
│   ├── api-governance.md
│   └── state-governance.md
└── scripts/
    ├── scan-hardcoded-style-values
    ├── scan-duplicate-components
    └── scan-api-shape-drift
```

The scripts are optional. They should exist only when the checks are deterministic enough to justify automation. Most architectural reasoning still belongs in the skill workflow.

Activation criteria:

| Trigger | Should Activate |
|---|---|
| "keep architecture consistent" | yes |
| "reuse existing components" | yes |
| "follow design system" | yes |
| "avoid duplication" | yes |
| "refactor before patching" | yes |
| new shared component/API/state module | yes |
| isolated typo/copy fix | no |
| disposable prototype | no, unless user asks |

Workflow:

```text
1. Classify architectural risk.
2. Identify the relevant architecture surface.
3. Perform minimum sufficient discovery.
4. Choose reuse, extension, refactor, local implementation, or new abstraction.
5. Implement the smallest repository-consistent change.
6. Verify correctness.
7. Run targeted architecture audit.
8. Report any deliberate deviation or new source of truth.
```

Decision hierarchy:

```text
1. Preserve correctness and safety.
2. Preserve existing source of truth.
3. Reuse existing abstraction directly when it fits.
4. Extend existing abstraction when the concept is the same.
5. Refactor shared code when repeated patches reveal the wrong boundary.
6. Add local implementation when the need is isolated.
7. Add new abstraction only when the repository lacks the concept and reuse/extension would distort existing abstractions.
```

Guardrails:

- Search before creating exported/shared code.
- Do not create a second source of truth without ownership and sync rationale.
- Do not hardcode tokenized design values.
- Do not create parallel state for data already owned by a store/cache/server source.
- Do not fork component behavior for styling-only differences.
- Do not patch repeated symptoms when one shared cause exists.
- New abstractions require a one-sentence justification.

Verification stages:

| Stage | Check |
|---|---|
| Correctness | tests/build/typecheck or smallest runnable equivalent |
| Reuse | no obvious existing abstraction missed |
| Tokens/theme | no new raw style values where tokens exist |
| API/state | follows existing ownership and contract patterns |
| Duplication | no high-risk duplicated business/UI/API logic |
| Blast radius | changed shared consumers inspected when necessary |

Failure recovery:

| Failure | Recovery |
|---|---|
| existing abstraction almost fits | extend or add variant if semantics match |
| existing abstraction is wrong boundary | small refactor before feature patch |
| token missing | use nearest semantic token or mark missing token gap |
| API convention conflict | follow closest owning module and name deviation |
| shared change breaks consumers | narrow change or introduce compatible variant |
| discovery inconclusive | choose local implementation and document why it should not become precedent |

Resource loading strategy:

| Resource | Load When |
|---|---|
| `frontend-governance.md` | UI, component, token, theme, layout work |
| `api-governance.md` | endpoint, client, DTO, schema, error handling work |
| `state-governance.md` | cache/store/server-state/client-state work |
| `discovery-patterns.md` | repo is unfamiliar or architecture surface is unclear |
| scanner scripts | deterministic post-change audit is possible |

The skill should keep `SKILL.md` short and put framework-specific discovery examples in references. A React design-system repository, a Rails monolith, and a service-oriented backend need different searches, but the governance decision hierarchy is the same.

The central design principle is:

```text
Do not optimize for the easiest patch. Optimize for the fewest future places that must change.
```

Architectural governance is the natural complement to minimalism. Minimalism prevents unnecessary code. Governance prevents unnecessary architectural choices. Together, they keep agents from solving today's request by creating tomorrow's maintenance surface.

## Anti-Patterns

| Anti-Pattern | Why It Fails |
|---|---|
| "Best practices" soup | model already knows it; wastes tokens |
| Over-broad description | triggers constantly |
| Hidden activation guidance in body | body is not loaded before activation |
| Huge monolithic `SKILL.md` | buries relevant instructions |
| Many equal options | model dithers |
| No "when not to use" | scope creep |
| Scripts without validation/errors | deterministic failure instead of deterministic success |
| Conflicting rules | unpredictable compliance |
| One skill for many unrelated domains | poor routing |
| No security/provenance boundary | supply-chain risk |

## Reusable Template

```markdown
---
name: <hyphen-case-name>
description: <Use this skill when... Include concrete trigger intents and exclusions.>
---

# <Skill Name>

## Purpose
<One sentence: what outcome this skill optimizes.>

## Use
<Activation assumptions already in description; here state task scope briefly.>

## Workflow
1. <Discovery step>
2. <Decision step>
3. <Implementation/action step>
4. <Verification step>
5. <Completion/reporting step>

## Decision Rules
- <Priority rule 1>
- <Priority rule 2>
- <Conflict resolution rule>

## Guardrails
- Never <unsafe action>.
- Always <required check>.
- Ask only when <blocking condition>.

## Resources
- Read `references/<file>.md` when <specific condition>.
- Run `scripts/<script>` when <specific repeated operation>.
- Use `assets/<asset>` when <specific output need>.

## Verification
- <Smallest runnable check>
- <What to do if check fails>

## Output
<Final response format or artifact contract.>

## Anti-Patterns
- Do not <common bad behavior>.
- Do not <scope creep behavior>.
```

## Bottom Line

The best skills are small operational systems: precise trigger, compact workflow, explicit guardrails, and just enough resource loading. Ponytail works because it turns "be minimal" into an ordered decision procedure with safety exceptions. Caveman works because it narrows only communication, not technical behavior. The general lesson: encode the behavior the model would otherwise get wrong, and delete the rest.
