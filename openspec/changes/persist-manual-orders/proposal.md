# Persist Manual Bakery Orders

## Executive Summary

Replace the authenticated in-bakery Add Order prototype with a persisted
manual-order workflow. A baker should be able to choose a real customer and
recipe from the active bakery, create an order in Supabase, generate its
production tasks, and see the same order after the workspace is reloaded.

## Program Traceability

- Frontend roadmap phase: F6 Orders and Payments.
- Backend roadmap phases: B5 Customers and Orders; B8 Task Lifecycle and
  Regeneration.
- Owning capability: `manual-order-persistence`.
- Prerequisites: F1 shared application foundation, F4 recipe management, F5
  customer management, the B1/B2 Supabase and workspace boundary, and the
  existing B8 production-task regeneration engine.
- Related active change: `repair-online-order-task-contract-and-recipes-rls`.
  That change owns public online checkout repair and recipe RLS; this change
  owns authenticated manual orders and must not edit or duplicate its files.

## Problem

The current authenticated Add Order flow is explicitly local prototype work.
`AddOrderModal` uses fixture customers and recipes, `BakeryWorkspace` mounts a
session-local domain adapter even under a Supabase-authenticated workspace, and
the submit handler does not await or surface the domain mutation result. The
database already contains bakery-scoped order, item, and production-task
tables, but the manual order path never reaches them.

## Scope

- Load the active bakery's customers and recipes using persisted identifiers.
- Persist authenticated manual orders and order items with server-side integer
  cent calculations and `in-person` source metadata.
- Generate and retain production tasks through the existing database task
  generation boundary.
- Aggregate repeated recipe lines into one recipe-level production plan with
  the summed quantity so ingredient requirements scale with the batch size.
- Make creation idempotent for a client-generated order identifier and safe to
  retry.
- Replace prototype confirmation language with success, pending, and failure
  states.
- Make the Orders screen read persisted records for the active bakery and show
  a newly created order without requiring a full browser restart.
- Add adapter, database, and browser coverage for success, retry, reload, and
  bakery isolation.
- Refresh generated Supabase types after the committed schema/RPC changes.

## Non-Goals

- Do not modify public online checkout or its existing idempotency contract.
- Do not edit the active online-order task/RLS corrective change or historical
  migrations.
- Do not implement order editing, cancellation, refunds, or invoice creation
  from an order in this change.
- Do not introduce hosted/production data, linked-project resets, or service
  role access in browser code.
- The current Cash/Venmo/Zelle selector is not a persisted order payment
  method because the orders schema has no such field. This change persists the
  deposit amount and derived payment status; payment-method persistence must be
  a separately approved decision or follow-up.

## Acceptance Evidence

- A signed-in bakery member can create a manual order using customers and
  recipes belonging to the active bakery.
- The order and all line items exist in local Supabase after submission, with
  totals stored in integer cents and `source = 'in-person'`.
- Production tasks are generated once and remain associated with the new order.
- Repeated recipe lines produce one recipe-level plan whose quantity is the
  summed line quantity and whose ingredient requirements scale accordingly.
- Repeating the same submission with the same order identifier does not create
  duplicate order items or tasks.
- The modal no longer claims the order is local-only and reports persistence
  failures without closing as if creation succeeded.
- Cross-bakery customer, recipe, and order access is denied by the persisted
  boundary.
- Focused Vitest/pgTAP/Playwright checks and the frontend verification baseline
  pass before archive consideration.
