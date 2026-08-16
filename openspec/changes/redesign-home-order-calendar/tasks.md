## 1. Persisted Home order projection

- [x] 1.1 Add a Home order-calendar selector that reads the active bakery snapshot, applies the today-through-six-days horizon in the bakery timezone, excludes completed/cancelled orders, sorts day groups, and aggregates repeated products; cover Requirements 1 and 2 with focused selector tests.
- [x] 1.2 Add selector/read-model coverage for customer contact, address, fulfillment, payment, balance, notes, and incomplete customer fields without cross-bakery or fixture fallback; cover Requirement 3 and the persisted-data boundary in Requirement 4.
- [x] 1.3 Verify the Home projection recomputes from the committed shared snapshot after order creation and lifecycle changes; cover Requirement 6 with state/selector tests and preserve ownership of the active order-persistence and status changes.

## 2. Home order-calendar interface

- [x] 2.1 Create the responsive day-group and order-card components using the existing warm bakery visual language, showing day counts and compact aggregated product summaries while omitting empty days; cover Requirements 1, 2, and 5.
- [x] 2.2 Integrate the order calendar as the primary Home section without removing the existing task, alert, balance, starter, metrics, storefront, or New Order features; update Home component tests for ordering and coexistence; cover Requirement 5.
- [x] 2.3 Add the accessible order detail side panel using the existing Sheet primitive, including customer contact/address, fulfillment details, products, status, payment, balance, notes, close behavior, and a path to the existing full order view when supported; cover Requirement 3.
- [x] 2.4 Add loading and no-active-orders states that keep New Order available and prevent static fixture orders from appearing when the persisted snapshot is loading or ready-but-empty; cover Requirement 4.
- [x] 2.5 Remove hardcoded Home metrics, alerts, task counts, starter details, storefront identifiers, and preparation items; derive them from the active snapshot or show explicit empty states, with focused Home coverage.

## 3. Journey verification

- [ ] 3.1 Add desktop and mobile Playwright coverage for the today-first day groups, active-order filtering, omitted empty days, order-card selection, side-panel details, close behavior, and persisted order updates; cover Requirements 1–6.
- [x] 3.2 Run the focused Home/selector tests and the frontend baseline (`pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`), recording any unrelated pre-existing failures rather than changing out-of-scope code.

## 4. Traceability and handoff

- [x] 4.1 Update `openspec/PROGRAM_MAP.md` with the proposed `home-order-calendar` capability under Frontend Phase 10, its F1/F6/F8/F9 dependencies, and this change as the sole owner; do not alter active order-persistence/status ownership rows.
- [x] 4.2 Review the implemented result against the proposal, design, and all Home Order Calendar scenarios; record focused evidence before marking any task complete and leave hosted rollout/database migration status explicitly out of scope.

## Evidence

- Selector/component tests: 3 files, 8 tests passed. Coverage includes the seven-day today-first projection, active-order filtering, repeated-product aggregation, customer/contact/address data, balance/notes, incomplete customer details, snapshot-backed Home metrics/prep, loading/empty states, side-panel open/close, and committed-snapshot reprojection.
- Frontend checks: direct local TypeScript check passed, lint passed, production build passed. The full Vitest baseline still has unrelated failures in existing App, Orders, and Production expectations; the new Home tests pass and those user-scope changes were preserved.
- Browser check: the Home route passed on desktop and mobile (2/2), including no-active-order behavior and continued New Order availability. Full persisted-order browser interaction remains covered by the focused component suite because the existing mock-auth browser harness resets when its fixture clock is changed.
- No database migration or hosted rollout was performed; the implementation consumes the existing bakery snapshot and existing order detail destination.
