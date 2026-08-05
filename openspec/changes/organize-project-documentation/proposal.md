# Proposal: Organize Project Documentation and Retire Legacy Orchestration

## Executive Summary

Organize the Bakery app's durable reference documentation so repository-root Markdown is limited to true entry-point/canonical exceptions, durable technical and product reference material lives under `docs/`, and OpenSpec remains the only source of truth for planned work, requirements, task state, progress, and change history.

This change also retires the previous Bakery-specific orchestration implementation now that OpenSpec Orchestrator is installed. The repository MUST NOT keep two competing orchestration systems.

## Program Traceability

- Roadmap phase: cross-cutting repository governance; no F/B product phase is advanced by this change.
- Owning capability: `project-documentation-governance`.
- Owning change: `organize-project-documentation`.
- Prerequisites: existing `docs/PROJECT_ORGANIZATION.md`, initialized Orch organization policy, and the current OpenSpec configuration.
- Product roadmap impact: none. `openspec/PROGRAM_MAP.md` does not need a product-state update unless implementation discovers a genuine roadmap coverage correction.

## Problem

The repository currently has three large product/technical documents at the repository root:

- `Bakery_App_Technical_Requirements.md`
- `Bakery_App_UI_UX_Requirements_Figma_Brief.md`
- `Bakery_Production_and_Cost_App_PRD_v1.1.md`

The current technical-requirements file contains stale lifecycle language that names an old active OpenSpec change and tells agents to treat that file as source of truth. That conflicts with the current repository rule that OpenSpec is the only source of truth for requirements, plans, tasks, progress, changes, and archives.

The durable docs tree is also partially categorized: `docs/api/` and `docs/setup/` exist, while reusable database, architecture, deployment, and product references remain at `docs/` root or repository root. Orch therefore correctly reports a missing `docs/database/` reference despite an existing `docs/DATABASE_SCHEMA.md`.

The repository also still contains the previous orchestration implementation:

- `orchestration/bakery-app.profile.mjs`
- `packages/multi-agent-delivery/`
- `docs/MULTI_AGENT_DELIVERY.md`

The legacy profile directly imports the `multi-agent-delivery` package and defines its own model/orchestrator policy. That implementation is now superseded by OpenSpec Orchestrator and must not remain active beside `.orch/`, `.agents/`, and `.codex/`.

## Scope

- Audit references to the three repository-root Bakery documents before moving anything.
- Move durable product reference material into `docs/product/` and durable technical architecture/reference material into the appropriate categorized `docs/` location when the content is still current and reusable.
- Resolve stale source-of-truth/lifecycle wording in durable docs so OpenSpec remains authoritative for planned work and task/change state.
- Place the existing database reference under `docs/database/` so the durable docs layout matches the configured organization model.
- Review existing top-level `docs/*.md` files and move only clearly categorized durable references; leave governance/navigation documents at `docs/` root when that remains the clearest canonical location.
- Remove the superseded legacy orchestration implementation: top-level `orchestration/`, `packages/multi-agent-delivery/`, and active documentation/instructions that exist only to operate that old system.
- Preserve historical OpenSpec/archive evidence that mentions the old system unless it incorrectly controls current behavior.
- Preserve `.orch/`, `.agents/`, and `.codex/` as the active ORCH integration.
- Update repository references and `openspec/config.yaml` atomically when a canonical file path changes.
- Update `docs/PROJECT_MAP.md` only for navigationally meaningful path changes.
- Verify `orch doctor`, `orch organize`, and link/reference integrity after the reorganization.

## Non-Goals

- Do not reorganize `Front-end/` application code.
- Do not modify archived OpenSpec changes.
- Do not rewrite product requirements merely to make documents shorter.
- Do not create duplicate copies of documents to preserve old paths.
- Do not move uncertain files solely to satisfy a folder taxonomy.
- Do not make Orch or `docs/` a competing planning/task/progress system.
- Do not change application behavior, database schema, API behavior, or hosted deployment state.
- Do not preserve dead legacy orchestration code merely for compatibility unless a live current caller is proven during execution.

## Legacy Orchestration Retirement

Execution MUST first inventory the old orchestration surface and search for current non-archive references. At minimum it must inspect:

- `orchestration/bakery-app.profile.mjs`
- all files under `packages/multi-agent-delivery/`
- `docs/MULTI_AGENT_DELIVERY.md`
- root `AGENTS.md`, package/workspace configuration, scripts, and active OpenSpec changes for references to the old paths or model policy.

If no live application/runtime dependency exists, the old implementation MUST be deleted. Stale current guidance MUST be removed or rewritten to point to ORCH. Historical archived OpenSpec material remains immutable.

## Initial Intended Classification

The following mapping is the planning target and MUST be validated against references/content before execution:

- `Bakery_Production_and_Cost_App_PRD_v1.1.md` -> `docs/product/` as the durable product/roadmap reference, with every OpenSpec/config/reference path updated in the same change.
- `Bakery_App_UI_UX_Requirements_Figma_Brief.md` -> `docs/product/` as durable UX/product reference.
- `Bakery_App_Technical_Requirements.md` -> `docs/architecture/` after removing stale active-change/source-of-truth language and retaining only current reusable technical reference.
- `docs/DATABASE_SCHEMA.md` -> `docs/database/` as the canonical database reference.
- `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT_PLAYBOOK.md`, `docs/API_REQUIREMENTS.md`, and `docs/BACKEND_REQUIREMENTS.md` require a duplication/currentness audit before any move; no move is approved merely by filename.
- `docs/MULTI_AGENT_DELIVERY.md` is expected to be removed with the retired orchestration implementation unless the audit finds durable, non-duplicative guidance worth migrating into an existing ORCH/agent governance document.

## Acceptance Evidence

- Repository root contains only intentional entry-point/canonical exceptions; the three ambiguous Bakery Markdown files are no longer unmanaged root docs.
- OpenSpec configuration and all current repository references resolve to the new canonical paths.
- No durable doc claims to be a competing source of truth for OpenSpec-managed requirements/plans/tasks/progress/change state.
- Top-level `orchestration/` no longer exists.
- `packages/multi-agent-delivery/` no longer exists unless a live dependency is proven and explicitly documented as a blocker.
- No active current guidance depends on the retired Bakery-specific orchestration/model policy.
- `.orch/`, `.agents/`, and `.codex/` remain intact as the active orchestration integration.
- `orch doctor` no longer warns that database implementation exists without a database reference when `docs/database/` contains the verified reference.
- `orch organize` reports no high-confidence safe-move violations caused by this change; any remaining warnings are documented intentional/manual-review cases.
- No application code or runtime behavior changes are included.
