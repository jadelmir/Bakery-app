## Context

The visible inventory route is `Front-end/src/app/screens/InventoryScreen.tsx`.
It calculates requirements and displays shortages, but its stock-entry controls
are not connected to domain commands. Older restock and shopping-list
components exist elsewhere, and the local domain adapter already has partial
create, restock, adjustment, and task-deduction behavior. The authenticated
workspace currently composes local domain data with Supabase only for customer
records, so inventory mutations are not durable.

The database also contains two overlapping movement models:
`inventory_movements` from the ingredients migration and
`inventory_transactions` from the starter/inventory migration. The PRD and
backend requirements require an append-oriented ledger, package-to-base-unit
conversion, production usage, purchase history, and financially traceable
costs. The implementation must preserve bakery tenancy and work with existing
recipes, orders, production tasks, and workspace selection.

## Goals / Non-Goals

**Goals:**

- Track raw ingredients and retail supplies in one bakery-scoped inventory
  model, with finished goods represented only when production creates output.
- Keep recipe composition linked to bakery inventory records and allow a
  missing item to be created inline.
- Receive purchased stock by package and convert it to a canonical base unit.
- Create prep-day reservations without changing physical on-hand quantity.
- Deduct raw and retail-supply usage once at the final packaging checkpoint.
- Create finished-good output at that checkpoint, allocating made-to-order
  output to its order and leaving made-ahead output available.
- Allow any bakery member to record purchases, usage, and physical-count
  adjustments while preserving an immutable event history.
- Show on-hand, reserved, available, required, shortage, and allocation values.
- Feed purchase cash spend and consumed product cost into financial reporting
  without counting the same cost twice.
- Persist inventory data and mutations through Supabase with bakery-member RLS.

**Non-Goals:**

- Supplier management, invoice or receipt scanning, lot/expiry/FIFO tracking,
  warehouse transfers, barcode scanning, or purchase-order workflows.
- Full double-entry accounting, tax reporting, payroll, or bank reconciliation.
- Automatically tracking every retail sale as a finished-good movement unless
  the existing order/pickup contract can provide a stable sale event.
- Removing or rewriting historical inventory events.

## Decisions

### 1. Use one authoritative inventory ledger

`inventory_transactions` becomes the authoritative event stream. Each event
stores bakery, item, signed quantity, event type, source reference,
idempotency/source key, unit cost where relevant, actor, and timestamp.
`ingredients.on_hand` remains a transactionally maintained cached balance for
fast reads and is reconciled against the ledger.

The legacy `inventory_movements` table will be backfilled if needed and then
stopped from receiving new writes. It will not be deleted in the first
migration. This avoids a destructive migration while removing ambiguity from
new code.

### 2. Keep the inventory entry model simple

The user-facing add-item flow will offer only two categories:

- `ingredient`
- `packaging` (shown in the UI as **Retail supplies**)

The existing `kind` field remains the storage contract so this simplification
does not require renaming persisted data. Finished goods remain linked to a
recipe/output definition and can be created by production output, but they are
not manually added from the basic inventory form.

All quantities use a canonical base unit per item (`g`, `ml`, or `unit`). A
purchase records package count, package quantity, package price, and the
resulting base quantity. UI inputs may use package units; ledger quantities
remain base units.

### 3. Make recipe creation inventory-backed

Creating a recipe starts with an empty ingredient list. Each row must reference
an item from the active bakery inventory; the editor must never fall back to
sample items such as Organic Flour. The item picker groups real inventory items
under Ingredients and Retail supplies. When the required item does not exist,
the editor opens the shared create-inventory-item form and selects the newly
created item when the form succeeds.

The shared create form asks for item name, category, base unit, typical package
quantity, package price, and an optional minimum level. It calculates a
default base-unit cost; for example, 10,000 g at $17 produces $0.0017/g.
Initial on-hand quantity starts at zero and receiving stock remains a separate
action. After a successful save, the create form closes. Existing inventory
cards open a focused item modal where members can edit those item details and
switch directly to receiving, physical-count, or relative-adjustment actions
for the selected item. A receipt may override the default price and updates
weighted-average cost.

Removing an item from the active inventory uses a confirmed soft archive. The
item is hidden from active inventory lists and pickers, while its append-only
stock and purchase history remain available for reporting and auditability.

### 4. Separate reservation from consumption

At the beginning of an order's prep day, the system creates or activates
requirements/reservations for its recipe ingredients and retail supplies. A
reservation changes `reserved`, not physical `on_hand`.

The UI calculates:

```text
available = on_hand - reserved
shortage = max(0, required - available)
```

When the final packaging task completes, the transaction boundary atomically:

1. records negative production-usage transactions for raw ingredients and
   packaging;
2. records positive production-output transactions for finished goods;
3. marks the corresponding reservation fulfilled; and
4. uses an idempotency key derived from bakery, order item, and packaging
   checkpoint so retries cannot double-deduct or double-create output.

If an order is cancelled before consumption, its reservation is released. If
stock is insufficient, completion remains allowed, on-hand may go negative,
and the workspace shows a clear shortage warning.

### 5. Use weighted-average unit cost for current inventory value

Each purchase stores its unit cost. Current item cost uses a weighted-average
calculation for remaining inventory; historical usage events retain the cost
applied at the time of consumption. This makes current gross profit useful
when purchase prices vary without rewriting historical orders.

The alternative is latest-cost pricing, which is simpler but causes abrupt
margin changes and does not represent mixed-cost stock as well.

### 6. Treat finance integration as two views, not two expenses

Purchase events feed a `purchases`/cash-spend view. Production usage feeds COGS.
Gross profit uses revenue minus COGS, while cash reporting separately shows
purchase spend and inventory value. Purchase spend must not also be deducted
from gross profit as COGS for the same quantity.

The existing finance screen is a local prototype, so the first implementation
will add shared reporting selectors and persisted inventory-cost inputs rather
than claiming full accounting support.

### 7. Use an inventory-specific persisted adapter and atomic RPC boundary

Add a Supabase inventory adapter for snapshot loading, receiving, reservation
state, physical counts, and packaging-checkpoint mutations. Multi-row balance,
ledger, reservation, and finished-output changes will use a database function
or equivalent transaction boundary rather than independent client updates.

The local adapter will keep the same domain contract for local tests and
offline prototype journeys. `BakeryWorkspace` will compose persisted inventory
behavior with the existing local domain adapter in the same style currently
used for persisted customer records.

### 8. Make all member actions auditable

Any active bakery member may record inventory actions for now. Ledger rows are
append-only from the application and cannot be deleted. Physical count
corrections create explicit adjustment events. RLS remains bakery-scoped and
the actor is recorded for future permission tightening.

### 9. Preserve history when removing active items

Inventory item deletion is an archive operation rather than a physical row
delete. This preserves foreign-key references from ledger history and recipes,
and keeps historical costs and stock events auditable. The UI requires an
explicit confirmation before archiving the item.

## Risks / Trade-offs

- **[Risk]** Existing deployments may contain records in both movement tables.
  **Mitigation:** backfill/reconcile once, make `inventory_transactions` the
  sole new write path, and verify counts before release.
- **[Risk]** Prep-day reservations may become stale after order edits or
  cancellations. **Mitigation:** recompute or release reservations on order
  changes and expose reservation status in the ledger.
- **[Risk]** A final packaging task may be missing or repeated.
  **Mitigation:** identify the enabled packaging checkpoint with a deterministic
  fallback and enforce a unique idempotency key per order item/checkpoint.
- **[Risk]** Finished-good output may be mistaken for available stock when it is
  promised to an order. **Mitigation:** store allocation metadata and subtract
  allocated output from available finished goods.
- **[Risk]** Purchase spend and COGS may be double-counted in Finance.
  **Mitigation:** keep separate purchase and COGS selectors and add explicit
  reconciliation tests.
- **[Risk]** Allowing every member to adjust stock increases operational risk.
  **Mitigation:** preserve actor/time/reason, prohibit deletes, and leave role
  restrictions as a later policy change.

## Migration Plan

1. Add an additive migration for item categories, canonical units, purchase
   metadata, reservation fields, event types, idempotency constraints, and
   finance-cost fields.
2. Backfill compatible legacy records into the authoritative transaction model;
   retain legacy tables for rollback/read compatibility.
3. Add RLS and atomic inventory RPCs, then regenerate database types.
4. Implement local and Supabase adapters behind the existing domain ports.
5. Wire the Inventory screen, production checkpoint, shopping list, and Finance
   selectors to authoritative results.
6. Verify from a clean local database and with existing synthetic fixtures.
7. Roll back by disabling the new UI write path and retaining the additive
   migration; do not delete ledger history during rollback.

## Open Questions

- Whether an order pickup should decrement allocated finished goods in the first
  release, or whether packaging completion is sufficient for the initial
  finished-good workflow.
- Whether production should automatically create a finished-good inventory
  record from the recipe identity when output is recorded.
