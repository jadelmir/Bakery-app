## Why

The Inventory page currently shows mock or read-only stock information even
though the domain layer already contains partial ingredient, restock, and
adjustment behavior. The bakery needs one trustworthy inventory workflow that
covers ingredients, retail supplies, and finished goods while feeding both
production planning and financial reporting.

## What Changes

- Replace the read-only inventory view with a persisted, bakery-scoped inventory
  workflow for raw ingredients, retail supplies, and finished goods.
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
  base-unit conversion, physical counts, and append-only inventory events.
- `inventory-requirements-management`: add prep-day reservations, available
  versus on-hand balances, finished-good output/allocation, and idempotent
  production usage.
- `bakery-reporting`: add purchase cash spend, inventory value, and consumed
  product cost to financial reporting.

## Impact

- Frontend inventory screens, stock-entry dialogs, shopping-list presentation,
  domain state commands, task-completion integration, and finance reporting.
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
multi-location transfers, and a full accounting system.
