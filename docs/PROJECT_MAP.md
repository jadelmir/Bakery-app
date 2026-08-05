# Bakery App — Project Map

This map describes the current repository. OpenSpec owns planned work and lifecycle state; this file is navigation only.

## Repository root

- `AGENTS.md` — repository-wide agent rules and ORCH/OpenSpec boundary.
- `README.md` — project overview and local setup.
- `Front-end/` — React/TypeScript application and Supabase project files.
- `docs/` — durable current-system, product-reference, setup, and governance documentation.
- `openspec/` — specifications, active changes, task/progress state, and archives.
- `.orch/` — ORCH project configuration/operational state.
- `.agents/` — ORCH-managed Antigravity workflows plus installed domain skills.
- `.codex/` — ORCH-managed Codex skills.

The legacy `orchestration/` and `packages/multi-agent-delivery/` implementation has been retired and MUST NOT be used as a project location.

## Frontend application

- `Front-end/src/app/` — application shell, workspace selection, feature screens, state, domain adapters, and business calculations.
- `Front-end/src/app/features/` — feature/domain-oriented implementation where present.
- `Front-end/src/app/components/` — feature and shared UI components.
- `Front-end/e2e/` — Playwright user-journey coverage.
- `Front-end/supabase/migrations/` — committed PostgreSQL/RLS/RPC migration history.
- `Front-end/supabase/` — local Supabase configuration, functions, and seed support.

## Documentation

### Governance/navigation

- `docs/PROJECT_MAP.md` — this navigation map.
- `docs/PROJECT_ORGANIZATION.md` — placement and documentation-governance rules.
- `docs/AGENT_TOKEN_EFFICIENCY.md` — repository-specific supplement to ORCH token-efficiency policy.

### Architecture and operations

- `docs/architecture/architecture.md` — current system architecture.
- `docs/architecture/technical-requirements.md` — durable technical constraints and canonical reference links.
- `docs/database/database-schema.md` — implemented database reference; migrations remain exact schema evidence.
- `docs/deployment/deployment-playbook.md` — environments, deployment, secrets, migrations, and release operations.
- `docs/setup/` — setup-specific references.

### API

- `docs/api/api.md` — current API/Supabase surface reference.

### Product reference

- `docs/product/bakery-production-and-cost-app-prd-v1-1.md` — product roadmap/reference used by OpenSpec context.
- `docs/product/bakery-app-ui-ux-requirements-figma-brief.md` — durable UI/UX product reference.

## OpenSpec

- `openspec/config.yaml` — OpenSpec project configuration and planning rules.
- `openspec/PROGRAM_MAP.md` — program/capability traceability.
- `openspec/changes/` — active changes and archives.
- `openspec/specs/` — canonical implemented specifications.

Historical documents preserved inside a specific OpenSpec change are evidence for that change, not current durable reference.
