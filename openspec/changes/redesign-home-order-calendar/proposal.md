## Why

The current Home screen is a dense command center that makes the most important near-term question—what orders are coming up—hard to scan. This change gives bakers a calm, order-first view of today and the immediate upcoming days while keeping the existing operational features available below it.

This is a Frontend Phase 10 Dashboard and Notifications change. It depends on the shared application foundation and the persisted order/status capabilities delivered by `persist-manual-orders`, `add-manual-order-status-transitions`, and `clarify-orders-workflow-ui`; this change owns the Home projection and does not duplicate those changes.

## What Changes

- Redesign Home around a responsive, day-grouped order calendar focused on today and the next six calendar days.
- Show only active, non-cancelled orders, grouped by pickup/fulfillment day; days with no qualifying orders are omitted.
- Show a compact summary card for each day and simple order cards with aggregated product quantities, such as `5 Focaccia · 3 Loaves`.
- Open a right-side detail panel when an order card is selected, including the full order, customer contact information, address, fulfillment details, status, and payment information.
- Drive the Home order calendar from the active bakery's shared persisted order snapshot and update it after order mutations without a refresh.
- Keep the current Home secondary features—tasks, alerts, balances, starter information, metrics, storefront status, and New Order—available while making the order calendar the primary content; every displayed value must come from the active snapshot or an explicit loading/empty state, never a prototype placeholder.
- Preserve the existing warm bakery visual language and responsive navigation conventions.
- Add focused unit/component and desktop/mobile journey coverage for day grouping, active-order filtering, detail-panel behavior, empty states, and persistence-backed rendering.

## Capabilities

### New Capabilities

- `home-order-calendar`: A persisted, today-first Home view that summarizes active orders by day and exposes order details in a side panel.

### Modified Capabilities

- None. Existing order persistence, order lifecycle, customer, and production schedule requirements remain owned by their current capabilities and active changes.

## Impact

- Frontend Home screen composition, order selectors/projections, and a new Home order-calendar/detail-panel component.
- Existing `BakeryWorkspace` snapshot and navigation wiring may be updated only as needed to provide persisted order data and panel actions.
- Frontend unit/component tests and Playwright coverage for the Home route will change.
- No new Supabase tables, migrations, RLS policies, or hosted rollout are in scope. The feature must use the active bakery's existing persisted order path and must not fall back to global or fixture data when persisted data is available.
- Durable documentation impact is limited to `openspec/PROGRAM_MAP.md` during planning; current-system docs need no update until implementation changes an implemented contract.
