## 1. Inventory data model and persistence

- [ ] 1.1 Reconcile the legacy inventory movement tables into an additive
  bakery-scoped ledger model supporting ingredients, packaging, finished goods,
  base units, package receiving, source keys, actors, costs, reservations, and
  allocations.
- [ ] 1.2 Add transactional database functions or RPCs for receiving stock,
  physical-count adjustments, prep-day reservations, packaging-checkpoint usage,
  finished-good output, and reservation fulfillment.
- [ ] 1.3 Add RLS, idempotency constraints, indexes, and migration/backfill
  coverage; regenerate database types and run local database lint plus pgTAP
  success/denial tests.

## 2. Domain contracts and adapters

- [ ] 2.1 Expand domain item, transaction, reservation, finished-good, and
  finance types and commands without breaking existing recipe/order/task
  contracts.
- [ ] 2.2 Apply authoritative inventory items and transactions to domain state
  after successful mutations, including loading persisted inventory snapshots.
- [ ] 2.3 Implement local-adapter receiving, reservation, packaging usage,
  output, allocation, negative-stock, and idempotency behavior with focused
  tests.
- [ ] 2.4 Implement the Supabase inventory adapter/RPC client and compose it
  with the authenticated bakery workspace adapter, with adapter contract tests.

## 3. Inventory user experience

- [ ] 3.1 Replace the read-only inventory list with item categories, on-hand,
  reserved, available, required, shortage, and finished-good allocation views.
- [ ] 3.2 Add receive-purchase, physical-count, and relative-adjustment flows
  with base-unit conversion, validation, pending/error/success states, and
  append-only history presentation.
- [ ] 3.3 Update shopping-list and shortage explanations to use available stock
  after reservations and show whether a shortage is caused by demand or a
  minimum-level rule.
- [ ] 3.4 Add focused UI tests for receiving, count adjustments, reservation
  display, negative stock warnings, finished-good allocation, and retry-safe
  mutation feedback.

## 4. Production and finance integration

- [ ] 4.1 Wire prep-day reservation creation and final packaging checkpoint
  mutations into the production/task flow without duplicating existing task
  completion behavior.
- [ ] 4.2 Create finished-good output automatically at packaging completion and
  distinguish made-to-order allocated output from made-ahead available stock.
- [ ] 4.3 Add shared finance selectors and UI measures for purchase spend,
  inventory value, consumed product cost, and gross profit without double
  counting.
- [ ] 4.4 Integrate shared workspace surfaces only after active
  `persist-customer-directory` ownership is released; preserve existing order,
  customer, production, and workspace behavior.

## 5. Browser and product verification

- [ ] 5.1 Add desktop/mobile Playwright coverage for receiving stock, viewing
  reservations and shortages, completing packaging, seeing finished-good
  output, and confirming finance totals.
- [ ] 5.2 Manually verify the authenticated bakery journey with multiple members,
  a made-to-order item, a made-ahead item, a negative-stock warning, and a
  retry of the same packaging completion.

## 6. Integration and lifecycle evidence

- [ ] 6.1 Run typecheck, lint, full Vitest, production build, database rebuild/
  lint/security checks, and affected/full Playwright coverage.
- [ ] 6.2 Record evidence, synchronize deltas into the owning main specs only
  after verification, update `PROGRAM_MAP.md`, and leave archive readiness
  blocked until manual acceptance is confirmed.
