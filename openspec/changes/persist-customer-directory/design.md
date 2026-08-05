# Design: Persist Customer Directory

## Findings

- `CustomerManager.tsx` has `DEFAULT_CUSTOMERS` and maintains local internal
  state; its external callback is optional.
- `BakeryWorkspace.tsx` derives customers from the domain snapshot but wraps
  the workspace in `createLocalBakeryAdapter()` unconditionally.
- The domain types already define `CustomerPort`, `createCustomer`,
  `updateCustomer`, and authoritative `CustomerResult.changes`.
- `database.types.ts` already describes a `customers` table with bakery ID,
  name, email, phone, address, and notes; customer type is currently a domain
  field and needs an explicit persistence decision.
- Existing customer baseline and manual-order work are related but neither
  should be rewritten. Shared workspace/domain files require serialized
  ownership during implementation.

## Decisions

1. Add a narrow Supabase customer adapter behind the existing domain adapter
   boundary rather than calling Supabase from the screen.
2. Load customers with the active bakery ID and rely on authenticated RLS for
   tenant isolation; never use fixture IDs in live mode.
3. Use backend-generated UUIDs for new customers. The UI must use the returned
   customer in `changes.customers`, not manufacture a display-only ID.
4. Extend the domain controller with customer mutation commands or compose the
   persisted customer port into the existing adapter, preserving local mode.
5. Decide and document the `type` field before migration: if the current
   database has no column, add a constrained persisted field; do not silently
   discard Wholesale/Retail selection.
6. On success, dispatch authoritative changes and close the dialog; on failure,
   retain the form and show a typed error.

## Workstream Boundaries

- Database/adapter: migration or schema check, Supabase customer adapter, RLS
  tests, and adapter tests.
- Frontend integration: domain controller, workspace adapter selection, and
  customer callback/result handling.
- UI/tests: remove live reliance on fallback fixtures, add pending/error state,
  and update component/browser assertions.

The integration owner must serialize edits to `BakeryWorkspace.tsx`, domain
types/state, and generated Supabase types. No agent may modify the active
`persist-manual-orders` files or archive/sync either change.

## Verification Boundary

Run focused Vitest and customer Playwright tests first, then `pnpm run
typecheck`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`. If schema
files are added or changed, rebuild/reset only the local Supabase environment,
run migration/RLS checks, and regenerate database types. Manual authenticated
Add Customer and reload acceptance is required before archive readiness.
