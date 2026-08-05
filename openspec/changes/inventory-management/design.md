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

- Track raw ingredients, retail supplies, and finished goods in one
  bakery-scoped inventory model.
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

### 2. Expand inventory item categories

The existing `kind` field will support:

- `ingredient`
- `packaging`
- `finished_good`

Finished goods are linked to a recipe/output definition. The recipe remains the
stable product identity used by orders, while inventory events identify whether
the output is allocated to an order or available for general sale.

All quantities use a canonical base unit per item (`g`, `ml`, or `unit`). A
purchase records package count, package quantity, package price, and the
resulting base quantity. UI inputs may use package units; ledger quantities
remain base units.

### 3. Separate reservation from consumption

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

### 4. Use weighted-average unit cost for current inventory value

Each purchase stores its unit cost. Current item cost uses a weighted-average
calculation for remaining inventory; historical usage events retain the cost
applied at the time of consumption. This makes current gross profit useful
when purchase prices vary without rewriting historical orders.

The alternative is latest-cost pricing, which is simpler but causes abrupt
margin changes and does not represent mixed-cost stock as well.

### 5. Treat finance integration as two views, not two expenses

Purchase events feed a `purchases`/cash-spend view. Production usage feeds COGS.
Gross profit uses revenue minus COGS, while cash reporting separately shows
purchase spend and inventory value. Purchase spend must not also be deducted
from gross profit as COGS for the same quantity.

The existing finance screen is a local prototype, so the first implementation
will add shared reporting selectors and persisted inventory-cost inputs rather
than claiming full accounting support.

### 6. Use an inventory-specific persisted adapter and atomic RPC boundary

Add a Supabase inventory adapter for snapshot loading, receiving, reservation
state, physical counts, and packaging-checkpoint mutations. Multi-row balance,
ledger, reservation, and finished-output changes will use a database function
or equivalent transaction boundary rather than independent client updates.

The local adapter will keep the same domain contract for local tests and
offline prototype journeys. `BakeryWorkspace` will compose persisted inventory
behavior with the existing local domain adapter in the same style currently
used for persisted customer records.

### 7. Make all member actions auditable

Any active bakery member may record inventory actions for now. Ledger rows are
append-only from the application and cannot be deleted. Physical count
corrections create explicit adjustment events. RLS remains bakery-scoped and
the actor is recorded for future permission tightening.

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
- Whether a recipe without an explicit finished-good inventory item should
  automatically create one from the recipe identity.
