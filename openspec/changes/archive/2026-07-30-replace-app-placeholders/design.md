# Design - Replace Application Hardcoded Placeholders & Bind Live Database Names (Phase F12 / Quality Polish)

## Context

The Bakery App supports multi-tenant workspaces, dynamic customer profiles, invoices, online storefronts, and production tasks. However, certain UI components currently fall back to hardcoded names ("Earl's Bakery", "Reed Family", "Priya Nair", "James Okonkwo", starter "Earl") or static array constants (`TASKS`, `ORDERS`).

To ensure that every name displayed across the app comes directly from the database/domain snapshot, we will bind UI components to state selectors and domain models.

## Design Decisions

1. **Database Entity Binding**:
   - **Bakery Storefront Name & Slug**: Derive storefront URL dynamically (`/store/${storefront?.slug}`) and title from `activeMembership?.bakeryName` or `storefront?.name`.
   - **Unpaid Customer Breakdown**: Generate unpaid balance alert text dynamically by querying database invoices/orders for actual customer names and unpaid amounts (e.g. `${customer.name} $${unpaidAmount}`).
   - **Starter Build Name**: Retrieve active starter name dynamically from `snapshot.starterBuilds` or inventory starter item (`"Earl (Sourdough Starter)"` or user's custom starter name).
   - **User Profile Name & Role**: Display active Supabase Auth user metadata / email and membership role in headers and settings.
   - **Production Tasks & Orders**: Replace hardcoded `TASKS` / `ORDERS` on `HomeScreen` with live arrays from `snapshot.tasksById` and `snapshot.ordersById`.

2. **Live Date Formatting**:
   - Use `Intl.DateTimeFormat` / `toLocaleDateString()` for live current weekday and month/day header.

3. **State Selector Enhancements (`Front-end/src/app/state/selectors.ts`)**:
   - `selectLowStockCount(snapshot)`: Returns count of inventory items <= parLevel.
   - `selectActiveCustomerCount(snapshot)`: Returns total non-archived customers.
   - `selectUnpaidCustomerSummary(snapshot)`: Returns top unpaid customers with dollar amounts.
   - `selectActiveStarterInfo(snapshot)`: Returns name and feeding schedule for active starter.

4. **Zero API / Schema Disruptions**:
   - All changes are presentation and state selector bindings. Database schemas and RLS policies remain unchanged.
