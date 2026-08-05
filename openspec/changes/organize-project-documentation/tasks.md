# Task Ledger: Organize Project Documentation and Retire Legacy Orchestration

## 1. Inventory and Reference Audit

- [x] 1.1 Inventory repository-root Markdown and top-level `docs/*.md` files, recording each document's current responsibility, currentness, and proposed canonical owner/category.
- [x] 1.2 Audit current repository instructions/config/navigation references for the three root Bakery documents and the durable docs selected for movement.
- [x] 1.3 Audit `docs/API_REQUIREMENTS.md` versus `docs/api/api.md` and `docs/ARCHITECTURE.md` / `docs/BACKEND_REQUIREMENTS.md` versus the root technical requirements. The old API/backend/technical requirement documents mixed planned/stale state with current reference, so they were removed from live docs and preserved as historical input under this change's `reference/` folder.

## 2. Retire Previous Orchestration Implementation

- [x] 2.1 Inventory every file under `orchestration/` and `packages/multi-agent-delivery/`, plus `docs/MULTI_AGENT_DELIVERY.md`.
- [x] 2.2 Audit current `AGENTS.md`, repository navigation/configuration, durable docs, and the legacy Bakery profile for references to the superseded framework.
- [x] 2.3 Confirm no root package/workspace manifest wires `packages/multi-agent-delivery` into the application build. The legacy profile imports the package, but the application/runtime tree does not.
- [x] 2.4 Delete `orchestration/bakery-app.profile.mjs`; the empty `orchestration/` directory is no longer present in Git.
- [x] 2.5 Delete the complete `packages/multi-agent-delivery/` package. No other tracked package exists under that old top-level responsibility.
- [x] 2.6 Remove `docs/MULTI_AGENT_DELIVERY.md`. Current durable agent guidance now points to ORCH/OpenSpec instead of preserving the superseded Sol/Terra delivery system.
- [x] 2.7 Rewrite current root instructions/navigation so `.orch/`, `.agents/`, and `.codex/` are the active ORCH integration and the retired framework must not be recreated.

## 3. Source-of-Truth Cleanup

- [x] 3.1 Remove stale active-change/task-owner/archive-readiness wording from current durable technical documentation by retiring the old mixed technical requirements document from live docs.
- [x] 3.2 Ensure current durable docs defer requirements, plans, tasks, progress, changes, and archives to OpenSpec. Create a concise current technical reference under `docs/architecture/`.
- [x] 3.3 Preserve historical OpenSpec archives untouched. Legacy source documents needed for this migration are preserved under this active change's `reference/` directory and explicitly marked non-authoritative.

## 4. Canonical Documentation Placement

- [x] 4.1 Add only categories required by verified moves: `docs/product/`, `docs/architecture/`, `docs/database/`, and `docs/deployment/`.
- [x] 4.2 Move the PRD and UI/UX brief to `docs/product/` without changing their bytes.
- [x] 4.3 Replace the stale root technical-requirements document with `docs/architecture/technical-requirements.md`; preserve the superseded source verbatim under this change's `reference/` folder.
- [x] 4.4 Replace the mixed implemented/planned database document with `docs/database/database-schema.md`, limited to implemented migration-backed reference and explicit OpenSpec precedence for proposed schema.
- [x] 4.5 Move the clearly categorized architecture and deployment references into `docs/architecture/` and `docs/deployment/`. Keep repository-wide governance/navigation docs directly under `docs/`.

## 5. Reference and Navigation Repair

- [x] 5.1 Update `openspec/config.yaml` so product-roadmap context points to `docs/product/bakery-production-and-cost-app-prd-v1-1.md` and replaces old multi-agent-delivery wording with ORCH delegation guidance.
- [x] 5.2 Update current root instructions, README, project map, organization guidance, and token-efficiency guidance to the new canonical paths.
- [x] 5.3 Update `docs/PROJECT_MAP.md` for the documentation layout and removal of the legacy orchestration/package locations.
- [x] 5.4 Confirm no duplicate compatibility copies were created. Legacy inputs are preserved only as explicitly non-authoritative OpenSpec change evidence.

## 6. Verification

- [x] 6.1 GitHub contents checks confirm `orchestration/` and `packages/multi-agent-delivery/` return not found on this branch, while `.orch/`, `.agents/`, and `.codex/` remain present.
- [ ] 6.2 Run a local repository text search for legacy orchestration paths/model-policy terms to supplement the static reference audit; GitHub code search is not indexed for this repository, so an exhaustive connector search is unavailable.
- [ ] 6.3 Run `orch doctor` locally and confirm the database-reference warning is resolved by `docs/database/database-schema.md`.
- [ ] 6.4 Run `orch organize` locally and verify no high-confidence safe-move violations remain from the files handled by this change.
- [ ] 6.5 Run a local link/reference search for moved paths and verify current non-archive references resolve. Known canonical instructions/config/navigation references were repaired in the implementation commit.
- [ ] 6.6 Run the normal local verification baseline needed for delivery (`pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run build` from `Front-end/`). No `Front-end/` file changed in the GitHub diff, but command execution is still required before archive/merge.
- [x] 6.7 GitHub compare against `main` confirms the implementation changes only repository instructions/docs/OpenSpec governance plus deletion of the standalone legacy orchestration framework; no `Front-end/` application, migration, API implementation, or product runtime file changed.
- [x] 6.8 Record the static verification evidence and leave local-command gates unchecked rather than fabricating results.

## Static Verification Evidence

- Legacy orchestration package inventory contained README/package metadata, five source modules, type declarations, and its package test; all are removed in the implementation diff.
- `orchestration/bakery-app.profile.mjs` and `docs/MULTI_AGENT_DELIVERY.md` are removed.
- `.orch/config.json`, `.agents/`, and `.codex/` are present on the execution branch after deletion.
- Product and UI/UX docs are Git-level renames with zero content changes.
- Architecture and deployment docs are Git-level renames with zero content changes.
- The old root technical/API/backend requirement documents are retained only under `openspec/changes/organize-project-documentation/reference/`, whose README marks them historical/non-authoritative.
- Compare against `main` shows no files under `Front-end/` changed.

## Open Questions / Stopping Rules

- Do not archive or merge until local command gates 6.2–6.6 are completed and any failures are resolved.
- If local search finds a live caller of the removed legacy package, stop and restore/replace that dependency through this OpenSpec change rather than bypassing it.
- Do not rewrite archived OpenSpec artifacts to modernize historical links or terminology.
- Do not broaden this change into application-code reorganization or product behavior changes.
