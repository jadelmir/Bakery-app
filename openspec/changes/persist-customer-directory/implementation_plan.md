# Implementation Plan: Persist Customer Directory

## Objective

Connect the authenticated Customers tab to the bakery-scoped backend, make Add
Customer durable, and render the backend-created result immediately and after
reload.

## Change

`persist-customer-directory` — F5 Customer Management / B5 Customers and Orders.

## Preconditions and sequencing

The archived customer-management baseline is the functional starting point.
The active `persist-manual-orders` change has overlapping workspace/domain
surfaces, so implementation must wait for its current integration state to be
reviewed or explicitly serialize ownership of those files. The new change must
not edit that change's artifacts or archive it.

## Workstreams

| Workstream | Tasks | Exclusive ownership | Acceptance |
| --- | --- | --- | --- |
| Backend and persisted adapter | 1.1, 2.1 | New customer migration/test files; `Front-end/src/lib/supabase/customerAdapter.ts` and its tests | Bakery-scoped load/create/update, RLS denial, typed failures, generated UUIDs |
| Domain integration | 2.2, 3.1 | `Front-end/src/app/domain/types.ts`, `Front-end/src/app/state/domainState.ts`, `Front-end/src/app/state/reducer.ts` if needed, `Front-end/src/app/BakeryWorkspace.tsx`, generated database types | Live adapter is used for authenticated mode; mock mode remains local; authoritative customer changes update snapshot |
| Customer UI and browser coverage | 3.2, 3.3 | `Front-end/src/app/components/customers/CustomerManager.tsx`, `CustomerEditorDialog.tsx`, customer unit tests, `Front-end/e2e/customer-management.spec.ts` | Success/error states, immediate result, reload persistence, edit and isolation journeys |
| Orchestrator verification | 4.1 | OpenSpec artifacts, integration-only conflict resolution, no broad source ownership | Full required checks and manual authenticated acceptance recorded |

The domain integration owner owns shared files and must integrate the backend
adapter after the backend work is complete. Concurrent assignments must not
touch the same file.

## Model policy

Use the default bounded model at medium reasoning for the adapter, UI, and tests.
Use a high-reasoning model for schema/RLS review and final cross-layer
integration only if the schema decision or adapter composition is non-trivial.

## Verification

1. Focused customer adapter/component tests.
2. Local Supabase migration/RLS checks and generated-type check when applicable.
3. Desktop/mobile customer Playwright journey.
4. `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run build`.
5. Manual authenticated Add Customer, verify it appears immediately, reload,
   and verify it remains in the active bakery only.

`request_feedback: true`
