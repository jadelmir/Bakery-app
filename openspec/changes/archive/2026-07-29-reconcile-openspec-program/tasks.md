## 1. OpenSpec planning controls

- [x] 1.1 Add concise project context to `openspec/config.yaml` covering the PRD roadmaps, OpenSpec source-of-truth rule, mixed persisted/local architecture, archive immutability, product-phase preservation, and selective multi-agent delivery.
- [x] 1.2 Add proposal, design, specs, tasks, apply, sync, and archive rules that require capability/dependency traceability, explicit non-goals, non-overlapping ownership, acceptance evidence, task-to-requirement mapping, verification gates, and archive readiness.
- [x] 1.3 Validate the updated configuration with the installed OpenSpec CLI, or record the unavailable command and preserve valid YAML manually.

## 2. Durable roadmap and lifecycle map

- [x] 2.1 Create one version-controlled capability/dependency map covering every PRD frontend and backend phase, every main spec, active changes, relevant archives, implementation evidence, and explicit unmapped gaps.
- [x] 2.2 Record directional prerequisites, owning change, program state, completion gate, verification evidence, next action, and sync/archive readiness for every map entry.
- [x] 2.3 Document and apply the lifecycle `audit -> propose/update -> apply -> verify -> sync -> archive`, including the return path when a gate fails.
- [x] 2.4 Cross-check the map against all main-spec headings and both PRD roadmaps so phases remain product milestones rather than agent-execution phases.

## 3. Archived delta recovery

- [x] 3.1 Compare this change's `order-production-plan-assignment` delta with the archived `2026-07-29-assign-order-production-plan` source and preserve its completed-order, traceability, and duplicate-prevention intent.
- [x] 3.2 Compare the added `production-task-generation` association requirement with the archived source and confirm it is absent from the current main spec before synchronization.
- [x] 3.3 Record the archive as immutable provenance in the capability map; do not edit, move, regenerate, or normalize archived files.

## 4. Canonical lifecycle and wording reconciliation

- [x] 4.1 Update production-task specifications so only Pending, In Progress, Completed, Skipped, and Cancelled are persisted lifecycle states.
- [x] 4.2 Define Due Soon, Due Now, and Overdue as derived scheduling urgency, including bakery-timezone calculation, lifecycle coexistence, terminal-task behavior, and display expectations.
- [x] 4.3 Replace the `supabase-backend-foundation` placeholder purpose and update its obsolete mock-adapter completion wording without expanding the foundation's schema scope.
- [x] 4.4 Update frontend runtime/prototype wording to describe the verified mixed persistence boundary, retaining explicit local/prototype language for bakery-domain behavior that is not persisted.
- [x] 4.5 Run a repository-wide main-spec terminology check for contradictory mock/local, persisted, task-state, and urgency claims; change only claims supported by implementation evidence.

## 5. Verification and synchronization readiness

- [x] 5.1 Validate all change artifacts and delta scenarios with the OpenSpec CLI when available.
- [x] 5.2 Verify every delta has at least one testable scenario, no application or database mutation is included, and no active change has conflicting delta ownership.
- [x] 5.3 Review the rendered main-spec result before synchronization, then update the roadmap map to reflect verified and synced states.
- [x] 5.4 Keep this change unarchived until configuration, map, deltas, verification evidence, and main-spec synchronization agree.

## 6. Follow-on: reconcile `add-multi-store-workspaces`

- [x] 6.1 Audit the active change's proposal, design, delta specs, task checkboxes, current implementation, tests, documentation, and hosted state; record mismatches without implementing missing feature code.
- [x] 6.2 Update that change's planning artifacts so authentication-shell scope, persisted/local boundaries, outstanding accessibility/browser/documentation work, verification requirements, and hosted rollout are coherent.
- [x] 6.3 Reopen any checked task whose acceptance criteria lack evidence, preserve incomplete tasks as unchecked, and separate local implementation completion from hosted rollout completion.
- [x] 6.4 Validate the active change and update its capability-map entries; defer synchronization and archive until its own required work is verified and no product decision remains.

