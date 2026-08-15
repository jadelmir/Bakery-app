# Design: Repair Staging Supabase Schema Drift

## Evidence and diagnosis

The staging deployment successfully linked to the configured Supabase project and `supabase db push --linked` applied later migrations, but verification then reported `public.profiles` missing. The committed workspace migration `20260729140126_add_multi_store_workspaces.sql` defines `public.profiles` and other foundational workspace tables. Because that migration was not offered as pending during the push, the likely failure mode is remote migration-history/schema drift: migration history records an earlier migration as applied while one or more objects from that migration are absent.

Implementation must confirm that diagnosis before changing migration history.

## Repair strategy

Use a new timestamped, forward-only migration. Do not edit or rename already-published historical migration files.

The repair migration should inspect each foundational object required by the current application contract and create only missing objects. Use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, conditional `DO $$ ... $$` blocks, `CREATE OR REPLACE FUNCTION`, and guarded trigger/policy creation where PostgreSQL does not support `IF NOT EXISTS` directly.

For existing objects, do not overwrite data. When a table exists but is structurally incomplete, add only missing columns/constraints/indexes after explicit catalog checks. Any repair that could rewrite or invalidate existing data must stop with an actionable error instead of silently coercing records.

## Foundational contract to inspect

At minimum inspect the objects established by the workspace migration and any downstream application dependency on them:

- `public.profiles`
- `public.bakeries`
- `public.bakery_memberships`
- `public.bakery_invitations`
- required foreign keys and indexes connecting those tables
- `private.set_updated_at`, `private.protect_bakery_identity`, `private.handle_new_auth_user`
- the auth-user profile synchronization trigger
- current RLS enablement/policies required by downstream migrations

The implementation should also confirm the tables already checked by staging verification (`customers`, `orders`, `order_items`, `recipes`) remain intact.

## Migration-history handling

Before writing or applying repair SQL, capture:

1. local committed migration versions;
2. remote migration versions reported by Supabase CLI;
3. the remote schema objects actually present.

If migration history already lists `20260729140126` as applied, retain that record and use the new repair migration to reconcile schema forward. Do not mark the old migration reverted merely to force a replay unless inspection proves the original migration never ran and replay is safe. Prefer a new auditable repair migration over history rewriting.

If history itself contains an invalid/missing version that prevents future pushes, use Supabase's supported migration-repair mechanism only after documenting the exact local/remote mismatch. The repair command and before/after history must be captured in deployment evidence.

## Safety

- No `supabase db reset` against staging.
- No broad `DROP TABLE`, `DROP SCHEMA`, or destructive history rewrite.
- No copying production data into staging.
- Preserve existing primary keys and user-owned rows.
- Fail explicitly when an existing object conflicts with the expected shape in a way that cannot be made additive.
- Back up/dump the staging schema before applying the repair migration; capture enough evidence to reconstruct the pre-repair structure.

## Verification

After repair:

1. `supabase db push --linked` succeeds.
2. Schema verification confirms all required tables, including `public.profiles`.
3. A second dry/no-op migration comparison reports no unexpected pending migrations.
4. Edge Functions deployment proceeds past the schema gate.
5. Auth/profile and bakery membership smoke checks confirm the foundational workspace objects are functional, not merely present.
6. Existing customer/order data, if any, remains intact.

## Rollback approach

Because this is an additive forward repair, rollback should not drop repaired foundational tables after they begin receiving data. If deployment fails mid-repair, fix forward with another guarded migration. Only newly created non-data-bearing objects may be removed manually when proven safe and before application traffic depends on them.
