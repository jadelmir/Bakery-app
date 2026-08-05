## Context

The PRD defines twelve frontend phases and twelve backend phases, while main OpenSpec capabilities represent only part of that roadmap. Main specs, active changes, archives, and implementation evidence have drifted in several ways:

- `2026-07-29-assign-order-production-plan` is archived, but its new `order-production-plan-assignment` capability and added `production-task-generation` requirement are absent from main specs.
- `production-task-generation` lists Overdue beside persisted workflow states even though `frontend-prototype-alignment` already treats overdue/due-now as urgency derived from time.
- `supabase-backend-foundation` still has a placeholder purpose and a completion scenario that freezes all authentication and adapters as mock, while the active workspace work has introduced persisted Supabase Auth and workspace boundaries.
- Some verification and prototype-alignment wording still describes the whole product as mock/local even though persistence is now mixed: authentication and workspace/team boundaries are Supabase-backed, while many bakery-domain records and generated plans remain local.
- `add-multi-store-workspaces` has many checked tasks but unfinished accessibility, browser, verification, documentation, and hosted-rollout tasks. Its proposal, deltas, evidence, and ledger need a dedicated coherence pass before sync or archive.

## Goals / Non-Goals

**Goals:**

- Restore missing main-spec intent without changing historical archives.
- Define one canonical persisted task lifecycle and a separate derived urgency model.
- Correct only demonstrably stale implementation wording.
- Give the Supabase foundation a durable purpose.
- Create a maintained capability/dependency map that connects roadmaps, specs, changes, evidence, and gaps.
- Make OpenSpec configuration and lifecycle gates explicit enough for repeatable future planning.
- Reconcile the active workspace change's scope and ledger as planning work after this program baseline is established.

**Non-Goals:**

- Implementing application features or completing unfinished workspace UI behavior.
- Creating or changing tables, policies, migrations, seed data, generated types, or Edge Functions.
- Applying anything to a hosted environment.
- Editing archived changes.
- Treating checked task boxes as proof without verification evidence.
- Collapsing product phases into an agent-execution roadmap.

## Decisions

### 1. Recover archived deltas through a new corrective change

The missing `order-production-plan-assignment` capability and `production-task-generation` requirement are restated as deltas in this change. The archived source remains immutable and is cited as provenance in the roadmap map.

Editing the archive would erase historical fidelity and make later audits unable to distinguish the original archive from the correction.

### 2. Separate persisted task lifecycle from derived urgency

The canonical persisted task lifecycle is:

- `Pending`
- `In Progress`
- `Completed`
- `Skipped`
- `Cancelled`

`Due Soon`, `Due Now`, and `Overdue` are derived urgency labels calculated from the task's scheduled timestamp, bakery timezone, current time, and terminal/non-terminal state. Urgency does not replace or mutate lifecycle state. A task can therefore be both `Pending` and `Overdue`; terminal tasks do not remain actionable merely because their scheduled time has passed.

This preserves workflow history, supports deterministic recalculation, and avoids contradictory status transitions caused only by clock time.

### 3. Use evidence-scoped wording corrections

Wording changes must cite current repository evidence and use the narrowest accurate boundary:

- Supabase Auth, bakery workspaces, memberships, invitations, and tenant policies may be described as persisted where implemented and verified.
- Local browser fixtures, bakery-domain collections, generated plans, production calculations, and other not-yet-persisted features remain explicitly local/prototype behavior.
- Test-only mock adapters remain valid verification infrastructure and are not described as the production runtime.

The implementation audit must reject blanket claims such as "mock-data-only" or "fully persisted" when the architecture is mixed.

### 4. Keep overlapping authentication-shell ownership in the active workspace change

`add-multi-store-workspaces` already modifies `frontend-authentication-shell`. To avoid competing active deltas, its follow-on ledger reconciliation owns updates to the authentication purpose, request-success behavior, session restoration, logout, and bakery-selection boundary. This program change corrects adjacent main capabilities but does not duplicate that active capability delta.

The workspace change may be synchronized or archived only after its artifact scope, task checkboxes, implementation evidence, outstanding product decisions, local verification, and hosted-rollout state agree.

### 5. Maintain one durable roadmap capability/dependency map

The map is a version-controlled planning artifact with one row per capability or explicit roadmap gap. Each entry records:

- PRD source and frontend/backend phase;
- OpenSpec capability and main-spec path, or `unmapped`;
- upstream capability dependencies and completion gates;
- owning active change, relevant archive provenance, and current program state;
- implementation and verification evidence;
- next planning action and archive/sync readiness.

Allowed program states are `unmapped`, `proposed`, `active`, `implemented-unverified`, `verified`, `synced`, `archived`, and `blocked`. These states describe program delivery, not application task status.

Dependencies are directional. The map must make foundation and workspace prerequisites explicit without replacing the PRD phase roadmaps.

### 6. Encode planning guidance in OpenSpec configuration

Implementation adds concise project context and per-artifact rules to `openspec/config.yaml`. Context identifies the PRD as the product roadmap, OpenSpec as planned-work source of truth, the mixed persistence boundary, archive immutability, and selective multi-agent rules. Artifact rules require capability/dependency traceability, explicit non-goals, ownership of overlapping deltas, measurable verification, task-to-requirement mapping, sync readiness, and archive gates.

Configuration must guide artifact generation without embedding Bakery-specific assumptions in `packages/multi-agent-delivery`.

### 7. Apply a gated program lifecycle

Every planned capability follows:

1. **Audit** current roadmaps, main specs, changes, archives, implementation, and evidence.
2. **Propose or update** exactly one owning change with coherent proposal, design, delta specs, and tasks.
3. **Apply** only approved tasks within declared ownership.
4. **Verify** acceptance criteria and risk-appropriate quality, migration, security, and product checks.
5. **Sync** verified deltas into main specs and confirm the roadmap map reflects the result.
6. **Archive** only when no required work remains and artifacts, task ledger, main specs, and evidence agree.

A failed gate returns the change to propose/update or apply; it does not skip forward.

## Risks / Trade-offs

- [Corrective deltas diverge from their archived source] -> Compare each recovered requirement against the archived artifact and record only intentional present-day terminology changes.
- [Two active changes claim the authentication shell] -> Keep authentication-shell corrections in `add-multi-store-workspaces` and record that ownership in the map.
- [The capability map becomes another stale roadmap] -> Require map updates in proposal, verification, sync, and archive checklists.
- [Persisted/local wording overstates implementation] -> Require file-level evidence and preserve local wording whenever evidence is incomplete.
- [Task urgency varies by timezone or clock] -> Define urgency as a derived view using bakery timezone and explicit testable thresholds; never persist it as lifecycle state.
- [Checked workspace tasks conceal incomplete acceptance criteria] -> Reconcile each checkbox against tests, runtime evidence, documentation, and remaining subtasks before sync/archive.

## Migration Plan

1. Add OpenSpec project context and artifact rules.
2. Create the roadmap capability/dependency map from the PRD phases, all main capabilities, active changes, and archive provenance.
3. Apply the corrective deltas for missing archive content, task lifecycle/urgency, Supabase purpose, and evidence-scoped wording.
4. Validate main-spec coherence and lifecycle terminology.
5. Reconcile `add-multi-store-workspaces` artifacts and task ledger as a follow-on planning task; do not implement missing feature code.
6. Run OpenSpec validation when the CLI is available, then synchronize this change only after review.

Rollback before synchronization is a normal revert of planning files. After synchronization, corrections use a new reviewed OpenSpec change; archives are never rewritten.
