# Design: Repair Idempotent Bakery Onboarding

## Findings

- `20260803145416_repair_bakery_creation_atomicity.sql` replaced the former
  first-membership guard with unconditional bakery and owner-membership
  inserts.
- `Front-end/src/app/workspace.ts` exposes only `createDefaultBakery(name)`;
  both the Supabase adapter and mock adapter use that method for every create
  action.
- `Front-end/src/app/App.tsx` calls that same method from the selector's
  create handler regardless of whether memberships are already loaded.
- `Front-end/supabase/tests/database/multi_store_workspaces.test.sql` expects
  repeated default onboarding to return the same bakery and retain one owner
  membership. It currently fails because the unconditional-create migration
  changed the operation's contract.
- The workspace-selection main spec already requires both behaviors—one
  default bakery for onboarding and explicit additional workspace creation—so
  the implementation needs separate RPC semantics rather than another
  overloaded boolean or name-based heuristic.

## Decisions

1. Add one new migration through the repository-pinned Supabase CLI. It will
   restore the private `create_default_bakery(text)` function to idempotent
   onboarding semantics and add `create_additional_bakery(text)` for explicit
   creation. Both public wrappers remain authenticated invoker boundaries and
   preserve the private schema boundary.
2. `create_default_bakery` will lock per caller, return the caller's existing
   default/oldest accessible bakery when one exists, and repair a missing
   profile default without creating a row. It will validate the requested name
   only when a new default bakery must be created.
3. `create_additional_bakery` will always create a new bakery and owner
   membership atomically for an authenticated caller, while preserving the
   caller's existing default bakery preference.
4. Extend `WorkspaceAdapter` with `createAdditionalBakery(name)`. The app will
   call `createDefaultBakery` only when the loaded membership list is empty;
   otherwise the explicit form calls `createAdditionalBakery`. Both returned
   IDs go through the existing reload/find/remember/activate path.
5. Update the mock adapter to mirror the two contracts. Existing tests will
   prove default retries do not append and explicit creation does append.
6. Keep the database test's current idempotency assertions, add explicit
   additional-creation assertions, and retain the complete frontend/browser
   coverage for existing bakery visibility and new-bakery activation.

## Risks and Mitigations

- A caller may depend on the old overloaded RPC behavior. Search all callers
  before editing; the only explicit additional-bakery path must be moved to
  the new operation and the public default RPC contract must remain stable.
- A profile may have memberships but no valid default. The idempotent default
  operation must select a deterministic accessible membership and repair only
  the profile preference, never expose another bakery.
- A failed additional creation could leave partial rows. Keep bakery,
  membership, and profile-default handling in one transaction and test the
  owner membership result under authenticated claims.
- A public wrapper could accidentally widen access. Preserve `SECURITY
  INVOKER`, authenticated grants, empty search paths, and private schema
  membership checks; run lint and security advisors after the migration.

## Integration Boundary

The migration agent owns only the new migration. The frontend agent owns the
adapter contract and application state files. The database-test agent owns
only Supabase pgTAP files. The browser agent owns only `Front-end/e2e/`.
The orchestrator owns generated types, OpenSpec artifacts, integration,
database reset, and final verification.
