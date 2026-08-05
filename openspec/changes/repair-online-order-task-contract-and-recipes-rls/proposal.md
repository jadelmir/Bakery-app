# Repair Online-Order Task Contract and Recipes RLS

## Problem

The task-regeneration migration replaced `public.production_tasks`, but the
older `private.create_online_order` function still inserts the removed
`order_item_id`, `product_name`, `quantity`, and `instructions` columns. The
database lint check therefore reports a broken dependent function, and a live
online checkout can fail when it tries to create its production task.

The same lint run reports that `public.recipes` has row-level security
disabled. Recipes contain bakery-owned operational data, including costing
fields, so direct browser access must be protected by current bakery
membership rather than by the active bakery selected in the UI.

## Goal

Restore online-order task creation against the current production-task
schema, preserve checkout idempotency, and protect recipes with
membership-scoped RLS. The change must pass a clean local migration reset,
database security checks, and the repository's frontend quality baseline.

## Scope

- Add a new migration that replaces the stale online-order function body with
  inserts matching the final `production_tasks` schema.
- Add a new migration policy for `public.recipes` using the existing
  membership helper and authenticated access boundary.
- Add database tests for successful and idempotent online checkout task
  creation, plus same-bakery and cross-bakery recipe access denial paths.
- Rebuild the local database from committed migrations, run lint/advisor
  checks, refresh/check generated types, and run the relevant application
  verification.

## Non-goals

- Do not edit historical migrations or patch the database with ad-hoc SQL.
- Do not change storefront UI, bakery selector behavior, recipe editor UX, or
  name-based filtering.
- Do not expose recipe costing data to anonymous storefront callers.
- Do not reset, inspect, or modify a linked or production Supabase project.
- Do not weaken existing tenant policies or grant broad service-role access to
  browser clients.

## OpenSpec Capabilities

- `supabase-backend-foundation` (migration dependency and clean-reset
  correctness)
- `bakery-tenant-isolation` (recipe membership isolation and denial tests)
