# Repair Idempotent Bakery Onboarding

## Problem

The corrective migration `20260803145416_repair_bakery_creation_atomicity.sql`
changed `create_default_bakery` so it creates a new bakery on every call. That
behavior is correct for the explicit “Add new bakery” action but is incorrect
for default onboarding: retrying onboarding for a user who already has a
bakery must return the existing accessible bakery instead of creating another
one.

The frontend currently uses one `createDefaultBakery` adapter method for both
first-time onboarding and the explicit additional-bakery form. The database
test correctly exposes this contract collision: repeated default onboarding
returns different bakery IDs and creates two owner memberships.

## Goal

Restore idempotent default-bakery onboarding while preserving explicit
additional-bakery creation. The two flows must use distinct, authenticated,
transactional operations so an existing bakery is shown after login and a
deliberately created new bakery still appears and becomes active.

## Scope

- Restore `create_default_bakery` as an idempotent onboarding operation.
- Add a separately named authenticated operation for explicit additional
  bakery creation.
- Update the Supabase and mock workspace adapters and application selection
  flow to choose the correct operation based on whether memberships already
  exist.
- Update database, frontend, and browser coverage for retry idempotency,
  existing bakery visibility, and explicit additional creation.
- Rebuild the local database and run the complete verification baseline.

## Non-goals

- Do not expose global bakery discovery or bypass membership-scoped RLS.
- Do not identify bakeries by name or hide duplicate names in the selector.
- Do not delete existing bakeries or migrate production/linked data.
- Do not change invitations, team permissions, storefront behavior, or recipe
  security from the preceding corrective change.
- Do not edit historical migrations; add one new migration through the pinned
  Supabase CLI.

## OpenSpec Capabilities

- `bakery-workspace-selection` (distinct onboarding and explicit-creation
  contracts)
- `supabase-backend-foundation` (versioned RPC and generated-type lifecycle)
