# Bakery App Database Reference

This document describes the implemented database at a durable reference level. Planned schema belongs in OpenSpec and must not be treated as implemented until verified migrations exist.

## Ownership and isolation

Bakery-owned records are protected by authenticated workspace membership and Row-Level Security. Current workspace authorization is centered on `bakery_memberships` and helper/RPC boundaries in committed Supabase migrations. Browser filtering is not an authorization boundary.

## Implemented migration families

- `20260729133759_backend_phase_1_foundation.sql` — baseline database foundation.
- `20260729135107_secure_existing_rls_auto_enable.sql` — inherited helper execution hardening.
- `20260729140126_add_multi_store_workspaces.sql` — profiles, bakeries, memberships, invitations, and workspace operations.
- `20260729142630_harden_workspace_rpc_boundaries.sql` — security-definer/search-path and execution-boundary hardening.
- `20260729143659_strengthen_workspace_security_contracts.sql` — role and last-owner protections.
- `20260729150000_ingredients_and_costing.sql` — ingredients and inventory costing structures.
- `20260729160000_invoices_and_payments.sql` — invoices, invoice items/events, bakery payment methods, and payments.
- `20260729170000_online_storefront.sql` — storefront, customers, recipes, orders, order items, availability/capacity, and idempotency structures.
- `20260730180000_starter_and_inventory_movements.sql` — starter profiles/builds, inventory transaction ledger, and task execution logs.
- `20260816000614_persist_production_flows.sql` — bakery-scoped production flows and ordered steps, dependency constraints, RLS/grants, and atomic save/delete RPCs.

Later migrations in `Front-end/supabase/migrations/` are the authoritative evidence for newer implemented schema. The recipe persistence migration adds `recipe_ingredients`, converts recipe `flow_id` to text, and exposes the bakery-scoped `save_recipe` RPC. When this document and committed migrations disagree, verify the migrations and update this reference; do not infer planned tables from old requirement documents.

## Implemented domain areas

Current migrations cover workspace identity/membership, ingredients and inventory costing, invoicing/payments, customers/recipes/orders/storefront behavior, bakery-scoped production flow persistence, sourdough starter planning records, inventory transaction history, and task execution logging.

## Durable invariants

- Bakery isolation is enforced by database authorization/RLS, not only UI filters.
- Last-owner protection must prevent accidental loss of the final bakery owner.
- Financial values are stored as integer cents.
- Historical order/invoice data that must not drift is snapshotted or otherwise frozen by the implementing schema/operation.
- Schema changes are migration-first and committed to Git.
- Production flow saves replace the complete ordered step set through an invoker RPC, preserving same-flow dependency integrity atomically.
- Production flow tables and RPCs require authenticated bakery membership; anonymous access and cross-bakery access are denied by grants and RLS.
- Recipe saves replace the complete ingredient-line set through the invoker `save_recipe` RPC, calculating authoritative batch cost from active bakery inventory rows.
- Recipe ingredient lines and the save RPC require authenticated bakery membership; anonymous access and cross-bakery access are denied by grants and RLS.

For exact tables, columns, policies, functions, constraints, and their current order, inspect the committed migrations and generated Supabase types. OpenSpec is authoritative for proposed schema changes that are not yet implemented.
