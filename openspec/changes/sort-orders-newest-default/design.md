# Design: Sort Orders Newest First by Default

## Current Behavior

`selectPresentedOrders()` filters orders and then calls `sortOrdersByPickup()`, which sorts pickup date/time ascending. The UI `Order` type currently has no creation timestamp.

## Design

1. Extend the UI/persisted order contract with an optional `createdAt` timestamp.
2. Update the Supabase manual-order snapshot query to select `created_at` and map it onto the order model.
3. Propagate `createdAt` through `BakeryWorkspace` when persisted orders are mapped into the UI `Order` shape.
4. Replace the default presentation sort with a newest-created-first comparator:
   - valid `createdAt`: descending timestamp;
   - equal timestamps: preserve original input order;
   - missing/invalid timestamps: place after timestamped orders and preserve stable input order.
5. Leave pickup parsing and urgency calculations unchanged; they remain presentation metadata, not default queue ordering.

## Fixture / Local Mode

For local fixture orders that do not yet have authoritative creation timestamps, preserve deterministic stable input order rather than manufacturing timestamps. If fixture data already contains or can safely add explicit `createdAt` values, tests may use those values to exercise sorting.

## Compatibility

No database schema change is expected because the persisted `orders` table already records `created_at`. This change is a read-contract and presentation-order change only.
