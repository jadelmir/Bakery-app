## Why

In an authenticated bakery workspace, creating a recipe currently updates only the in-memory domain adapter. The reload path restores persisted customers, inventory, and production flows but does not load recipes, so a recipe disappears immediately after a refresh and cannot be used reliably in later orders. This corrective change closes the missing persistence boundary for the existing recipe-management capability.

## What Changes

- Add a bakery-scoped Supabase recipe adapter that loads the active bakery's recipes and persists recipe creation and updates.
- Map persisted recipe prices and batch costs between database cents and the domain's dollar values, preserving nullable production-flow assignments.
- Wire the authenticated workspace load and recipe mutation callbacks to the persisted recipe adapter instead of the session-local fallback.
- Preserve the existing local/fixture adapter behavior for test and mock-backend mode.
- Add focused adapter, workspace/domain-load, and recipe journey coverage proving a newly created recipe survives reload and remains isolated to its bakery.
- Verify the existing recipe RLS boundary and document any required migration only if the current schema cannot represent the approved recipe data.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `recipe-management`: recipes created or edited in an authenticated bakery workspace persist to that bakery and are restored after reload while retaining costing and optional flow-assignment behavior.

## Impact

- Frontend recipe persistence adapter and its tests under `Front-end/src/features/`.
- `Front-end/src/app/BakeryWorkspace.tsx` and domain adapter composition/load wiring.
- Recipe-management/domain adapter contracts and focused component or browser tests.
- Existing `public.recipes` Supabase table, membership-scoped RLS, and generated database types; no hosted data or production rollout is part of planning this change.
- Product traceability: F4 Recipe Management and B4 Recipes and Production Flows, dependent on the existing F1 shared application foundation and B2 tenant boundary.
- Overlap boundary: `optional-recipe-production-flow` owns nullable flow-assignment UX and contract behavior; this change owns persistence and reload correctness only.
