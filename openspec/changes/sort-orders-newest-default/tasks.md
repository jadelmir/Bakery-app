# Tasks: Sort Orders Newest First by Default

- [ ] 1.1 Extend persisted/manual order row and snapshot types to include `created_at` / `createdAt` without changing the database schema.
- [ ] 1.2 Propagate the authoritative order creation timestamp into the UI `Order` model and the `BakeryWorkspace` persisted-order mapping.
- [ ] 2.1 Replace the Orders presentation default pickup-ascending sort with newest-created-first ordering while preserving stable fallback behavior for equal/missing timestamps.
- [ ] 2.2 Keep pickup date parsing, urgency labels, current/completed/status filtering, search, payment filtering, and product filtering unchanged.
- [ ] 3.1 Add focused unit/component coverage proving newest-first default ordering and filtered newest-first ordering.
- [ ] 3.2 Add coverage for equal/missing/invalid `createdAt` values so fallback ordering is deterministic and does not infer recency from pickup dates or IDs.
- [ ] 4.1 Run typecheck, lint, focused/full tests, and production build. Manually confirm the Orders page shows a newly created order above older orders before archive.
