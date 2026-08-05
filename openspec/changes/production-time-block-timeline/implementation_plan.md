# Implementation Plan: Production Time-Block Timeline

request_feedback: true

## Objective

Replace the Production page's repeated task-card scan with a chronological,
quantity-aware time-block timeline. Today is the default view; work sharing a
scheduled minute and flow step is grouped with product-level quantities and a
grouped completion action. Tomorrow and Calendar reuse the same presentation.

## OpenSpec Change

`production-time-block-timeline`

Artifacts:

- `proposal.md`
- `design.md`
- `specs/production-schedule-views/spec.md`
- `tasks.md`

## Execution Preconditions

- Preserve the active `persist-manual-orders`,
  `add-manual-order-status-transitions`, and `clarify-orders-workflow-ui`
  ownership boundaries.
- Treat generated production tasks, starter calculations, and the existing
  task update callback as the source of truth for this UI change.
- Do not edit `production.ts`, `planning.ts`, domain adapters, Supabase
  migrations, or Flow Builder behavior without a new product decision.
- Stop if grouped completion requires a transactional backend batch command,
  changes task-generation semantics, or changes inventory/starter formulas.

## Workstream 1 - Timeline presentation model

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 1.1-1.2
- Exclusive writable ownership:
  - `Front-end/src/app/productionTimeline.ts` (new)
  - `Front-end/src/app/productionTimeline.test.ts` (new)
- Deliverable: pure chronological grouping, product quantity aggregation,
  status/progress derivation, task traceability, and starter detail mapping.
- Must not change: `production.ts`, `planning.ts`, domain adapters,
  `ProductionScreen.tsx`, or workspace mutation behavior.
- Verification: focused Vitest model tests.

## Workstream 2 - Time-block presentation component

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 2.1-2.2
- Exclusive writable ownership:
  - `Front-end/src/app/components/production/ProductionTimeBlock.tsx` (new)
  - `Front-end/src/app/components/production/ProductionTimeBlock.test.tsx` (new)
- Deliverable: responsive accessible block UI, product quantity lines, starter
  summary, grouped primary completion, expandable details, and task-level
  exception controls using explicit callback contracts.
- Must not change: `ProductionScreen.tsx`, `TaskExecutionCard.tsx`,
  `BakeryWorkspace.tsx`, task-generation, or Flow Builder behavior.
- Dependency: consume the stable model contract from Workstream 1.
- Verification: focused component tests and accessibility assertions.

## Workstream 3 - Production screen integration

- Model: `gemini-3.6-flash`
- Reasoning effort: `high`
- Task IDs: 3.1-3.2
- Exclusive writable ownership:
  - `Front-end/src/app/screens/ProductionScreen.tsx`
  - `Front-end/src/app/screens/ProductionScreen.timeline.test.tsx` (new)
- Deliverable: Today-default time-block rendering with grouped chronological
  work, unchanged Tomorrow/Calendar/category controls, preserved pickup events,
  timers, dependency warnings, and deferred Flow Builder behavior.
- Must not change: `BakeryWorkspace.tsx`, `production.ts`, `planning.ts`,
  adapters, or global navigation.
- Dependency: starts after Workstreams 1-2 contracts are reviewed.
- Verification: focused screen tests plus existing production component tests.

## Workstream 4 - Responsive browser evidence

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 4.1
- Exclusive writable ownership:
  - `Front-end/e2e/production-time-block-timeline.spec.ts` (new)
- Deliverable: desktop/mobile journeys for Today default, grouped product
  quantities, grouped completion, Tomorrow, Calendar, and action accessibility.
- Must not change: application source or existing E2E files.
- Dependency: starts after Workstream 3 is integrated.
- Verification: focused desktop/mobile Playwright run.

## Workstream 5 - Integration and lifecycle evidence

- Owner: orchestrator
- Model: `gemini-3.6-flash`
- Reasoning effort: `high`
- Task IDs: 4.2, 5.1-5.2
- Exclusive writable ownership:
  - `openspec/changes/production-time-block-timeline/`
  - `openspec/PROGRAM_MAP.md`
- Deliverable: ownership review, integrated quality evidence, manual visual
  acceptance record, synchronized delta readiness, and archive readiness.
- Verification:

```text
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run test:e2e -- e2e/production-time-block-timeline.spec.ts
pnpm run openspec:validate
```

## Ownership Validation

The planned writable ownership sets are disjoint. Workstream 3 is serialized
after the model and component contracts; Workstream 4 is serialized after the
screen integration. The orchestrator owns all cross-workstream integration and
OpenSpec lifecycle updates.

## Approval Gate

This is planning only. Stop and wait for explicit user approval before running
`/orch production-time-block-timeline`.
