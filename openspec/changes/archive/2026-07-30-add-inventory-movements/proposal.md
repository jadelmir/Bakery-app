# Proposal: Add Automated Real-Time Inventory Movements & Deductions (Phase F9 / B10)

## Motivation

Bakers need accurate, real-time inventory tracking to prevent running out of critical ingredients like flour, starter, yeast, or packaging bags during peak baking shifts.

Currently, inventory levels are static. This change automates real-time ingredient deductions whenever production tasks are completed, enables manual restock transactions, and provides an actionable Shopping & Supplies List for supplier ordering.

## Scope

1. **Domain & Local Adapter Layer (`types.ts`, `localAdapter.ts`, `planning.ts`)**:
   - Extend `DomainInventoryTransaction` and add domain commands `restockInventory` and `adjustInventory`.
   - Automatically record `task-completed` inventory transactions when production tasks transition to `completed`.
   - Update `inventoryItems` on-hand quantities dynamically based on transaction history.
2. **Restock & Stock Adjustment UI (`InventoryAdjustModal.tsx`, `InventoryScreen.tsx`)**:
   - Restock/Adjust modal allowing bakers to log inventory arrivals (e.g. +25kg flour) or adjust count after physical audit.
3. **Smart Shopping List & Export (`ShoppingListDrawer.tsx`)**:
   - Drawer/modal displaying ingredients below reorder thresholds (`onHand < minLevel` or `shortage > 0`).
   - One-click CSV export and print view for supplier purchasing.
4. **Verification**:
   - Vitest unit tests in `planning.test.ts` and `localAdapter.test.ts`.
   - Playwright E2E browser tests verifying automated task completion deductions and restock flow.
