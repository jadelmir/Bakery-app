# Clean Local Bakery Seed State

## Problem

The local Supabase database currently contains two `Runtime Check Bakery`
rows for `admin@jadorebakery.com`, but that name is absent from the committed
seed file and from the mock workspace fixtures. The rows were created by a
runtime verification session and now make the admin bakery selector look as if
extra bakeries were seeded automatically.

## Goal

Restore the local database to the committed synthetic seed and make the
verification path durable enough to detect any future mock or seed pollution.
After a clean local reset, the admin should see only `J'adore Bakery` until an
explicit bakery creation action succeeds. The new bakery created through that
action must still appear and become active.

## Scope

- Confirm and guard the mock fixture and committed seed against runtime-check
  bakery entries.
- Reset only the local Supabase database from committed migrations and
  `Front-end/supabase/seed.sql`.
- Verify the seeded admin membership directly in the local database and
  through the actual login/selector journey.
- Preserve the existing membership-scoped listing and explicit creation
  behavior.

## Non-goals

- Do not filter or hide a bakery by name in the application. A real user may
  legitimately choose the name `Runtime Check Bakery`.
- Do not add a migration that deletes local verification data.
- Do not reset, inspect, or modify a linked or production Supabase project.
- Do not change tenant-scoped RLS policies as part of this cleanup.

## OpenSpec Capability

`bakery-workspace-selection` (F2/B2 corrective cleanup)
