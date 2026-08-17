## Why

Bakers need to remove an order from the workflow when it was entered by mistake or is no longer needed, but the current order detail has no delete action. New manual orders also open with a stale hard-coded pickup date, which can create incorrect production scheduling and misleading order information. This change makes order creation safer for day-to-day use and gives bakers a deliberate way to remove an order.

## What Changes

- Add a delete action to the order detail view opened from an order card.
- Require explicit confirmation before deleting an order and show pending, success, and failure states.
- Delete the order through the domain/service boundary for both local and Supabase-backed workspaces.
- Ensure persisted deletion is bakery-scoped and removes dependent order items and generated production tasks through the existing relational contract.
- Default the new-order pickup date to the current local calendar date whenever the form opens; preserve a baker-selected date if they intentionally change it.
- Add focused unit/component coverage and an authenticated browser journey for delete and today's-date behavior.

## Capabilities

### New Capabilities

- `order-deletion`: Safe, confirmed deletion of an order from its detail view, including authoritative list/task refresh and bakery isolation.
- `order-creation-defaults`: Creation-form defaults that derive the pickup date from the current local calendar date instead of a fixed fixture date.

### Modified Capabilities

- None. Existing persistence and order-workflow requirements remain intact; this change adds the missing deletion and defaulting behaviors without changing their ownership.

## Impact

- Product phase: F6 Orders and Payments, with B5 Customers and Orders and B8 Task Lifecycle and Regeneration dependencies.
- Frontend: `OrdersScreen`, order detail actions, `AddOrderModal`, `BakeryWorkspace`, domain types/state, local adapter, and the Supabase manual-order adapter.
- Backend: a committed Supabase migration or RPC for bakery-scoped order deletion if direct mutation cannot safely preserve the dependent-record contract; no service-role or browser secret changes.
- Verification: focused Vitest coverage, typecheck/lint/build, and authenticated desktop/mobile browser coverage for delete confirmation, disappearance, reload behavior, and the current-date default.
- Ownership: this change owns order deletion and creation-date defaults. It coordinates with active order changes such as `repair-staging-order-and-invitations`, `persist-manual-orders`, `clarify-orders-workflow-ui`, `add-manual-order-status-transitions`, and `mark-order-balance-paid` without duplicating their scopes.
