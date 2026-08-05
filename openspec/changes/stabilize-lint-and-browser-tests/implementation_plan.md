---
change: stabilize-lint-and-browser-tests
provider: openai
request_feedback: true
execution_status: verified
---

# Implementation Plan: Stabilize Lint and Browser Verification

## Objective

Complete OpenSpec tasks 1.1-4.7 so the frontend passes lint and all 42 browser
tests without weakening quality rules or changing unrelated product behavior.

## Orchestration Policy

- Orchestrator: inherited `gpt-5.6-sol` policy on the execution host.
- Bounded agents: `gpt-5.6-terra`, reasoning effort `medium`.
- Concurrent agents: three, with exact non-overlapping writable ownership.
- Orchestrator-only files: `openspec/changes/stabilize-lint-and-browser-tests/**`
  and `openspec/PROGRAM_MAP.md`.

## Workstream A: Production Screen Type Safety

- Task IDs: 1.1, 2.1.
- Read first:
  - `openspec/changes/stabilize-lint-and-browser-tests/proposal.md`
  - `openspec/changes/stabilize-lint-and-browser-tests/design.md`
  - `openspec/changes/stabilize-lint-and-browser-tests/specs/frontend-quality-polish/spec.md`
  - `openspec/changes/stabilize-lint-and-browser-tests/tasks.md`
  - `Front-end/src/app/screens/ProductionScreen.tsx`
- Exclusive writable ownership:
  - `Front-end/src/app/screens/ProductionScreen.tsx`
- Deliverable: eliminate both production-screen lint errors using existing
  domain types without changing rendered behavior.
- Acceptance: focused ESLint passes for the owned file and typecheck passes.
- Do not change: domain contracts, adapters, fixtures, browser tests, lint
  configuration, or OpenSpec files.
- Focused verification:
  - `pnpm exec eslint src/app/screens/ProductionScreen.tsx --max-warnings=0`
  - `pnpm run typecheck`
- Stop when: a shared domain type must change, behavior must change, or the
  required type is ambiguous.

## Workstream B: Supabase Adapter Type Safety

- Task IDs: 1.1, 2.2, 2.3.
- Read first:
  - all artifacts in this OpenSpec change
  - `Front-end/src/lib/supabase/database.types.ts`
  - the four owned adapter/test files
- Exclusive writable ownership:
  - `Front-end/src/lib/supabase/starterInventoryAdapter.ts`
  - `Front-end/src/lib/supabase/starterInventoryAdapter.test.ts`
  - `Front-end/src/lib/supabase/taskRegenerationAdapter.ts`
  - `Front-end/src/lib/supabase/taskRegenerationAdapter.test.ts`
- Deliverable: eliminate adapter/test explicit-`any` errors using generated or
  narrow types while preserving query and mutation behavior.
- Acceptance: focused ESLint and both focused Vitest suites pass; no lint
  suppression is introduced.
- Do not change: generated database types, migrations, shared domain files,
  production screens, browser tests, lint configuration, or OpenSpec files.
- Focused verification:
  - `pnpm exec eslint src/lib/supabase/starterInventoryAdapter.ts src/lib/supabase/starterInventoryAdapter.test.ts src/lib/supabase/taskRegenerationAdapter.ts src/lib/supabase/taskRegenerationAdapter.test.ts --max-warnings=0`
  - `pnpm exec vitest run src/lib/supabase/starterInventoryAdapter.test.ts src/lib/supabase/taskRegenerationAdapter.test.ts`
  - `pnpm run typecheck`
- Stop when: generated types are stale, a migration/schema change is required,
  or preserving behavior requires a shared file edit.

## Workstream C: Deterministic Browser Coverage

- Task IDs: 1.2, 3.1, 3.2, 3.3, 3.4.
- Read first:
  - all artifacts in this OpenSpec change
  - `Front-end/e2e/app.spec.ts`
  - `Front-end/e2e/production-workspace.spec.ts`
  - `Front-end/src/app/domain/fixtures.ts`
  - relevant Playwright failure context under `Front-end/test-results/`
- Exclusive writable ownership:
  - `Front-end/e2e/app.spec.ts`
  - `Front-end/e2e/production-workspace.spec.ts`
  - `Front-end/src/app/domain/fixtures.ts`
- Deliverable: diagnose and correct calendar/fixture drift so all eight
  previously failing desktop/mobile cases pass while retaining behavioral
  assertions.
- Acceptance: the two focused specs pass in both Playwright projects and no
  tests are skipped, quarantined, or weakened.
- Do not change: application screens/components, adapters, Playwright global
  configuration, lint configuration, or OpenSpec files.
- Focused verification:
  - `pnpm exec playwright test e2e/app.spec.ts e2e/production-workspace.spec.ts`
- Stop when: deterministic fixtures still expose a product defect, application
  source must change, or a product decision is required. Report reproduction
  evidence so the orchestrator can serialize a newly owned fix.

## Orchestrator Integration

1. Confirm all agents stayed within ownership and review each diff.
2. Resolve any product defect serially; do not assign an overlapping file while
   its original owner is active.
3. Complete tasks 2.4 and 4.1-4.6 with the full verification baseline.
4. Update `openspec/PROGRAM_MAP.md` only when all gates are green.
5. Mark task checkboxes complete only with recorded evidence.
6. Return the change for manual review; do not archive it automatically.

## Approval Gate

Implementation was approved and completed through
`/orch stabilize-lint-and-browser-tests`. Archival remains blocked until the
user completes manual testing and explicitly requests `/orch-archive`.

## Verification Evidence

- `pnpm run typecheck`: passed.
- `pnpm run lint`: passed with zero warnings and zero errors.
- `pnpm run test`: passed, 129/129.
- `pnpm run build`: passed; the pre-existing large-chunk warning remains.
- `pnpm run test:e2e`: passed, 42/42 across desktop and mobile.
- The eight prior browser failures were classified as calendar/fixture drift;
  no application defect was found.
- Ownership validation and integrated review found no cross-workstream edits,
  skipped tests, weakened behavioral assertions, or lint suppression.
