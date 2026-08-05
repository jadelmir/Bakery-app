## Why

The Orders detail panel shows an outstanding balance but gives bakery staff no
way to record that the customer has paid. Staff need a quick, reliable action
at pickup so the order and queue immediately reflect that no balance remains.

## What Changes

- Add a `Mark as Paid` action to the payment summary for orders with a balance.
- Persist the full outstanding balance for both local and Supabase-backed
  manual orders, deriving the resulting `paid` payment status.
- Refresh the order from the authoritative mutation result and expose pending,
  success, and retryable failure feedback.
- Hide the action when an order is already paid in full.
- Keep invoice payment-entry, partial payments, refunds, and undoing a payment
  out of scope; those remain in the invoicing workflow.

## Capabilities

### New Capabilities

- `order-payment-status`: Bakery-scoped full-balance payment recording from the
  Orders detail panel.

### Modified Capabilities

- None.

## Impact

- F6 Orders and Payments; depends on B5 persisted orders and tenant isolation.
- Affects the Orders detail UI, domain order mutation port/state, local adapter,
  Supabase manual-order service, and bakery-scoped database mutation contract.
- Requires a committed migration and regenerated database types if the RPC
  signature is represented in generated types.
- Overlaps active manual-order persistence only at its established adapter
  boundary; this change owns the new payment mutation and does not alter order
  creation or lifecycle-transition behavior.
- Hosted deployment remains out of scope; local migration and automated
  verification are required before manual authenticated acceptance.
