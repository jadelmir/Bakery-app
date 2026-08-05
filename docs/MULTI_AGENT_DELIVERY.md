# Multi-Agent Delivery Guide

**Version:** 1.0  
**Applies to:** All Bakery App frontend and backend delivery phases  
**Planning system:** OpenSpec  
**Important:** This guide governs agents developing the repository. It does not
add AI-agent behavior to the Bakery App runtime.

## Package and project split

The orchestration system is intentionally separated into:

- `packages/multi-agent-delivery`: generic dependency-free ESM definitions that
  may later become an npm package.
- `orchestration/bakery-app.profile.mjs`: machine-readable Bakery defaults and
  phase identifiers.
- `AGENTS.md`: durable repository behavior and safety rules.
- This guide: Bakery-specific phase ownership and verification recommendations.

The reusable package must not import this project profile or contain Bakery
paths, phases, commands, or business terminology. Publication remains disabled
until package naming, licensing, semantic versioning, and its public API are
approved.

## 1. Core model

Each approved change has one orchestrator. The orchestrator may delegate
independent OpenSpec tasks to bounded sub-agents, then integrates and verifies
the combined result.

```text
User request
  -> Orchestrator selects or creates an OpenSpec change
  -> Proposal, design, specifications, and tasks become implementation-ready
  -> Orchestrator assigns non-overlapping workstreams
      -> Backend/database agent
      -> Frontend agent
      -> Test/security/review agent
  -> Orchestrator reviews the shared workspace
  -> Integrated verification
  -> OpenSpec sync and archive when complete
```

Product phases remain sequential where their dependencies require it.
Independent workstreams inside a phase may run in parallel.

## 2. How to request Sol or Terra

Tell the orchestrator the model choice in ordinary language. Examples:

```text
Use Sol for the orchestrator and the database/RLS agent. Use Terra for the
frontend and test agents.
```

```text
Spawn a Sol agent with high reasoning for the migration and security review.
Spawn a Terra agent with medium reasoning for the customer forms.
```

```text
Use Terra for every bounded task, but let the orchestrator escalate a task to
Sol if it finds a security or architecture risk.
```

```text
Use Sol for this entire phase because authentication and tenant isolation are
high risk.
```

When the agent-spawning interface accepts explicit configuration, the
orchestrator selects:

```text
model: gpt-5.6-sol
reasoning_effort: high
```

or:

```text
model: gpt-5.6-terra
reasoning_effort: medium
```

Model overrides are set when the agent is spawned. A running sub-agent is not
silently switched to a different model; create a new assignment or explicitly
restart the work when a different model is required.

The system supports model options across **OpenAI**, **Gemini**, and **Claude** providers:
- **OpenAI**: `gpt-5.6-sol` (Frontier reasoning) / `gpt-5.6-terra` (Balanced implementation)
- **Gemini**: `gemini-3.6-flash` (High reasoning effort) / `gemini-3.6-flash` (Medium reasoning effort)
- **Claude**: `claude-3.7-sonnet` (High reasoning / refactoring) / `claude-3.5-haiku` (Fast bounded execution)

## 3. Model-selection policy

| Work type | OpenAI Default | Gemini Equivalent | Claude Equivalent | Reasoning | Why |
|---|---|---|---|---|---|
| Orchestrating a large cross-layer change | Sol (`gpt-5.6-sol`) | `gemini-3.6-flash` (High) | `claude-3.7-sonnet` | High | Requires integration and trade-off judgment |
| OpenSpec proposal/design for complex behavior | Sol (`gpt-5.6-sol`) | `gemini-3.6-flash` (High) | `claude-3.7-sonnet` | High | Decisions affect multiple downstream lanes |
| Auth, RLS, security, sensitive migration | Sol (`gpt-5.6-sol`) | `gemini-3.6-flash` (High) | `claude-3.7-sonnet` | High | High cost of subtle failure |
| Scheduling, payments, inventory invariants | Sol (`gpt-5.6-sol`) | `gemini-3.6-flash` (High) | `claude-3.7-sonnet` | High | Transactional and historical correctness |
| Difficult cross-layer debugging | Sol (`gpt-5.6-sol`) | `gemini-3.6-flash` (High) | `claude-3.7-sonnet` | High | Needs broad causal reasoning |
| Routine React feature with a clear spec | Terra (`gpt-5.6-terra`) | `gemini-3.6-flash` (Med) | `claude-3.5-haiku` | Medium | Bounded implementation |
| CRUD adapter or focused service | Terra (`gpt-5.6-terra`) | `gemini-3.6-flash` (Med) | `claude-3.5-haiku` | Medium | Clear data contract and limited surface |
| Unit, component, or E2E tests | Terra (`gpt-5.6-terra`) | `gemini-3.6-flash` (Med) | `claude-3.5-haiku` | Medium | Well-defined expected behavior |
| Documentation and requirement tracing | Terra (`gpt-5.6-terra`) | `gemini-3.6-flash` (Med) | `claude-3.5-haiku` | Medium | Structured bounded work |
| Read-only repository investigation | Terra (`gpt-5.6-terra`) | `gemini-3.6-flash` (Med) | `claude-3.5-haiku` | Medium | Efficient context gathering |

Start with the lowest model/effort appropriate to the risk. Escalate based on a
specific quality problem, not simply because a high-reasoning model is available.

## 4. Agent assignment contract

Every spawned implementation agent receives an assignment containing:

```text
Change: <OpenSpec change name>
Tasks: <exact task IDs>
Read first:
  - proposal.md
  - design.md
  - relevant specs
  - tasks.md
Deliverable: <concrete result>
Writable ownership: <exclusive files/directories>
Do not change: <shared or out-of-scope areas>
Verification: <focused commands and acceptance checks>
Stop when:
  - scope/design must change
  - an owned file overlaps another agent
  - destructive/external authority is required
Report:
  - files changed
  - tests and results
  - assumptions and remaining concerns
```

Vague assignments such as “handle the backend” are insufficient.

## 5. Standard phase lifecycle

### Gate A — Plan

- Select or create one OpenSpec change for the deliverable.
- Resolve material requirements and architecture decisions.
- Ensure tasks have acceptance criteria and dependency order.
- Decide whether multi-agent execution offers a real benefit.

### Gate B — Partition

- Divide work into independently testable lanes.
- Assign exclusive writable files.
- Select Sol or Terra for each lane.
- Keep the highest-conflict shared files with the orchestrator.

### Gate C — Implement

- Each agent reads its OpenSpec context and current files.
- Each agent implements only its bounded assignment.
- Each agent runs focused verification and reports evidence.
- Design or scope problems return to the orchestrator.

### Gate D — Integrate

- The orchestrator inspects every changed file.
- Shared types, routes, schemas, adapters, and generated files are reconciled.
- Cross-workstream assumptions are checked.
- Relevant OpenSpec tasks are marked complete.

### Gate E — Verify and close

- Run whole-project type checking, lint, tests, and build.
- Run applicable browser, migration, RLS, advisor, security, and deployment
  checks.
- Confirm the original phase completion gate.
- Synchronize specs and archive only when no required work remains.

## 6. When not to spawn agents

Use one agent when:

- The change is small or localized.
- The next step depends on the exact output of the previous step.
- Most work touches the same central file.
- There is not enough work to justify coordination overhead.
- Requirements are still too uncertain to make bounded assignments.
- A destructive or external action requires direct user approval.

A read-only review agent can still be useful after implementation, provided it
does not edit files owned by the implementation agent.

## 7. Frontend phase workstreams

| Existing phase | Orchestrator focus | Recommended parallel lane(s) | Verification lane |
|---|---|---|---|
| Frontend 1 — Shared Application Foundation | Shared architecture, router/data boundaries | Terra: navigation and state adapters; Terra: reliability UI states when files do not overlap | Terra: cross-screen state and routing tests |
| Frontend 2 — Authentication and Account Experience | Auth contract and security boundary, preferably Sol | Terra: account forms/routes; Terra: session-state UI | Sol: auth/session/security review |
| Frontend 3 — Ingredients and Stock Entry | Data contract and validation | Terra: forms/adapters; Terra: stock history UI | Terra: costing and form tests |
| Frontend 4 — Recipe Management | Recipe/costing contract | Terra: recipe editor; Terra: list/archive flows | Terra: calculations and CRUD journeys |
| Frontend 5 — Customer Management | Customer validation and order integration | Terra: directory/editor; Terra: inline order customer flow | Terra: duplicate and snapshot UI tests |
| Frontend 6 — Orders and Payments | Order lifecycle and money invariants, preferably Sol | Terra: order editor; Terra: payment/refund UI | Sol: lifecycle and historical-integrity review |
| Frontend 7 — Production Flow Builder | Scheduling/dependency model, preferably Sol | Terra: builder interactions; Terra: assignment UI | Terra/Sol: graph validation and journey tests |
| Frontend 8 — Production Task Workspace | Task lifecycle and regeneration contract, preferably Sol | Terra: schedule views; Terra: task actions | Sol: dependency/regeneration review |
| Frontend 9 — Starter and Inventory Planning | Calculation and deduction invariants, preferably Sol | Terra: starter UI; Terra: inventory UI | Sol: double-count/deduction review |
| Frontend 10 — Dashboard and Notifications | Shared query and notification model | Terra: dashboard; Terra: notification interactions | Terra: cross-feature update tests |
| Frontend 11 — Finances and Invoices | Financial/invoice contract, preferably Sol | Terra: reports; Terra: invoice experience | Sol: snapshot, totals, and delivery-state review |
| Frontend 12 — Settings, Reliability, and Release | Release integration and risk triage, preferably Sol | Terra: settings; Terra: accessibility/responsive fixes | Sol: final release review; Terra: E2E suite |

## 8. Backend phase workstreams

| Existing phase | Orchestrator focus | Recommended parallel lane(s) | Verification lane |
|---|---|---|---|
| Backend 1 — Backend Foundation | Environment and migration contract | Terra: tooling/docs; one owner for generated types | Sol/Terra: local/hosted history and secret audit |
| Backend 2 — Authentication and Bakery Workspaces | Auth, membership, and tenant model, preferably Sol | Sol: schema/RLS; Terra: auth adapter if files are separate | Sol: cross-bakery denial and session tests |
| Backend 3 — Ingredients and Costing | Units, ledger, and costing contract | Terra: schema/CRUD; Terra: calculation tests | Sol/Terra: numeric and RLS review |
| Backend 4 — Recipes and Production Flows | Dependency graph and seed design, preferably Sol | Terra: recipe schema; Terra: flow/seed data | Sol: constraint and scheduling-model review |
| Backend 5 — Customers and Orders | Lifecycle, snapshots, and tenant rules, preferably Sol | Terra: customer domain; Sol/Terra: order schema/functions | Sol: transactional and RLS tests |
| Backend 6 — Payments, Invoices, and Historical Snapshots | Money, numbering, immutability, preferably Sol | Sol: transactional schema/RPCs; Terra: delivery records/types | Sol: financial and historical-integrity tests |
| Backend 7 — Production Scheduling Engine | Scheduling algorithm and transaction boundary, Sol | Terra: fixtures/tests; Sol: engine implementation | Independent Sol review on chronology/idempotency |
| Backend 8 — Task Lifecycle and Regeneration | State machine and preservation rules, Sol | Terra: task query/API layer; Sol: regeneration operation | Sol: retry, duplication, and history tests |
| Backend 9 — Starter Planning | Calculation/grouping invariants, preferably Sol | Terra: schema and fixtures; Sol/Terra: pure calculations | Sol: compatibility and rounding review |
| Backend 10 — Inventory Requirements | Ledger and exactly-once deduction, Sol | Terra: requirements queries; Sol: transactional deduction | Sol: concurrency/idempotency tests |
| Backend 11 — Reporting, Invoice Delivery, and Notifications | External secrets and reporting correctness, Sol | Terra: reporting/exports; Sol: Edge Functions; Terra: notifications | Sol: delivery/security/totals review |
| Backend 12 — Security, Testing, and Release | Overall release authority, Sol | Terra: test expansion/docs; read-only specialist audits | Sol: final RLS, migration, advisor, and release gate |

## 9. Example phase assignment

For Backend Phase 2:

```text
Orchestrator — Sol/high
  Owns the OpenSpec change, tenant architecture, shared generated types,
  integration, and final verification.

Database/RLS agent — Sol/high
  Owns the auth profile, bakery, membership migrations and RLS policy tests.

Frontend auth agent — Terra/medium
  Owns the Supabase auth adapter and authentication routes/components.

QA agent — Terra/high or Sol/high
  Starts read-only, then owns only dedicated integration/security test files.
```

If the database contract is not settled, do not start the frontend persistence
agent yet. Parallelism begins only after the shared contract is stable.

## 10. Completion report

The orchestrator's handoff should state:

- OpenSpec change and completed task IDs.
- Agents/models used and their workstream ownership.
- Files or systems changed.
- Focused and integrated verification results.
- Security, migration, or deployment evidence.
- Remaining decisions or explicitly deferred work.
- Whether the change is ready to synchronize and archive.
