# Tasks - Add Automated Real-Time Inventory Movements & Deductions

## 1. Domain & Adapter Layer

- [x] 1.1 Extend `types.ts` with `RestockInventoryInput`, `AdjustInventoryInput`, `InventoryResult`, and new `DomainOperation` entries
- [x] 1.2 Implement automatic inventory deductions in `localAdapter.ts` upon `updateTask` completion status transition
- [x] 1.3 Implement `restockInventory` and `adjustInventory` adapter commands recording `DomainInventoryTransaction` records
- [x] 1.4 Implement `formatShoppingListCsv` in `planning.ts` for CSV export formatting
- [x] 1.5 Write unit tests verifying task deductions, restock transactions, and CSV export formatting in `planning.test.ts` & `localAdapter.test.ts`

## 2. Frontend UI Components

- [x] 2.1 Build `InventoryAdjustModal.tsx` for logging ingredient restocks and stock count adjustments
- [x] 2.2 Build `ShoppingListDrawer.tsx` for reviewing low stock/shortages and downloading CSV shopping list
- [x] 2.3 Wire restock modal and shopping list drawer in `App.tsx` / `InventoryScreen` with header shortage counter badge
- [x] 2.4 Run unit tests and typecheck verification (`pnpm run typecheck && pnpm run test`)
- [x] 2.5 Run Playwright E2E verification across mobile & desktop viewports (`npx playwright test`) to verify 100% test pass rate.
