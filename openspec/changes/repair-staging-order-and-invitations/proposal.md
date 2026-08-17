# Repair Staging Order Visibility and Invitations

## Why

Staging exposed two integration failures after the authenticated workspace features were implemented:

1. Creating a manual order reaches the persisted service, but the Orders screen can continue rendering an empty local projection because it selects the wrong source snapshot in Supabase mode.
2. Team invitations are not usable from the GitHub Pages staging deployment. The hosted Edge Function/origin configuration is not proven, and the generated callback drops the `/Bakery-app/` deployment base path.

The existing `persist-manual-orders` and `repair-bakery-invitations` changes establish the underlying contracts and local evidence. This corrective change recovers the missing staging result without reimplementing either feature.

## Program Traceability and Ownership

- Frontend roadmap phases: F6 Orders and Payments; F12 Settings, Reliability, and Release.
- Backend roadmap phases: B2 Authentication and Bakery Workspaces; B5 Customers and Orders; B8 Task Lifecycle and Regeneration; B12 Security, Testing, and Release.
- Owning capability: staging integration reliability for persisted manual orders and bakery invitations.
- Related changes: `persist-manual-orders` owns the baseline authenticated manual-order capability; `repair-bakery-invitations` owns the baseline invitation contract and local delivery evidence. This change owns only the discovered projection regression, hosted callback/configuration integration, and staging acceptance evidence.
- Prerequisites: the persisted manual-order RPC/adapter, the Supabase workspace invitation Edge Function, the GitHub Pages base-path deployment, and the existing local verification harnesses.

## Scope

- Make the authoritative persisted manual-order snapshot the Orders-screen source whenever the persisted manual-order service is active, including after creation and reload.
- Add a regression test that exercises a Supabase-backed domain snapshot containing an empty-but-present `recipesById` object.
- Preserve the existing manual-order RPC, bakery membership boundaries, local/mock adapter behavior, and order lifecycle rules.
- Preserve the invitation token and change hosted callback construction so the link returns to the deployed application base path.
- Verify and document staging `APP_URL`, Supabase Auth redirect allow-list, SMTP/sender, Edge Function secrets, deployed function version, and migration parity through authorized staging checks.
- Add real staging acceptance evidence for order creation/reload and invitation delivery/acceptance.

## Non-Goals

- No redesign of the New Order, Orders, Team access, or invitation landing interfaces.
- No new order or invitation tables, no replacement RPC, and no change to role authorization or tenant-isolation policy unless a staging check proves a separate defect.
- No custom mail service and no browser exposure of service-role keys, database passwords, or SMTP credentials.
- No production rollout or production data access; production remains a separate approval gate.

## Expected Impact

- Frontend: `BakeryWorkspace` order-source selection and focused regression/browser coverage.
- Supabase Edge Function: invitation callback base-path handling, with configuration kept in hosted secrets/dashboard settings.
- Deployment/operations: staging function-secret and Auth/SMTP verification steps.
- Documentation: update the frontend deployment/API or invitation operations references with the hosted base URL and configuration gates.

