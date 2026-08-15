# Repair Staging Supabase Schema Drift

## Problem

The staging deployment now links to the correct Supabase project and successfully runs `supabase db push --linked`, but the post-deployment verification fails because `public.profiles` is missing.

This is not expected. The committed migration `Front-end/supabase/migrations/20260729140126_add_multi_store_workspaces.sql` explicitly creates `public.profiles`, `public.bakeries`, `public.bakery_memberships`, and `public.bakery_invitations`. During the latest staging deployment, Supabase did not offer that migration for application and instead began with later migrations. This indicates the remote migration history and the actual remote schema may be out of sync.

A false fix would be to remove `profiles` from the required-table verification. That would hide the drift while leaving the application database incomplete.

## Goal

Restore staging so the actual database schema matches the committed migration contract and the remote migration history truthfully represents what has been applied.

## Scope

- Inspect the linked staging project's migration history and compare it with the committed migration set.
- Determine which foundational objects expected from earlier migrations are missing from the actual remote schema.
- Add a new forward-only repair migration that restores missing foundational objects using guarded/idempotent checks where safe.
- Preserve existing legitimate staging data and avoid destructive resets, blanket drops, or replaying old migrations blindly.
- Repair migration-history metadata only when evidence proves it is necessary and only through supported Supabase CLI/database migration-history mechanisms.
- Keep the existing required-table verification gate, including `profiles`.
- Verify the repaired staging schema contains the expected foundational and application tables.
- Verify a subsequent `supabase db push --linked` reports no unexpected pending/replayed historical migrations.

## Non-goals

- Do not reset the staging database.
- Do not delete or recreate healthy tables solely to match migration order.
- Do not weaken RLS, authentication, foreign-key, trigger, or role protections.
- Do not change production migration history as part of this staging repair.
- Do not remove required-table checks simply to make CI green.

## Related OpenSpec Work

- `stabilize-staging-data`: fixed Supabase project paths and exposed this schema drift through its verification gate. This repair change addresses the newly discovered migration-history/schema inconsistency rather than duplicating that change.

## OpenSpec Capabilities

- `deployment-playbook`
- `database-migration-integrity`
