# Proposal - Replace Application Hardcoded Placeholders & Bind Live Database Names (Phase F12 / Quality Polish)

## Why

Currently, several user-facing screens (`HomeScreen`, `MoreScreen`, `InventoryScreen`, `FinancesScreen`, and navigation banners) display hardcoded static strings, mock names ("Earl's Bakery", "Reed Family", "Priya Nair", "James Okonkwo", starter "Earl"), hardcoded dates ("July 29"), and fixed constants (`TASKS`, `ORDERS`) instead of dynamically deriving customer names, bakery storefront names, starter build names, user profiles, and active orders directly from the database/domain snapshot.

Replacing all static placeholders with live database-driven entities and dynamic state selectors ensures complete data integrity, multi-bakery workspace isolation, and a production-grade user experience.

## What Changes

- **Live Database Entity Binding (`Front-end/src/app/App.tsx` & `state/selectors.ts`)**:
  - Bind `HomeScreen` task lists and order queues to active snapshot domain records (`snapshot.tasksById`, `snapshot.ordersById`) instead of static mock constants (`TASKS`, `ORDERS`).
  - Bind storefront links dynamically (`/store/${storefront.slug}`) using live database storefront record.
  - Dynamically format unpaid balance alerts with real customer names and unpaid balances computed from database invoices/orders.
  - Dynamically bind starter names and feeding alerts from database starter build profiles.
  - Dynamically display active user email and profile name from Supabase Auth session.
- **Domain State Selectors (`Front-end/src/app/state/selectors.ts`)**:
  - Add dynamic selectors: `selectActiveOrders`, `selectLowStockItems`, `selectUnpaidCustomerSummary`, `selectActiveStarterName`, `selectFormattedCurrentDate`.
- **HomeScreen & MoreScreen Polish (`Front-end/src/app/App.tsx`)**:
  - Replace static date headers ("July 29", "Tuesday") with live localized date formatting.
  - Replace static menu subtitles in `MoreScreen` with real-time database counts (low stock count, customer count, unpaid total, active starter name).

## Capabilities

### New Capabilities
- `frontend-quality-polish`: Dynamic calculation and replacement of all UI placeholders, hardcoded names, and mock metrics with live database entities and state selectors.

## Impact
- **UI Components**: `Front-end/src/app/App.tsx`, `HomeScreen`, `MoreScreen`, `state/selectors.ts`.
- **Database & Domain Integration**: Leverages existing `BakeryDomainSnapshot` and Supabase Auth session without breaking schema contracts.
- **Verification**: TypeScript typecheck, Vitest unit suite, and Playwright E2E browser tests.
