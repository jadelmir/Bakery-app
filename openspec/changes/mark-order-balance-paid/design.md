## Context

The order detail payment summary is read-only even though manual orders already
store `amount_paid_cents` and derived `payment_status`. The application supports
both a session-local domain adapter and a Supabase-backed manual-order service,
so the action must have the same bakery-scoped, authoritative-result behavior
in both runtimes. This change follows F6 and depends on the B5 persisted-order
and B2 tenant-isolation boundaries.

## Goals / Non-Goals

**Goals:**

- Let staff settle the entire remaining order balance from order detail.
- Keep local and Supabase-backed order snapshots consistent after success.
- Prevent cross-bakery mutation and stale/double payment.
- Show pending and retryable failure feedback without optimistic payment state.

**Non-Goals:**

- Partial-payment amount entry, payment methods, refunds, payment reversal, or
  invoice ledger entries.
- Changing order lifecycle state when payment is recorded.
- Deploying the migration to a hosted Supabase project.

## Decisions

1. Add an idempotent `markOrderPaid` order-port operation rather than reusing
   invoice `recordPayment`. Manual orders do not always have an invoice, and the
   requested action is an order-balance shortcut rather than a payment-ledger
   entry. The operation records the order's full total as paid.
2. Add a bakery-scoped Supabase RPC that locks the target row, verifies bakery
   membership through the existing helper, rejects an overpaid/invalid order,
   and returns the authoritative order payment fields. A direct client update
   was considered, but an RPC keeps total-to-paid derivation atomic and prevents
   stale clients from writing an arbitrary amount.
3. The order detail owns pending/error UI. It calls the mutation, waits for the
   authoritative result, and only then updates the visible order snapshot.
4. Display `Mark as Paid` only while `paid < total`. Once settled, retain the
   existing `Paid in full` summary and remove the action.

## Risks / Trade-offs

- [Risk] This shortcut does not create an auditable invoice payment record. →
  Keep the scope explicit and direct staff needing method/reference history to
  the invoice payment workflow.
- [Risk] Repeated clicks could submit duplicate requests. → Disable the action
  while pending and make the backend result idempotent once already paid.
- [Risk] A stale selected order could show the old balance. → Return and render
  the authoritative saved order and verify the refreshed snapshot.
- [Risk] Hosted runtime lacks the new RPC until deployed. → Keep deployment out
  of scope and retain a clear actionable error until migration rollout.

## Migration Plan

1. Generate a committed migration with the Supabase CLI.
2. Add the bakery-scoped full-balance RPC and grants.
3. Rebuild the local database, regenerate database types, and test member
   success, cross-bakery denial, and repeat-call behavior.
4. Roll back by reverting application calls first; the additive RPC can remain
   safely until a later migration revokes and drops it.

## Open Questions

None. Partial payments and invoice-ledger integration remain separate future
work.
