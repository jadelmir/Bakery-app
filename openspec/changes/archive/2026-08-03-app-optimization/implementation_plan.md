---
change: app-optimization
provider: openai
request_feedback: true
execution_status: verified
---

# Implementation Plan: App Optimization

## Objective

Reduce the initial JavaScript entry from 819,826 bytes / 211.29 KB gzip to no
more than 500 KB / 150 KB gzip, isolate domain-state updates, and consolidate
production timer ticks while preserving all existing user behavior and tests.

## Model Policy

- Orchestrator: `gpt-5.6-sol`, inherited reasoning effort.
- Bounded agents: `gpt-5.6-terra`, reasoning effort `medium`.
- The execution host exposed OpenAI models, so the documented provider
  equivalent was used without changing task or ownership scope.

## Workstream A: Bundle Measurement and Budget

- Task IDs: 1.1, 1.2, 1.3.
- Read first: all artifacts in this change, `Front-end/package.json`,
  `Front-end/vite.config.ts`, and current build output.
- Exclusive writable ownership:
  - `Front-end/package.json`
  - `Front-end/vite.config.ts`
  - `Front-end/scripts/check-bundle-budget.mjs` (new)
- Deliverable: manifest-backed raw/gzip entry measurement and deterministic
  budget command without adding a runtime dependency.
- Acceptance: build emits a manifest; the check prints sizes and correctly
  enforces 500 KB raw / 150 KB gzip.
- Do not change: application source, tests, lockfile, OpenSpec, or CI workflows.
- Verification:
  - `pnpm run build`
  - `pnpm run check:bundle`
- Stop when: a new dependency or lockfile change is required, the manifest has
  multiple ambiguous entries, or application source must change.

## Workstream B: Domain Selector Isolation

- Task IDs: 3.1, 3.2.
- Read first: all artifacts in this change, the provider, selectors, controller,
  and existing state tests.
- Exclusive writable ownership:
  - `Front-end/src/app/state/provider.tsx`
  - `Front-end/src/app/state/selectors.ts`
  - `Front-end/src/app/state/state.test.ts`
  - `Front-end/src/app/state/provider.test.tsx` (new, if needed)
- Deliverable: tested selector subscription/equality behavior that preserves
  bakery-switch isolation and the existing command API.
- Acceptance: focused state/provider tests, lint, and typecheck pass; tests prove
  stable selections are not notified by unrelated updates.
- Do not change: app shell, domain adapters/contracts, screens, OpenSpec, or
  browser tests.
- Verification:
  - focused Vitest state/provider tests
  - focused ESLint for owned files
  - `pnpm run typecheck`
- Stop when: adapter/controller contracts must change, bakery isolation becomes
  ambiguous, or integration requires editing the app shell.

## Workstream C: Shared Production Clock

- Task IDs: 3.3, 3.4.
- Read first: all artifacts in this change, production task card/screen, domain
  task types, production unit tests, and production-workspace browser tests.
- Exclusive writable ownership:
  - `Front-end/src/app/components/production/TaskExecutionCard.tsx`
  - `Front-end/src/app/screens/ProductionScreen.tsx`
  - `Front-end/src/app/production.test.ts`
  - `Front-end/e2e/production-workspace.spec.ts`
- Deliverable: one shared production ticker with timestamp-derived elapsed time
  and preserved timer/task behavior.
- Acceptance: focused fake-timer/unit and browser tests pass; multiple cards do
  not create independent intervals.
- Do not change: state provider, app shell, adapters, fixtures, OpenSpec, or
  build configuration.
- Verification:
  - focused production Vitest tests
  - focused production-workspace Playwright tests on desktop/mobile
  - focused ESLint and `pnpm run typecheck`
- Stop when: persistence semantics must change, fixtures outside ownership must
  change, or a new product decision is required.

## Orchestrator-Owned Integration

- Task IDs: 2.1-2.5 and 4.1-4.8.
- Exclusive writable ownership:
  - `Front-end/src/app/App.tsx`
  - `Front-end/src/app/BakeryWorkspace.tsx`
  - `Front-end/src/app/App.test.tsx`
  - `Front-end/e2e/app.spec.ts`
  - `Front-end/e2e/shared-application-foundation.spec.ts`
  - `openspec/changes/app-optimization/**`
  - `openspec/specs/frontend-performance-optimization/spec.md`
  - `openspec/PROGRAM_MAP.md`
- Responsibilities: lazy-load public and authenticated screens, remove unused
  compatibility exports that prevent chunk isolation, integrate selectors,
  review all workstreams, run the
  complete verification suite, synchronize verified requirements, and record
  current evidence.

## Approval Gate

The user approved execution by requesting `/orch app-optimization`; the plan is
implemented and verified pending manual review and archival.

## Verification Evidence

- Baseline entry: 819,826 bytes raw / 211.29 KB gzip.
- Verified entry: 406,590 bytes raw / 115,164 bytes gzip.
- `pnpm run typecheck`: passed.
- `pnpm run lint`: passed with zero warnings/errors.
- `pnpm run test`: 133/133 passed.
- `pnpm run build`: passed with manifest-backed feature chunks.
- `pnpm run check:bundle`: passed the 500,000-byte raw and 150,000-byte gzip budgets.
- `pnpm run test:e2e`: 44/44 passed across desktop and mobile; the suite grew
  from 42 through the shared-clock regression scenario.
