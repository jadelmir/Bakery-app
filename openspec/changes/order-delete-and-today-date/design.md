## Context

The Orders screen already opens a responsive detail panel and routes create, status, and payment mutations through separate local and Supabase-backed boundaries. The persisted manual-order adapter reads orders, order items, and generated production tasks from Supabase; the database already grants authenticated bakery members delete access to orders and defines cascading foreign keys from orders to order items and production tasks. The new-order modal currently initializes pickup date with a fixed fixture value rather than the user's current local date.

This change is part of F6 Orders and Payments and depends on the bakery-scoped B5 order boundary and B8 generated-task lifecycle. The active staging-repair, persistence, workflow-clarity, status-transition, and payment changes remain owners of their existing behavior.

## Goals / Non-Goals

**Goals:**

- Give an authorized bakery member a discoverable delete action after opening an order.
- Make deletion explicit, accessible, bakery-scoped, and reflected in the authoritative order/task projection.
- Preserve local-adapter behavior while adding the same user-visible contract to persisted Supabase workspaces.
- Derive the new-order pickup-date default from the current local calendar date whenever the modal is opened.
- Keep an intentionally edited pickup date unchanged and use the final selected date for persistence and task generation.

**Non-Goals:**

- No deletion of customers, recipes, invoices, or the bakery itself.
- No change to order lifecycle rules, payment rules, or completed-order history semantics beyond making the existing order removable.
- No forced overwrite of a date that a baker intentionally changes.
- No service-role access, broad cross-bakery query, or new custom backend.
- No schema migration unless verification proves the existing direct-delete and cascade contract is insufficient.

## Decisions

### 1. Use the existing order-detail action boundary

Add `Delete order` to the existing order detail panel and protect it with the shared Radix alert-dialog primitives. The dialog names the customer/order and offers Cancel and Delete order actions. This keeps the destructive action close to the selected order and gives keyboard and screen-reader users a clear confirmation path.

Alternative considered: browser `window.confirm`. Rejected because it cannot provide the app's loading/error state or a consistent accessible experience.

### 2. Add a first-class delete operation to both order paths

Extend the order/domain result types and workspace callbacks with a delete operation. The local adapter removes the order, its item rows, and its generated tasks from the bakery snapshot atomically in memory. The Supabase manual-order service performs a bakery- and order-id-scoped delete on `orders`, requests the deleted identifier, and reloads the complete manual snapshot. Existing foreign-key cascades remove dependent order items and generated production tasks. If direct deletion cannot return an authoritative result under hosted RLS, execution must add a narrowly scoped migration/RPC and its security tests before rollout.

Alternative considered: soft-cancel the order through the status transition. Rejected because the request is a true delete feature and cancelled records are intentionally retained by the Orders secondary filters.

### 3. Close detail only after authoritative deletion

The Orders screen keeps the selected detail and queue unchanged while deletion is pending. On success it consumes the refreshed orders/tasks projection, clears the selection, and returns to the queue. On failure it keeps the detail open and shows a retryable message without claiming deletion.

### 4. Generate today's date using local calendar parts

Add a small date-key helper that formats `new Date()` from local year, month, and day parts as `YYYY-MM-DD`. Initialize `AddOrderModal` state from that helper when the modal mounts. This avoids the UTC conversion edge case where `toISOString().slice(0, 10)` can show yesterday for users west of UTC. The final selected value continues through the existing create input and production-plan generation.

Alternative considered: a module-level constant or hard-coded fixture date. Rejected because it becomes stale across days and can leak test data into production behavior.

### 5. Verify local and hosted behavior separately

Focused unit/component tests cover date rollover, deletion confirmation, pending/error behavior, local adapter state, and persisted adapter query scoping. Browser coverage creates or selects an order, deletes it after confirmation, verifies it disappears, reloads, and opens the new-order form to verify today's date. Hosted verification must use the authenticated staging bakery and must not use production tenant data.

## Risks / Trade-offs

- [Risk] A direct delete could be blocked by a dependent table or hosted RLS policy. → Verify the migration constraints, grants, and delete response locally and in staging; add only a bakery-scoped RPC/migration if evidence requires it.
- [Risk] A user could delete an order accidentally. → Require an explicit alert-dialog confirmation and make the action text unambiguous.
- [Risk] The local and persisted adapters could diverge after deletion. → Return/consume a complete refreshed snapshot from both paths and assert that the order and generated tasks are absent.
- [Risk] Date formatting could regress around midnight or timezone boundaries. → Test local date-part formatting with fake system times on both sides of UTC midnight and keep the user's selected value editable.

## Migration Plan

1. Implement the domain/UI changes and focused tests.
2. Run typecheck, lint, Vitest, build, and affected Playwright coverage.
3. Run local Supabase reset/RLS verification if the implementation adds or changes database behavior.
4. Deploy the frontend and any migration/RPC through the existing staging workflow.
5. Run authenticated staging delete, reload, and today's-date acceptance checks.
6. If hosted deletion fails before the UI can confirm success, stop and capture the RLS/constraint evidence before adding schema work.

Rollback is the prior frontend deployment plus reverting the delete migration/RPC only if one was added and no dependent data has been deleted by the new feature. Deleted orders are intentionally destructive and are not recoverable by the UI.

## Open Questions

- Should deletion remain available for completed orders, or should completed history require a separate archive workflow? The current plan keeps it available for all orders visible in detail unless product direction narrows the scope before execution.
