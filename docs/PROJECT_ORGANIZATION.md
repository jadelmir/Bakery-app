# Project Organization Standard

## Authority

OpenSpec is the ONLY source of truth for requirements, proposals/changes, designs, plans, tasks, progress, and archives. ORCH coordinates how agents work around OpenSpec; it does not create competing persistent state.

This document governs repository placement outside OpenSpec. If it conflicts with OpenSpec conventions, OpenSpec wins.

## Root hygiene

Repository root should contain entry points and project/tooling directories, not feature-specific or long-form reference documents.

Allowed root documents include `README.md`, `AGENTS.md`, contribution/security/license files when present, and tool configuration required at root.

Durable documentation belongs under `docs/`.

## Documentation categories

- `docs/architecture/` — current architecture and technical constraints.
- `docs/api/` — current API/integration contracts and implemented surfaces.
- `docs/database/` — current database reference derived from committed migrations.
- `docs/deployment/` — deployment, environment, release, and operational rollout guidance.
- `docs/setup/` — local/tool setup guidance.
- `docs/product/` — durable product and UI/UX reference material; approved planned work still belongs in OpenSpec.
- `docs/operations/` — runbooks/troubleshooting when such durable docs are needed.

Repository-wide navigation/governance documents such as `PROJECT_MAP.md`, `PROJECT_ORGANIZATION.md`, and `AGENT_TOKEN_EFFICIENCY.md` may remain directly under `docs/`.

## Code placement

- Follow the existing `Front-end/` structure rather than inventing a theoretical layout.
- Keep feature-specific components, adapters, types, tests, and logic near the owning feature/domain.
- Create shared abstractions only when multiple real consumers justify them.
- Do not create new top-level folders when an existing location fits.

## Documentation discipline

- Search for an existing canonical document before creating another.
- Current-system docs describe implemented behavior; do not store active task checklists/progress in `docs/`.
- Proposed or not-yet-implemented behavior belongs in OpenSpec.
- When approved implementation changes documented behavior, update the relevant durable doc in the same work.
- Do not create compatibility duplicates such as `*-old`, `*-new`, or `*-final`.
- Historical source material may be preserved inside the owning OpenSpec change when needed as evidence, but it is not current reference.

## ORCH integration

Active ORCH integration is limited to `.orch/`, `.agents/`, `.codex/`, the installed ORCH CLI/workflows, and concise references in repository instructions. The retired Bakery-specific `orchestration/` and `packages/multi-agent-delivery/` framework MUST NOT be recreated.
