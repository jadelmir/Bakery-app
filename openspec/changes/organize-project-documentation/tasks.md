# Task Ledger: Organize Project Documentation

## 1. Inventory and Reference Audit

- [ ] 1.1 Inventory repository-root Markdown and top-level `docs/*.md` files,
  recording each document's current responsibility, currentness, and proposed
  canonical owner/category.
- [ ] 1.2 Search current non-archive repository content for references to
  `Bakery_App_Technical_Requirements.md`,
  `Bakery_App_UI_UX_Requirements_Figma_Brief.md`,
  `Bakery_Production_and_Cost_App_PRD_v1.1.md`, and every existing docs file
  selected for movement.
- [ ] 1.3 Audit `docs/API_REQUIREMENTS.md` versus `docs/api/api.md` and audit
  `docs/ARCHITECTURE.md` / `docs/BACKEND_REQUIREMENTS.md` versus the root
  technical requirements; identify canonical responsibilities without deleting
  or merging content yet.

## 2. Source-of-Truth Cleanup

- [ ] 2.1 Remove or rewrite stale lifecycle language in durable technical docs
  that names an old active OpenSpec change, task owner, completion state, or
  archive readiness.
- [ ] 2.2 Ensure durable docs clearly defer planned requirements, tasks,
  progress, changes, and archives to OpenSpec while retaining reusable
  current-system/product reference only.
- [ ] 2.3 Preserve historical OpenSpec archives byte-for-byte; do not rewrite
  archived paths or historical source-of-truth wording as part of this change.

## 3. Canonical Documentation Placement

- [ ] 3.1 Create only the categorized docs directories actually required by
  verified moves, including `docs/product/`, `docs/architecture/`, and
  `docs/database/` when applicable.
- [ ] 3.2 Move the PRD and UI/UX brief into `docs/product/` after the reference
  audit confirms their durable product-reference role.
- [ ] 3.3 Move the technical requirements into `docs/architecture/` after stale
  lifecycle/source-of-truth content is removed and its remaining content is
  confirmed to be reusable technical reference.
- [ ] 3.4 Verify `docs/DATABASE_SCHEMA.md` against current implemented migration
  evidence, correct only stale reference assertions, and move the canonical
  database reference into `docs/database/`.
- [ ] 3.5 Move any additional clearly categorized top-level docs only when the
  responsibility audit proves a single safe canonical destination; leave
  governance/navigation docs at `docs/` root when appropriate.

## 4. Reference and Navigation Repair

- [ ] 4.1 Update `openspec/config.yaml` so the product-roadmap context points to
  the PRD's new canonical path if the PRD is moved.
- [ ] 4.2 Update current non-archive Markdown references and agent/documentation
  pointers to moved canonical files; do not modify archived OpenSpec changes.
- [ ] 4.3 Update `docs/PROJECT_MAP.md` only for navigationally meaningful path
  changes introduced by this reorganization.
- [ ] 4.4 Confirm no duplicate compatibility copies or `*-old` / `*-new` /
  `*-final` documents were created.

## 5. Verification

- [ ] 5.1 Run `orch doctor` and confirm the database-reference warning is
  resolved when the categorized database reference exists.
- [ ] 5.2 Run `orch organize` and verify no high-confidence safe-move violations
  remain from the files handled by this change.
- [ ] 5.3 Run a repository reference/link search for every moved path and prove
  current non-archive references resolve to the new canonical locations.
- [ ] 5.4 Review `git diff --stat` and `git diff` to prove no application code,
  migration, API behavior, or unrelated product work changed.
- [ ] 5.5 Update this task ledger with focused verification evidence. Do not mark
  tasks complete without evidence.

## Open Questions / Stopping Rules

- Stop a move if the document mixes durable reference with unresolved product
  planning that cannot be cleanly separated without a product decision.
- Stop consolidation if two documents have materially different current
  responsibilities; prefer links and explicit ownership rather than lossy
  merging.
- Stop if moving the PRD would require rewriting archived OpenSpec artifacts;
  archives remain immutable and historical references may remain historical.
- Do not run broad application refactors or code-folder organization as part of
  this change.
