# Bakery App Agent Instructions

These instructions apply to the entire repository.

## Authority and workflow

- OpenSpec is the ONLY source of truth for requirements, proposals/changes, designs, plans, tasks, progress, and archives.
- ORCH is the active orchestration and token-efficiency layer around OpenSpec. The managed integrations live in `.orch/`, `.agents/`, and `.codex/`.
- The retired `orchestration/` profile and `packages/multi-agent-delivery/` framework MUST NOT be recreated or used.
- Use the installed ORCH workflows when appropriate: `/orch-explore`, `/orch-plan`, `/orch-execute`, and `/orch-archive`.
- ORCH operational metadata MUST NOT become a second persistent task/change lifecycle.

## Required project references

Read only what the active task needs:

1. `AGENTS.md`
2. the relevant active OpenSpec change/spec
3. `docs/PROJECT_MAP.md` for navigation when needed
4. `docs/PROJECT_ORGANIZATION.md` when creating or moving files
5. relevant current-system reference under `docs/`
6. `docs/AGENT_TOKEN_EFFICIENCY.md` for repository-specific efficiency guidance

Durable current-system reference belongs under `docs/`. Product roadmap/reference material may live under `docs/product/`, but approved planned work and progress remain in OpenSpec.

## Scope and workspace safety

- Execute only approved OpenSpec scope.
- Preserve unrelated user/agent changes.
- Do not reorganize unrelated application code while implementing a feature.
- Parallel work requires independent tasks and non-overlapping writable file ownership; otherwise execute sequentially.
- Stop for ambiguous product decisions, destructive actions, external authority requirements, or conflicting ownership.

## Application boundaries

- Frontend code lives under `Front-end/`.
- Keep feature-specific code close to its feature/domain; reuse shared locations only when reuse is demonstrated.
- Bakery-scoped business access must require an active bakery and remain protected by database RLS/membership checks.
- Do not introduce a separate custom backend merely to mirror Supabase Data API behavior without an approved need.

## Supabase and secrets

- All schema changes MUST be committed migrations under `Front-end/supabase/migrations/` using the repository's Supabase migration workflow.
- Verify migrations locally before hosted rollout when the task changes schema/security.
- Browser-safe values may use `VITE_*`; service-role keys, database passwords, provider secrets, and webhook secrets MUST NOT enter browser code or Git.
- Dev/staging must not use live production tenant data.

## Verification baseline

For frontend changes, run the relevant focused checks and finish with the applicable baseline from `Front-end/`:

```text
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

Run Playwright when user journeys change. For Supabase work, also run migration/RLS/security verification appropriate to the change.

Never mark an OpenSpec task complete without evidence. Never fabricate tool usage, token savings, test results, or hosted verification.
