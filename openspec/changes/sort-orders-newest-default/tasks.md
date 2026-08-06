# Tasks: Sort Orders Newest First by Default

- [x] 1.1 Extend persisted/manual order row and snapshot types to include `created_at` / `createdAt` without changing the database schema.
- [x] 1.2 Propagate the authoritative order creation timestamp into the UI `Order` model and the `BakeryWorkspace` persisted-order mapping.
- [x] 2.1 Replace the Orders presentation default pickup-ascending sort with newest-created-first ordering while preserving stable fallback behavior for equal/missing timestamps.
- [x] 2.2 Keep pickup date parsing, urgency labels, current/completed/status filtering, search, payment filtering, and product filtering unchanged.
- [x] 3.1 Add focused unit/component coverage proving newest-first default ordering and filtered newest-first ordering.
- [x] 3.2 Add coverage for equal/missing/invalid `createdAt` values so fallback ordering is deterministic and does not infer recency from pickup dates or IDs.
- [ ] 4.1 Run typecheck, lint, focused/full tests, and production build. Manually confirm the Orders page shows a newly created order above older orders before archive.

## Implementation Evidence

- Persisted manual orders now select `created_at` and carry it through `ManualOrderSummary.createdAt` into the app-level `Order.createdAt` field.
- Local/manual test orders created in the workspace receive `createdAt` at creation time.
- `selectPresentedOrders` now sorts filtered results with `sortOrdersByNewest`, descending by valid creation timestamp and stable for equal/missing/invalid timestamps.
- Pickup parsing and the explicit `sortOrdersByPickup` helper remain available and unchanged for pickup-specific behavior.
- Verification task 4.1 remains intentionally open until local/CI commands and browser acceptance are completed.
