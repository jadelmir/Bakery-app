# Frontend Requirements Audit

**Audit date:** July 29, 2026  
**Scope:** Current React frontend prototype compared with the MVP requirements.  
**Audit status:** Current as of the Backend Phase 1 Supabase foundation.

## Sources Reviewed

- `Bakery_Production_and_Cost_App_PRD_v1.1.md`
- `Bakery_App_Technical_Requirements.md`
- `Bakery_App_UI_UX_Requirements_Figma_Brief.md`
- `Front-end/src/app/App.tsx`
- `Front-end/src/app/AuthScreen.tsx`
- `Front-end/src/app/auth.ts`
- `Front-end/src/app/planning.ts`
- `Front-end/src/app/production.ts`
- `Front-end/src/app/reporting.ts`
- `Front-end/src/lib/supabase/client.ts`
- `Front-end/supabase/config.toml`
- `Front-end/supabase/migrations/`
- Current frontend unit and end-to-end tests

## Status Definitions

- **Implemented:** A usable prototype workflow exists for the requirement.
- **Partial:** Some interface or local behavior exists, but required actions,
  states, integration, or persistence are incomplete.
- **Not implemented:** No usable workflow currently exists.

An Implemented status in this audit does not imply backend persistence or
production readiness. The current application remains a local frontend
prototype unless stated otherwise.

## Backend Foundation Status

Backend Phase 1 now provides pinned Supabase tooling, repository-owned local
configuration, a migration-first schema workflow, generated TypeScript database
types, safe Vite environment conventions, and a typed client boundary. Local
and hosted development migration histories match, and Supabase security and
performance advisors are clear.

The migrations introduce no application tables, and the visible application
does not consume the client yet. Authentication, bakery workspaces, Row-Level
Security for business tables, and persisted domain data therefore remain
incomplete exactly as recorded below.

## Current Prototype Inventory

| **Area** | **Current frontend capability** | **Current limitation** |
|----------|---------------------------------|------------------------|
| Application shell | Responsive desktop sidebar, mobile bottom navigation, More screen, accessible add-order action, and local screen switching. | Navigation is component state rather than URL-based routing; browser back, deep links, and shared route state are absent. |
| Authentication | Login, signup, validation, pending/error states, protected workspace shell, and logout. | Uses an in-memory mock adapter; accounts and sessions do not persist; verification and password recovery are absent. |
| Dashboard | Alerts, notifications panel, local task completion, task metrics, upcoming-order cards, shortages, and financial summaries. | Uses isolated static orders, tasks, dates, and totals; newly created orders and production updates do not consistently update it. |
| Orders | Search, filters, order details, five-step local order creation, multi-item orders, deposits, and generated order-linked production plans. | Edit Order and Mark Ready are visual-only; customer creation, rescheduling, cancellation, full status transitions, payment updates, delivery details, and snapshots are incomplete. |
| Production | Today, Tomorrow, and Calendar views; pickup events; chronological tasks; dependencies; completion; notes; skip reasons; rescheduling; traceability; and starter-build details. | No explicit Upcoming view, grouped-task interface, in-progress action, dependent-task shift confirmation, functional timer, or persistence. |
| Flow Builder | Default flow selection, local renaming, duplication, validation summary, and step enable/disable controls. | Cannot create a blank flow or add, edit, remove, duplicate, or reorder steps; edits are not connected to recipe assignment or generated plans. |
| Recipes | Search, recipe list, recipe details, ingredients, cost, price, margin, and assigned-flow presentation. | New Recipe, Edit, and View Flow do not open workflows; CRUD, duplication, archive/restore, cost allocations, and flow assignment are missing. |
| Customers | Search by name, phone, or email; customer directory; profile, contact, address, notes, favorites, spending, and balance presentation. | Add/edit/archive/restore, duplicate warnings, inline customer creation, validation, and contact actions are missing. |
| Starter | Retained amount display, last-fed display, retained-target and feeding-ratio controls, calculated builds, order contributors, shortage warnings, and local overrides. | Cannot record an actual feeding, update last-fed/current retained amounts through an operation, manage profiles, configure peak timing, or approve/reset combined builds. |
| Inventory | Calculated recipe and starter requirements, per-order filtering, available/required/shortage presentation, shopping list, and idempotent local deductions on task completion. | Ingredient and stock CRUD, purchases, waste/returns/adjustments, day filter, transaction history, deduction setting, and persistence are missing. |
| Finances | Product and example date filters, revenue/profit/unpaid summaries, units sold, unpaid-order list, empty state, and export-ready feedback. | Uses static orders and an estimated cost percentage; CSV is not downloaded; custom ranges, average price, manual expenses, snapshots, and live calculations are missing. |
| Invoices | No current screen or workflow. | Dedicated tab, invoice creation, preview, PDF output, email delivery, delivery status, resend, secure-link copy, and void actions are all missing. |
| Notifications | Local notification panel for shortages, starter issues, pickups, and unpaid balances. | Static/local only; no read/dismiss state, source navigation, preferences, browser notifications, or delivery-failure handling. |
| Settings | Reachable placeholder screen. | Bakery profile, timezone, currency, buffers, deduction method, starter defaults, notifications, and equipment settings are missing. |

## MVP Coverage Matrix

| **Requirement area** | **Status** | **Current evidence** | **Remaining MVP work** | **Frontend phase** |
|----------------------|------------|----------------------|------------------------|--------------------|
| Initial sourdough and focaccia products | Implemented | Both products appear throughout recipes, orders, tasks, starter, inventory, and reporting examples. | Replace static catalog values with persisted records. | Phase 4 |
| Dashboard | Partial | Urgent tasks, alerts, metrics, upcoming orders, shortages, tomorrow preview, and notification panel exist. | Connect all sections to shared data, add dynamic date/range behavior, deep links, and reliable empty/error states. | Phase 10 |
| Ingredients and costing | Partial | Recipe and inventory views present ingredient quantities and example costs. | Add ingredient/purchase forms, base units, stock operations, allocations, and live cost recalculation. | Phase 3 |
| Recipe management | Partial | Search, list, detail, ingredients, price, cost, margin, and assigned flow are visible. | Add create/edit/duplicate/archive/restore, ingredient editing, allocations, and flow assignment. | Phase 4 |
| Customer management | Partial | Search and detailed customer presentation are functional. | Add CRUD, archive/restore, validation, duplicate warnings, inline creation, history links, and contact actions. | Phase 5 |
| Order creation | Partial | Local multi-step creation supports customer selection, multiple products, pickup, deposit, notes, confirmation, and local plan generation. | Add inline customer creation, delivery fields, validation depth, persisted drafts, and server-backed confirmation. | Phase 6 |
| Order lifecycle | Partial | Canonical statuses display and new local orders are added as Confirmed. | Add edit, reschedule, cancel, ready/complete transitions, regeneration confirmation, and historical snapshots. | Phase 6 |
| Payments | Partial | Deposit entry, payment-status display, paid amount, balance, and unpaid filter exist. | Add payment history, additional payment entry, methods, refunds, and snapshot-backed totals. | Phase 6 |
| Production flow builder | Partial | Default flows can be selected, renamed, duplicated, and locally enabled/disabled by step. | Add complete flow and step editing, scheduling methods, reorder, dependencies, grouping, assignment, and deletion safeguards. | Phase 7 |
| Scheduling methods | Partial | Default flow steps generate deterministic local tasks from pickup dates and fixed relative-day times. | Add all timing methods, duration-based backward scheduling, editable dependencies, timezone configuration, and robust conflict handling. | Phases 7–8 |
| Starter manager | Partial | Combined compatible builds, ratios, retained target, contributors, shortages, and overrides are calculated locally. | Add feeding records, retained updates, peak timing, profile management, approval/reset actions, and persistence. | Phase 9 |
| Inventory and requirements | Partial | Recipe plus starter flour/water requirements, shortages, shopping list, order filter, and guarded local deductions exist. | Add inventory CRUD/transactions, day filtering, configurable deduction method, history, explanations, and persistence. | Phases 3 and 9 |
| Task management | Partial | Today/Tomorrow/Calendar and order timeline show chronological tasks, pickups, dependencies, warnings, completion, notes, skipping, and rescheduling. | Add Upcoming, In Progress, grouped work, dependent shifting, timer behavior, confirmations, and persistence. | Phase 8 |
| Sales and profit | Partial | Product/date examples, revenue, estimated cost/profit, units, unpaid balances, empty state, and export feedback exist. | Add real calculations, custom ranges, average price, manual expenses, order-level profit, snapshots, and actual CSV download. | Phase 11 |
| Invoices | Not implemented | No invoice route, tab, data, or interaction is present. | Add invoice list/search/status filters, order-to-invoice creation, snapshots, preview, PDF, email sending, delivery status, resend, link copy, and voiding. | Phase 11 |
| Notifications | Partial | A local notification panel displays operational examples. | Connect persisted events, source navigation, read/dismiss state, preferences, browser notifications, and invoice-delivery results. | Phase 10 |
| Settings | Not implemented | Placeholder screen only. | Add bakery and operational settings required by the PRD. | Phase 12 |
| Responsive navigation | Implemented | Desktop and mobile navigation and accessible add-order access are present. | Add the Invoices destination, URL routing, tablet refinement, and comprehensive navigation tests. | Phases 1 and 11 |
| Loading, error, offline, and empty states | Partial | Authentication pending/error and selected empty states exist. | Standardize states across every feature, add connection-loss handling, safe retries, and unsaved-form recovery. | Phases 1 and 12 |
| Accessibility | Partial | Primary controls use semantic buttons, labels, and several accessible names. | Complete keyboard/focus review, validation announcements, dialog behavior, contrast verification, and end-to-end accessibility checks. | Phase 12 |

## Important Cross-Screen Finding

The application does not yet use one consistent data source:

- Orders created in the new-order workflow update the local Orders and
  Production collections.
- The Dashboard maintains a separate local task collection and reads static
  orders and financial totals.
- Customers, Recipes, Finances, and parts of Inventory continue to read static
  constants.
- Flow Builder edits are contained inside the builder and do not affect recipe
  assignments or subsequent task generation.

This makes Frontend Phase 1 a prerequisite for reliable feature completion.

## Frontend Phase Alignment

| **Frontend phase** | **Audit work covered** |
|--------------------|------------------------|
| Phase 1 — Shared Application Foundation | URL routing, shared data, adapters, loading/error/offline states, and unsaved-form protection. |
| Phase 2 — Authentication and Account Experience | Real account journeys, verification, password recovery, and session restoration. |
| Phase 3 — Ingredients and Stock Entry | Ingredient, purchase, and inventory-transaction entry. |
| Phase 4 — Recipe Management | Complete recipe CRUD, costing, archive/restore, and flow assignment. |
| Phase 5 — Customer Management | Complete customer CRUD, validation, inline creation, duplicate warnings, and contact actions. |
| Phase 6 — Orders and Payments | Complete order lifecycle, rescheduling, cancellation, payments, refunds, and snapshots. |
| Phase 7 — Production Flow Builder | Complete flow and step authoring. |
| Phase 8 — Production Task Workspace | Complete task lifecycle, grouped work, timing tools, dependencies, and schedule-change handling. |
| Phase 9 — Starter and Inventory Planning | Feeding operations, starter profiles, inventory requirements, transaction history, and shopping workflow. |
| Phase 10 — Dashboard and Notifications | Shared live dashboard data and actionable notifications. |
| Phase 11 — Finances and Invoices | Accurate reporting, expenses, real exports, and the complete invoice tab and delivery workflow. |
| Phase 12 — Settings, Reliability, and Release | Operational settings, accessibility, responsive refinement, recovery states, and release verification. |

## Current MVP Frontend Blockers

The prototype cannot be considered frontend-complete until:

1. All screens operate on one shared and eventually persisted data source.
2. Ingredient, recipe, customer, order, payment, and flow management workflows
   are complete.
3. Order status changes and schedule regeneration are usable and safe.
4. Starter and inventory actions can be recorded rather than only calculated.
5. Financial results use real snapshots and exports create actual files.
6. The Invoices tab can generate, download, and send invoices with delivery
   feedback.
7. Settings and consistent loading, error, offline, accessibility, and recovery
   states are complete.

This audit should be updated whenever a frontend phase is completed or the PRD
changes materially.
