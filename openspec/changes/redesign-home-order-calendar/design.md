## Context

Home currently mixes fixture-backed task state with shared-snapshot summaries and a dense set of operational widgets. The shared domain snapshot already exposes bakery-scoped orders, order items, and customers, while the active order-persistence and lifecycle changes establish the source of truth for persisted order records. The new Home experience should be a read-only projection of that source, not another order collection.

The requested experience is today-first: a baker should see the next seven calendar days anchored on today, with active orders grouped by fulfillment date. Days without active orders should not consume space. Selecting an order should reveal its practical details without forcing the user to leave Home.

## Goals / Non-Goals

**Goals:**

- Make upcoming active orders the primary Home content.
- Group persisted orders by bakery-local calendar day and aggregate item quantities for fast scanning.
- Provide an accessible responsive day-card layout and a side detail panel.
- Preserve the existing Home secondary features and warm bakery visual language.
- Keep the projection consistent with order mutations in the mounted workspace session.

**Non-Goals:**

- No new order, customer, status, payment, or production persistence behavior.
- No new Supabase tables, migrations, RLS policies, RPCs, or hosted rollout work.
- No replacement of the Production screen's task calendar or timeline.
- No full order editing workflow inside the Home detail panel.
- No redesign of the secondary Home widgets in this change.

## Decisions

1. **Use a derived Home selector rather than screen-local filtering.**
   `selectHomeOrderCalendar(snapshot, referenceDate)` will derive active orders, day groups, aggregated product quantities, and customer detail from `BakeryDomainSnapshot`. This keeps Home aligned with Orders and other consumers of the shared snapshot. A screen-local copy of order data was considered but rejected because it would drift after mutations.

2. **Use a today-first seven-day horizon.**
   The selector will include today through the sixth following calendar day, using the existing bakery timezone/date utilities. The first day is visually emphasized as Today; future days remain visible only when they contain active orders. A one-day-only view was considered, but it would not support the user's week-oriented scan or the Monday/Tuesday example.

3. **Use responsive day cards instead of a fixed seven-column calendar grid.**
   Days with orders render in a responsive CSS grid: a single column on narrow screens and two-to-three columns on larger screens. Each day card contains its count and order cards. A fixed seven-column grid was considered but rejected because customer/product details become too cramped and the design would be poor when only a few days have orders.

4. **Use the existing Sheet primitive for order details.**
   Selecting an order opens a right-side sheet on desktop and a full-height responsive sheet on smaller screens. The sheet provides an accessible title, close action, focus handling, and the customer's contact/address details. A custom fixed overlay was considered but rejected because the repository already has a shared accessible sheet primitive.

5. **Keep the calendar read-only and route mutations elsewhere.**
   The panel will show order status and payment status plus an explicit path to the existing order detail when available, but it will not introduce Home-specific mutation commands. This prevents duplicate lifecycle logic while still making the panel useful for quick context.

6. **Treat loading and empty data explicitly.**
   Home will show a loading state while the persisted snapshot is unavailable, an empty state when the ready snapshot has no qualifying orders in the horizon, and the calendar when data exists. Static fixture orders must not appear as a fallback after the persisted snapshot path is active.

7. **Make secondary Home widgets snapshot-backed.**
   Existing task, alert, balance, metric, storefront, and preparation widgets remain in place, but their counts, amounts, names, and lists are derived from the active snapshot. When the snapshot has not loaded or has no corresponding records, the widget shows zero, an empty state, or is omitted; it does not display prototype bakery values.

## Risks / Trade-offs

- **[Risk] The persisted order capability is currently an active, not-yet-archived change.** → Keep this change dependent on the shared snapshot contract, avoid schema work, and verify with a bakery-scoped persisted fixture plus a mutation-refresh journey before synchronization.
- **[Risk] A seven-day horizon can become visually tall when many orders exist.** → Keep day cards compact, aggregate products on the summary row, and let the detail sheet carry the long-form information.
- **[Risk] Local date boundaries can group an order on the wrong day.** → Reuse the established bakery timezone/date-key helpers and add a boundary test around midnight UTC.
- **[Risk] Preserving every existing widget can keep Home visually busy.** → Make the order calendar the first and largest section, keep secondary widgets below it, and defer their redesign to a separate approved change.
- **[Risk] Side-panel behavior can be awkward on small screens.** → Use the shared responsive Sheet primitive, verify keyboard close/focus behavior, and run desktop and mobile Playwright journeys.

## Migration Plan

1. Add the Home calendar selector and component tests against persisted-style snapshots.
2. Replace the current Home order-summary section with the calendar and Sheet detail panel while retaining the existing secondary sections.
3. Add responsive unit/component and Playwright coverage, then run the frontend verification baseline.
4. If verification fails, return to the affected implementation task; do not alter order persistence or introduce a compensating schema change.
5. No database migration or hosted rollout is required for this UI projection.

## Open Questions

- The product decision to show “today” is represented as a today-first seven-day horizon so the Home view still supports the original week-at-a-glance intent. If review confirms that only today's orders should render, the selector horizon can be reduced without changing the card or panel contracts.
