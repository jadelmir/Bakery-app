# Bakery App Agent Instructions

These instructions apply to the entire repository.

Generic orchestration definitions are isolated in
`packages/multi-agent-delivery`. Bakery-specific phase names and verification
defaults are provided by `orchestration/bakery-app.profile.mjs` and
`docs/MULTI_AGENT_DELIVERY.md`. Do not add Bakery domain assumptions to the
reusable package.
Agents MUST consult `docs/PROJECT_MAP.md` for repository navigation.
Agents MUST follow `docs/AGENT_TOKEN_EFFICIENCY.md` when loading context, investigating code, running tests, and reporting results.
Agents MUST follow `docs/PROJECT_ORGANIZATION.md` to organize agent files.

## Delivery contract

- Use `/orch-plan <phase-name>` to create non-overlapping task partitions, validate OpenSpec deltas, and present an implementation plan for user review without modifying source code.
- Use `/orch <phase-name>` to execute multi-agent implementation, integrated verification, and OpenSpec lifecycle synchronization for an approved plan.
- Use `/orch-archive <phase-name>` to archive a completed, manually tested OpenSpec change, update main specs in `openspec/specs/`, and record immutable provenance in `PROGRAM_MAP.md` (never archive work before manual testing is complete).
- OpenSpec is the source of truth for planned feature work. Before implementing
  a feature, select or create the relevant change and read its proposal, design,
  delta specifications, and task list.
- Keep the existing frontend and backend product phases intact. Multi-agent work
  is an execution strategy inside a phase, not a replacement roadmap.
- Use multiple agents only when the user explicitly requests delegation,
  parallel agent work, or multi-agent execution and the work divides into
  independent, useful workstreams.
- Use one primary agent as the orchestrator for each change. The orchestrator
  owns task division, assignments, integration, whole-project verification,
  OpenSpec synchronization, and archive readiness.
- A sub-agent implements only its assigned OpenSpec task IDs and files. It must
  not broaden scope, approve product decisions, synchronize main specs, or
  archive the change.

## Orchestrator responsibilities

Before spawning an implementation agent, provide:

1. The OpenSpec change name and exact task IDs.
2. The proposal, design, and specification files it must read.
3. A concrete deliverable and acceptance criteria.
4. Exclusive files or directories it may edit.
5. Files and behaviors it must not change.
6. Focused verification commands.
7. A stopping rule for ambiguity, design conflicts, or required scope changes.
8. The selected model and reasoning effort when an override is useful.

The orchestrator must:

- Check that concurrent assignments do not edit the same files.
- Serialize tightly coupled or overlapping work.
- Treat research and review agents as read-only unless explicit edit ownership
  is assigned.
- Review the current shared workspace state after agents finish.
- Resolve conflicts and integration issues itself.
- Run the complete verification appropriate to the change.
- Mark OpenSpec tasks complete only when their acceptance criteria are met.

## Sub-agent responsibilities

A sub-agent must:

- Read every assigned OpenSpec artifact before editing.
- Inspect current file contents immediately before changing them.
- Stay within assigned task and file boundaries.
- Preserve unrelated user and agent changes in the shared workspace.
- Run focused tests for its work.
- Report files changed, tests run, assumptions, and remaining concerns.
- Stop and notify the orchestrator when implementation requires a new product
  decision, an OpenSpec change, destructive action, external authority, or an
  overlapping file.

## Shared-workspace safety

- All agents share one filesystem; changes become visible immediately.
- Never assign the same writable file to concurrent agents.
- Do not revert, reset, delete, or rewrite another agent's work.
- Prefer one agent to own a migration chain, shared type file, central router,
  application shell, or other high-conflict surface.
- The orchestrator alone performs final broad formatting, generated-type
  refreshes that touch shared output, and cross-workstream integration.

## Model selection

Models across OpenAI, Gemini, and Claude are supported based on task risk and scope:

- **Bounded Work models** (`gpt-5.6-terra`, `gemini-3.6-flash`, `claude-3.5-haiku`):
  - Routine React components and forms.
  - Focused CRUD adapters.
  - Unit and end-to-end tests.
  - Documentation and repository exploration.
  - Mechanical refactors with strong tests.

- **High-Reasoning & Architecture models** (`gpt-5.6-sol`, `gemini-3.6-pro`, `claude-3.7-sonnet`):
  - Architecture and OpenSpec design.
  - Authentication, authorization, RLS, and security review.
  - Database migrations with data-loss or rollout risk.
  - Scheduling, financial, inventory, and idempotency invariants.
  - Difficult debugging across multiple layers.
  - Final integration review for a large change.

Suggested reasoning starting points:

- Bounded `medium`: routine implementation, tests, and documentation.
- Bounded `high`: moderately complex feature work.
- High-Reasoning `high`: architecture, security, database, and integration work.
- High-Reasoning `xhigh`: only for unusually difficult or high-risk analysis after a lower level is insufficient.

Do not choose high-reasoning models for every task. Model choice should reflect risk and
complexity, and the orchestrator should keep the inherited/default model when
an override provides no clear benefit.

## OpenSpec lifecycle

1. Explore requirements when necessary.
2. Propose or update the OpenSpec change.
3. Confirm its artifacts are coherent and implementation-ready.
4. Assign non-overlapping tasks to agents.
5. Apply the change and update task checkboxes as work is verified.
6. Run integrated quality, migration, security, and product checks.
7. Synchronize delta specifications when appropriate.
8. Archive only after the change is complete and no required work remains.

If the OpenSpec CLI is unavailable, preserve the standard artifact structure
manually and clearly report that CLI validation remains unavailable.

## Verification baseline

For frontend changes, run the relevant subset and finish with:

```text
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

Run Playwright when user journeys change. For Supabase work, also rebuild from
committed migrations, regenerate database types, test RLS success and denial
paths, and review security/performance advisors as appropriate.

Focused sub-agent checks do not replace the orchestrator's integrated checks.

## Supabase CLI Workflow & Secret Isolation

All agents must strictly adhere to the database migration and security guidelines defined in `docs/DEPLOYMENT_PLAYBOOK.md`:

1. **Schema Migration Generation**: Always create new SQL migrations via `supabase migration new <descriptive_name>`. All schema changes must exist as committed files under `supabase/migrations/`.
2. **Local Environment Testing & Data Preservation**:
   - `supabase start`: Start local Docker-based Supabase stack.
   - `supabase db push`: Apply unapplied new SQL migrations incrementally to the local database **without wiping existing local data**.
   - `supabase db reset`: Reapply all committed migrations from clean state and seed local fake data (`supabase/seed.sql`). Use only when a complete clean-slate database reset is desired.
   - `supabase db lint`: Perform static analysis for SQL syntax, RLS policies, and schema safety.
3. **Secret Isolation & Zero Production Data**:
   - Public keys (`VITE_SUPABASE_PUBLISHABLE_KEY`) are permitted in client code.
   - Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DATABASE_PASSWORD`) MUST NEVER be exposed to frontend code or committed to Git.
   - Local and Staging environments MUST use fake synthetic seed data only. Never restore or expose live production tenant data in dev/staging environments.

