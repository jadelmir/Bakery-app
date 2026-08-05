# Add Manual Order Status Transitions

## Problem

The Orders detail view displays several order statuses, but its only status
action is a non-functional `Mark Ready` button. Bakers cannot manually move an
order through the operational lifecycle from confirmed to production, ready,
and completed. The existing task update path changes production-task state,
not the order's own status.

## Goal

Allow a bakery member to advance an order manually through the sequential
workflow:

```text
Confirmed -> In Production -> Ready -> Completed
```

Each transition must persist for the active bakery when the persisted manual
order service is active and remain available in the session-local adapter used
by mock-mode tests.

## Program Traceability

- Frontend roadmap phase: F6 Orders and Payments.
- Backend roadmap phases: B5 Customers and Orders; B8 Task Lifecycle and
  Regeneration.
- Owning capability: `order-status-transitions`.
- Prerequisites: the existing Orders screen, order-status union, shared domain
  state boundary, and the active `persist-manual-orders` implementation.
- Related active change: `persist-manual-orders`. This is a follow-up change;
  its manual acceptance and any edits to `OrdersScreen.tsx` must be completed
  or explicitly serialized before this change is applied.

## Scope

- Add a bakery-scoped order-status update contract for the allowed sequential
  transitions.
- Implement the update in the local adapter and persisted manual-order
  adapter, preserving the existing tenant boundary.
- Replace the static Orders detail action with a status-specific action:
  `Start Production`, `Mark Ready`, or `Mark Completed`.
- Refresh the Orders view from the authoritative mutation result and show a
  pending/error state without changing the order optimistically on failure.
- Add unit, adapter, database, and desktop/mobile browser coverage for each
  transition, invalid transitions, reload persistence, and failure recovery.

## Non-Goals

- Do not add automatic transitions based on production-task completion.
- Do not allow backward transitions, skipping states, cancellation, editing,
  refunds, or invoice behavior.
- Do not change public online checkout status behavior.
- Do not alter production-task lifecycle semantics; task completion remains a
  separate workflow.
- Do not reset linked or production databases.

## Acceptance Evidence

- A confirmed order can be advanced to in production.
- An in-production order can be advanced to ready.
- A ready order can be advanced to completed.
- The UI offers no transition action for completed, cancelled, or unsupported
  statuses.
- Invalid or repeated transitions are rejected without changing the order.
- A successful persisted transition remains after reload and is visible in the
  active bakery only.
- A failed transition leaves the prior status visible and gives the member an
  actionable error.

