# Design: Add Manual Order Status Transitions

## Findings

- `Front-end/src/app/types.ts` and the domain types already define the order
  statuses required by the requested lifecycle.
- `OrdersScreen.tsx` renders a `Mark Ready` button without an event handler;
  it does not expose actions for confirmed, in-production, or ready orders.
- `BakeryWorkspace.tsx` can create orders and update production tasks, but it
  has no order-status command to connect the detail action to either adapter.
- `localAdapter.ts` creates orders with `confirmed` status and has no order
  status mutation.
- `manualOrderAdapter.ts` loads persisted order status and creates orders, but
  exposes no persisted update operation.
- The existing `orders.status` database constraint already accepts `draft`,
  `confirmed`, `in-production`, `ready`, `completed`, and `cancelled`; the
  implementation should verify the current migration/RLS contract before
  deciding whether a new migration is needed.

## Decisions

1. Model the three allowed transitions as a single order-status mutation with
   an expected current status and target status. The adapter and database
   boundary must reject any transition other than the next lifecycle step.
2. Keep the transition sequential. `confirmed` may only become
   `in-production`; `in-production` may only become `ready`; `ready` may only
   become `completed`. Terminal statuses have no action.
3. Use the active bakery ID and a caller-owned operation ID for the mutation.
   The persisted path must update only a member's order in that bakery and
   return the refreshed order snapshot.
4. Keep manual order status separate from production-task status. A baker may
   manually mark an order ready even if task history is incomplete; automatic
   task-derived transitions are outside this change.
5. The detail view owns the action label and pending/error presentation, while
   the adapter owns validation and authoritative persistence. The status chip
   remains the single visual indicator of the resulting state.

## Integration Shape

```text
Orders detail action
        |
        v
BakeryWorkspace order-status command
        |
        +--> local adapter: validate + update session snapshot
        |
        +--> persisted adapter/RPC or scoped update: validate + update DB
        |
        v
Authoritative order result -> refreshed Orders projection
```

## Risks and Mitigations

- A direct update could skip a lifecycle state. Require both expected current
  status and target status, validate the transition in the adapter and at the
  persisted boundary, and test denial paths.
- A failed persisted update could leave stale UI state. Await the mutation,
  refresh from the authoritative snapshot, and retain the previous status on
  failure.
- The active `persist-manual-orders` change still names the Orders screen as
  an owned file. Do not apply this change concurrently; serialize it after
  that change's remaining acceptance gate or explicitly transfer follow-up
  ownership before execution.
- Existing online-order records share the `orders` table. Scope the new
  command to authenticated bakery membership and verify that public checkout
  behavior is unchanged.

## Verification Boundary

Use local synthetic data only. Verification must cover local adapter
transitions, persisted success and denial paths, generated types if the
database boundary changes, focused Vitest tests, and desktop/mobile Playwright
coverage. No linked reset, production query, or service-role browser access is
authorized.

