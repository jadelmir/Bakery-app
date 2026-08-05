# Task Ledger: Organize Project Documentation and Retire Legacy Orchestration

## 1. Inventory and Reference Audit

- [ ] 1.1 Inventory repository-root Markdown and top-level `docs/*.md` files, recording each document's current responsibility, currentness, and proposed canonical owner/category.
- [ ] 1.2 Search current non-archive repository content for references to `Bakery_App_Technical_Requirements.md`, `Bakery_App_UI_UX_Requirements_Figma_Brief.md`, `Bakery_Production_and_Cost_App_PRD_v1.1.md`, and every existing docs file selected for movement.
- [ ] 1.3 Audit `docs/API_REQUIREMENTS.md` versus `docs/api/api.md` and audit `docs/ARCHITECTURE.md` / `docs/BACKEND_REQUIREMENTS.md` versus the root technical requirements; identify canonical responsibilities without deleting or merging content yet.

## 2. Retire Previous Orchestration Implementation

- [ ] 2.1 Inventory every file under `orchestration/` and `packages/multi-agent-delivery/`, plus `docs/MULTI_AGENT_DELIVERY.md`, and record whether each item belongs solely to the superseded Bakery-specific orchestration system.
- [ ] 2.2 Search current non-archive code, `AGENTS.md`, package/workspace configuration, scripts, durable docs, and active OpenSpec changes for references to `orchestration/`, `bakery-app.profile.mjs`, `packages/multi-agent-delivery`, `MODEL_POLICY`, Sol/Terra model-routing policy, or the old multi-agent delivery workflow.
- [ ] 2.3 Prove whether any current application/runtime/build path depends on the legacy orchestration package. Stop and report a blocker if a live dependency exists rather than deleting blindly.
- [ ] 2.4 When no live dependency remains, delete `orchestration/bakery-app.profile.mjs` and remove the now-empty top-level `orchestration/` directory.
- [ ] 2.5 Delete the complete `packages/multi-agent-delivery/` package when confirmed superseded and unused. Remove the top-level `packages/` directory too if it becomes empty and has no other repository responsibility.
- [ ] 2.6 Remove `docs/MULTI_AGENT_DELIVERY.md` if it only documents the retired implementation. If it contains still-valid general guidance, migrate only the non-duplicative durable guidance into an existing canonical agent/ORCH document before deletion.
- [ ] 2.7 Remove or rewrite stale current references to the legacy orchestrator so `.orch/`, `.agents/`, and `.codex/` are the only active orchestration integration. Do not rewrite archived OpenSpec history.

## 3. Source-of-Truth Cleanup

- [ ] 3.1 Remove or rewrite stale lifecycle language in durable technical docs that names an old active OpenSpec change, task owner, completion state, or archive readiness.
- [ ] 3.2 Ensure durable docs clearly defer planned requirements, tasks, progress, changes, and archives to OpenSpec while retaining reusable current-system/product reference only.
- [ ] 3.3 Preserve historical OpenSpec archives byte-for-byte; do not rewrite archived paths or historical source-of-truth wording as part of this change.

## 4. Canonical Documentation Placement

- [ ] 4.1 Create only the categorized docs directories actually required by verified moves, including `docs/product/`, `docs/architecture/`, and `docs/database/` when applicable.
- [ ] 4.2 Move the PRD and UI/UX brief into `docs/product/` after the reference audit confirms their durable product-reference role.
- [ ] 4.3 Move the technical requirements into `docs/architecture/` after stale lifecycle/source-of-truth content is removed and its remaining content is confirmed to be reusable technical reference.
- [ ] 4.4 Verify `docs/DATABASE_SCHEMA.md` against current implemented migration evidence, correct only stale reference assertions, and move the canonical database reference into `docs/database/`.
- [ ] 4.5 Move any additional clearly categorized top-level docs only when the responsibility audit proves a single safe canonical destination; leave governance/navigation docs at `docs/` root when appropriate.

## 5. Reference and Navigation Repair

- [ ] 5.1 Update `openspec/config.yaml` so the product-roadmap context points to the PRD's new canonical path if the PRD is moved.
- [ ] 5.2 Update current non-archive Markdown references and agent/documentation pointers to moved canonical files; do not modify archived OpenSpec changes.
- [ ] 5.3 Update `docs/PROJECT_MAP.md` for meaningful documentation path changes and removal of the legacy orchestration/package locations.
- [ ] 5.4 Confirm no duplicate compatibility copies or `*-old` / `*-new` / `*-final` documents were created.

## 6. Verification

- [ ] 6.1 Prove `orchestration/` and `packages/multi-agent-delivery/` are absent after retirement, while `.orch/`, `.agents/`, and `.codex/` remain present.
- [ ] 6.2 Search current non-archive content for legacy orchestration paths/model-policy terms and confirm no active stale references remain.
- [ ] 6.3 Run `orch doctor` and confirm the database-reference warning is resolved when the categorized database reference exists.
- [ ] 6.4 Run `orch organize` and verify no high-confidence safe-move violations remain from the files handled by this change.
- [ ] 6.5 Run a repository reference/link search for every moved path and prove current non-archive references resolve to the new canonical locations.
- [ ] 6.6 Run the repository's normal focused configuration/build/test validation needed to prove deletion of the legacy package did not break workspace/build behavior.
- [ ] 6.7 Review `git diff --stat` and `git diff` to prove no unrelated application behavior, migration, API behavior, or product work changed.
- [ ] 6.8 Update this task ledger with focused verification evidence. Do not mark tasks complete without evidence.

## Open Questions / Stopping Rules

- Stop legacy deletion if a current runtime/build/test caller still imports `packages/multi-agent-delivery`; report the caller and resolve ownership before continuing.
- Stop a document move if the document mixes durable reference with unresolved product planning that cannot be cleanly separated without a product decision.
- Stop consolidation if two documents have materially different current responsibilities; prefer links and explicit ownership rather than lossy merging.
- Stop if moving the PRD would require rewriting archived OpenSpec artifacts; archives remain immutable and historical references may remain historical.
- Do not run broad application refactors or code-folder organization as part of this change.
