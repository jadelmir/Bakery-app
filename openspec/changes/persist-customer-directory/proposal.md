# Persist Customer Directory

## Executive Summary

Replace the authenticated Customers tab's local fixture/local-adapter path with
the bakery-scoped Supabase customer records. Creating or editing a customer
must commit through the backend, update the shared domain snapshot, and remain
visible after the page or workspace reloads.

## Program Traceability

- Frontend roadmap phase: F5 Customer Management.
- Backend roadmap phase: B5 Customers and Orders.
- Owning capability: `customer-management`.
- Prerequisites: the archived customer-management baseline, Supabase/workspace
  tenant boundary, and completion or explicit serialization with the active
  `persist-manual-orders` change because both currently touch the workspace and
  customer domain boundary.

## Problem

`CustomerManager` contains a five-record fallback fixture. `BakeryWorkspace`
currently mounts `createLocalBakeryAdapter()` even for an authenticated
workspace, and the Customers callbacks call that local adapter without
checking the result. A newly added customer can appear optimistically in the
component but is not guaranteed to be persisted or present after reload.

## Scope

- Load active-bakery customers from Supabase for authenticated workspaces.
- Persist customer creation and editing through a bakery-scoped backend adapter.
- Apply authoritative mutation results to the shared domain snapshot so the
  new or edited record appears in the directory immediately.
- Keep mock/browser-test mode using the existing local adapter and fixtures.
- Add focused adapter, component, backend/RLS, and Playwright coverage.

## Non-Goals

- Do not redesign the customer directory or add delete/archive behavior.
- Do not change order, invoice, storefront, or customer self-service flows.
- Do not expose service-role secrets or query production/hosted data.
- Do not duplicate or modify the archived customer-management change.

## Acceptance Evidence

- An authenticated member sees only customers belonging to the active bakery.
- Add Customer commits a record through Supabase and shows that record in the
  directory without a full browser restart.
- The new record remains present after a workspace/page reload.
- Edit Customer commits and displays the updated values.
- Invalid or denied backend operations surface an error and do not falsely
  close as successful.
- Mock mode retains fixture behavior.
