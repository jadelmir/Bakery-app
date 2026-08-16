## Why

The Inventory page currently shows mock or read-only stock information even
though the domain layer already contains partial ingredient, restock, and
adjustment behavior. Recipe creation also falls back to hardcoded sample items
such as Organic Flour instead of using the active bakery's inventory. The
bakery needs one trustworthy, simple inventory workflow that is divided into
Ingredients and Retail supplies and is easy to extend while still feeding
production planning and financial reporting.

## What Changes

- Replace the read-only inventory view with a persisted, bakery-scoped inventory
  workflow with two simple user-facing sections: Ingredients and Retail
  supplies.
- Let members add an inventory item with a small form and use the same flow
  from recipe creation when a needed item does not exist.
- Let members open an existing inventory item directly from its card to edit
  its details or record stock without searching from a separate inventory
  entry flow.
- Let members remove an existing item from active inventory from that same
  item view, while preserving its stock and purchase history.
- Capture each item's typical package quantity and package price so inventory
  can calculate a base-unit cost, such as 10,000 g of flour for $17.
- Make recipe ingredient rows start empty and reference real inventory items;
  never silently insert hardcoded sample items.
- Support package receiving with base-unit conversion, physical-count
  adjustments, and an append-only inventory ledger.
- Reserve requirements at the beginning of an order's prep day without reducing
  physical on-hand stock.
- Deduct raw ingredients and retail supplies when the configured final
  packaging task is completed, with idempotent protection.
- Create finished-good stock when the final packaging task completes, allocating
  made-to-order output to its order and leaving made-ahead output available.
- Show on-hand, reserved, available, required, shortage, and finished-good
  allocation states in Inventory and Shopping List views.
- Connect purchase cash spend and consumed product cost to Finances without
  double-counting purchases as cost of goods sold.
- Reconcile the overlapping inventory database models and connect authenticated
  inventory operations to Supabase with bakery-member RLS.

## Capabilities

### New Capabilities

None. This change extends the existing ingredient, inventory-requirements, and
reporting capabilities.

### Modified Capabilities

- `ingredients-and-stock-entry`: add item categories, package receiving,
  base-unit conversion, physical counts, append-only inventory events, and
  recipe-linked item creation.
- `inventory-requirements-management`: add prep-day reservations, available
  versus on-hand balances, finished-good output/allocation, and idempotent
  production usage.
- `bakery-reporting`: add purchase cash spend, inventory value, and consumed
  product cost to financial reporting.

## Impact

- Frontend inventory screens, simple item-creation and stock-entry dialogs,
  recipe ingredient selection, shopping-list presentation, domain state
  commands, task-completion integration, and finance reporting.
- Supabase inventory schema, migrations, generated database types, RLS, and a
  persisted inventory adapter or RPC boundary.
- Existing recipes, production tasks, orders, and bakery-scoped workspace state.
- Product phases F3, F9, F11 and backend phases B3, B10, B11. The change depends
  on existing recipe, order, production-task, workspace, and authentication
  contracts.
- The active `persist-customer-directory` change also owns parts of
  `BakeryWorkspace.tsx`; integration work touching that shared surface must be
  serialized rather than duplicated.

Non-goals are supplier management, invoice scanning, lot/expiry/FIFO tracking,
multi-location transfers, and a full accounting system. Finished goods may be
created by production output, but they are not a manual category in the basic
inventory add-item flow.
