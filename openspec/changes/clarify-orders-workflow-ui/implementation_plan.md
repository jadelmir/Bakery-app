# Implementation Plan: Clarify Orders Workflow UI

request_feedback: true

## Objective

Turn the Orders page into a clear pickup-first operational queue with separate
Current and Completed views, visible lifecycle stage counts, stronger card
hierarchy, and an order detail that explains current state and the next action.

## OpenSpec Change

`clarify-orders-workflow-ui`

## Preconditions

- Serialize after `add-manual-order-status-transitions` and
  `persist-manual-orders` release ownership of shared Orders files.
- Preserve existing order status, transition, persistence, payment, and task
  contracts.
- Stop for product review if implementation requires calendar view,
  cancellation actions, drag-and-drop transitions, or new backend fields.

## Workstream 1 - Presentation model and shared components

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 1.1, 1.2, 2.1, 2.2, 2.3
- Exclusive writable ownership:
  - new files under `Front-end/src/app/components/orders/workflow/`
  - new `Front-end/src/app/components/orders/orderPresentation.ts`
  - focused tests beside those files
- Deliverable: tested pure selectors and reusable responsive components for
  views, stage counts, sorting, cards, lifecycle, and progress summaries.
- Must not change: `OrdersScreen.tsx`, `BakeryWorkspace.tsx`, domain adapters,
  Supabase files, or existing status-transition behavior.
- Verification: focused Vitest and accessibility assertions.

## Workstream 2 - Orders screen integration

- Model: `gemini-3.6-flash`
- Reasoning effort: `high`
- Task IDs: 3.1, 3.2, 3.3, 4.1
- Exclusive writable ownership:
  - `Front-end/src/app/screens/OrdersScreen.tsx`
  - `Front-end/src/app/screens/OrdersScreen.test.tsx`
- Deliverable: Current/Completed default navigation, pickup-first queue,
  desktop master-detail, mobile detail, and preserved authoritative actions.
- Must not change: adapters, database schema, `BakeryWorkspace.tsx`, public
  storefront, Home, or Production behavior.
- Dependency: starts after Workstream 1 components and selectors stabilize.
- Verification: OrdersScreen Vitest suite across current, completed, filtering,
  detail, success, and failure states.

## Workstream 3 - Responsive browser acceptance

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 4.2
- Exclusive writable ownership:
  - Orders-related cases in `Front-end/e2e/app.spec.ts` or one new focused
    `Front-end/e2e/orders-workflow.spec.ts`
- Deliverable: desktop/mobile journeys proving default Current, completed
  history, pickup ordering, detail context, and sequential transitions.
- Must not change: application source or unrelated E2E suites.
- Dependency: starts after Workstream 2.
- Verification: focused desktop/mobile Playwright run.

## Workstream 4 - Integration and lifecycle evidence

- Owner: orchestrator
- Task IDs: 4.3
- Exclusive writable ownership:
  - OpenSpec artifacts for this change
  - `openspec/PROGRAM_MAP.md`
- Deliverable: integrated quality evidence and manual visual-acceptance gate.
- Verification:

```text
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run test:e2e -- e2e/orders-workflow.spec.ts
pnpm run openspec:validate
```

## Ownership Validation

Workstreams are serialized where dependencies exist and have no concurrent
writable-file overlap. The orchestrator owns integration and lifecycle updates.

## Approval Gate

This is planning only. Stop and wait for explicit user approval before running
`/orch clarify-orders-workflow-ui`.
