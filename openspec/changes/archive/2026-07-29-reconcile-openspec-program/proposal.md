## Why

The OpenSpec program no longer fully describes the repository's delivered state or the order in which remaining work should proceed. The archived `2026-07-29-assign-order-production-plan` change contains deltas that were not carried into the main specifications, task lifecycle vocabulary conflates persisted state with time-derived urgency, several main specs still describe authentication and workspace behavior as mock or wholly local after those boundaries were implemented, and the Supabase foundation purpose remains a placeholder. The product roadmaps also need one durable capability and dependency map so future changes can be proposed, verified, synchronized, and archived without losing traceability.

## What Changes

- Recover the two missing archived production-plan deltas through this new change while preserving the archived change byte-for-byte.
- Define production-task lifecycle as persisted workflow state and define due-now/overdue as derived scheduling urgency rather than stored lifecycle values.
- Replace mock/local-only wording only where repository evidence proves a persisted implementation has superseded it; retain local/prototype wording for bakery-domain behavior that is still local.
- Replace the placeholder purpose of `supabase-backend-foundation` with an accurate description of its migration, configuration, typed-client, and verification boundary.
- Add project context and artifact rules to `openspec/config.yaml` so later proposals consistently capture roadmap traceability, capability ownership, dependencies, non-goals, verification, sync, and archive readiness.
- Establish a durable roadmap capability/dependency map spanning the PRD frontend and backend phases, main specs, active changes, archived changes, implementation evidence, and unresolved gaps.
- Establish the program lifecycle `audit -> propose/update -> apply -> verify -> sync -> archive`, including gates that prevent premature task completion or archival.
- Reconcile the scope and task ledger of `add-multi-store-workspaces` as an explicit follow-on planning task, without implementing any missing feature behavior in this change.

## Capabilities

### New Capabilities

- `openspec-program-governance`: Maintains the roadmap capability/dependency map, planning-source precedence, lifecycle gates, archive-recovery policy, and active-change ledger integrity.
- `order-production-plan-assignment`: Restores the missing main-spec capability that associates one generated local production plan with its completed order.

### Modified Capabilities

- `production-task-generation`: Restores the missing order-plan traceability requirement and separates persisted lifecycle state from derived scheduling urgency.
- `supabase-backend-foundation`: Replaces its placeholder purpose and removes obsolete wording that treats authentication and all adapters as necessarily mock after later approved changes have superseded that boundary.
- `frontend-runtime-verification`: Describes verification of the current mixed persisted/local architecture instead of a blanket mock-data-only prototype.
- `frontend-prototype-alignment`: Requires scope messaging to distinguish persisted authentication/workspace behavior from bakery-domain workflows that remain local.

## Impact

- Affects OpenSpec main specs when this change is synchronized, `openspec/config.yaml`, the durable roadmap/program map selected during implementation, and the planning artifacts of the active `add-multi-store-workspaces` change.
- Does not alter application source, runtime behavior, database schema, migrations, generated database types, Supabase project state, or archived change contents.
- The active workspace change remains the owner of overlapping `frontend-authentication-shell` deltas; its follow-on ledger reconciliation must expand or correct those deltas rather than duplicating ownership here.

## Non-Goals

- No application feature implementation.
- No database or schema mutation.
- No hosted deployment or rollout.
- No rewriting, deleting, or normalizing archived change artifacts.
- No marking unverified active-change tasks complete.
- No replacing the existing frontend or backend product-phase roadmaps.
