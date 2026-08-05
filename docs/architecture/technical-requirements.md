# Bakery App Technical Requirements

This document is a durable current-system technical reference. It does not define active requirements, plans, tasks, progress, or change status; OpenSpec is authoritative for those.

## Current technical direction

- Frontend: React + TypeScript + Vite.
- Backend platform: Supabase Auth, PostgreSQL/Data API, Storage, database functions, and Edge Functions where secret-bearing or external-network work is required.
- Normal bakery CRUD should use the Supabase client behind bakery-scoped adapters and database RLS rather than a separate custom API server.
- All bakery business data must be scoped to an authorized bakery workspace; client filtering is not an authorization boundary.
- Database schema changes must be represented by committed Supabase migrations.
- Browser code may receive only client-safe `VITE_*` values. Service-role keys, database passwords, provider secrets, and webhook secrets must remain server-side.
- Money is stored as integer cents.
- Timestamps are stored in UTC and displayed in the bakery timezone.
- Confirmed/completed business records must preserve historical snapshots where later catalog/customer/recipe changes must not rewrite history.

## Canonical current references

- Architecture: [`architecture.md`](architecture.md)
- API behavior: [`../api/api.md`](../api/api.md)
- Database implementation: [`../database/database-schema.md`](../database/database-schema.md)
- Deployment and environment operations: [`../deployment/deployment-playbook.md`](../deployment/deployment-playbook.md)
- Product roadmap/reference: [`../product/bakery-production-and-cost-app-prd-v1-1.md`](../product/bakery-production-and-cost-app-prd-v1-1.md)
- UI/UX reference: [`../product/bakery-app-ui-ux-requirements-figma-brief.md`](../product/bakery-app-ui-ux-requirements-figma-brief.md)

If this reference disagrees with an approved OpenSpec change, follow OpenSpec and update the durable reference as part of the approved implementation when appropriate.
