# Bakery App Backend Requirements

**Version:** 1.0  
**Last audited:** July 29, 2026  
**Scope:** Complete MVP backend requirements and implementation-gap audit  
**Primary requirements sources:** Product PRD v1.1, technical requirements,
current OpenSpec specifications, Supabase configuration, migrations, and
frontend source

## 1. Audit conclusion

The repository has a complete, verified Supabase development foundation, but
it does not yet have an application backend.

| Area | Verified repository state | MVP requirement | Status |
|---|---|---|---|
| Supabase tooling | CLI and JavaScript client are pinned; local and hosted development workflows are verified | Reproducible migration-first workflow | Foundation implemented |
| Database schema | Baseline migration executes `select 1`; no domain objects | Full bakery schema, constraints, indexes, grants, and RLS | Not implemented |
| Generated types | Committed types match the current empty application schema | Regenerate types after every domain migration | Foundation implemented |
| Authentication | Supabase Auth login, signup, logout, and session restoration are integrated | Add password recovery and production email configuration | Partial |
| Tenant isolation | Workspace tables and current-membership RLS are implemented and tested with two bakeries | Extend the same boundary to every future domain table | Workspace foundation implemented |
| Seed data | Seed file intentionally contains no records | Initial ingredients, recipes, flows, and development fixtures | Not implemented |
| Data integration | Screens use static/local state | Shared persisted source of truth | Not implemented |
| Storage | Service enabled locally; no bucket/policies | Private invoice PDF storage if PDFs are retained | Not implemented |
| Edge Functions/jobs | Authenticated bakery invitation delivery is implemented | Invoice delivery, reminders, and exports remain | Partial |
| External APIs | No provider integration | Transactional email provider required for invoice email; provider undecided | Decision required |
| Verification | Local reset, types, tests, hosted history, and advisors are verified | Repeat after every domain migration | Foundation implemented |

### Connected development project findings

Hosted development verification on July 29, 2026 found no `public` application
tables and no deployed Edge Functions. Both committed foundation migrations
match local history. A forward migration revoked browser-role execution of the
inherited `public.rls_auto_enable()` helper. Security and performance advisors
now report no findings.

## 2. Required backend architecture

- Supabase Auth owns user identity and sessions.
- PostgreSQL is the authoritative store for bakery business data.
- The generated Supabase Data API handles ordinary RLS-protected CRUD.
- Database functions handle atomic multi-table business operations.
- Supabase Storage holds private generated invoice PDFs when retention is
  enabled.
- Edge Functions handle private credentials, external email, signed webhooks,
  PDF generation where the database cannot perform it, scheduled reminders, and
  large/asynchronous exports.
- The React app does not receive database passwords, secret keys, provider
  secrets, or unrestricted service credentials.
- A separate NestJS/Express backend is not required for the MVP.

## 3. Environment and secrets

### Browser-safe

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

### Server-only, when the matching feature exists

- Supabase secret key for explicitly trusted server-to-server work.
- Transactional email provider API key and verified sender configuration.
- Webhook signing secrets.
- PDF renderer/service credentials if an external service is selected.

Server-only values belong in hosted function secrets or deployment secret
stores. They must not use a `VITE_` prefix, enter committed `.env` files, be
returned by an API, or appear in logs.

Production and development require separate Supabase projects and separate
credentials. The target project must be confirmed before a migration push.

## 4. Authentication and account lifecycle

The backend must support:

- Email/password signup and login.
- Secure session persistence, refresh-token rotation, and logout.
- Email verification when production policy enables it.
- Password-reset request and recovery completion.
- A profile linked one-to-one with `auth.users`.
- Authenticated creation of a bakery workspace and its initial owner
  membership in one transaction.
- Selection of an active bakery for users with multiple memberships.
- Removal/disablement behavior that prevents a removed member from continuing
  to access bakery data.
- Clear rules for account deletion, bakery transfer, and the last remaining
  owner before production launch.

Authorization must not use `raw_user_meta_data` or any user-editable JWT claim.
Roles should come from authoritative membership records or protected app
metadata with a documented token-refresh strategy.

## 5. Tenant and role model

Required roles:

- `owner`
- `manager`
- `staff`

The first MVP interface may expose owner-only administration, but the schema and
policies must not make all authenticated users equivalent.

Minimum authorization rules:

- A user sees a bakery only when an active `bakery_members` record links their
  `auth.uid()` to it.
- Every business query and mutation is limited to an authorized bakery.
- Membership administration, settings, invoice voiding, refunds, exports, and
  destructive configuration changes have explicit role requirements.
- The last owner cannot be removed or demoted without transferring ownership or
  deleting the bakery through an approved workflow.
- Cross-bakery reads and writes must be denied and covered by automated tests.

## 6. Required database model

All mutable tables use UUID primary keys and `created_at`; mutable user-facing
records also use `updated_at`. Bakery-owned top-level records contain a required
`bakery_id`.

### Identity and configuration

| Table | Required data |
|---|---|
| `profiles` | Auth user ID, full name, email/contact display fields, timestamps |
| `bakeries` | Name, timezone, currency, timestamps |
| `bakery_members` | Bakery, user, role, membership state, timestamps |
| `bakery_settings` | Business hours, equipment/capacity settings, scheduling buffers, units, inventory deduction trigger, starter defaults, notification defaults |
| `notification_preferences` | User/bakery, channels, enabled event types, reminder lead times |

### Customers, catalog, and costing

| Table | Required data |
|---|---|
| `customers` | Bakery, name, phone, email, full address, notes, archived flag, timestamps |
| `ingredients` | Bakery, name, base unit, current cost per base unit, minimum stock, active flag |
| `ingredient_purchases` | Bakery, ingredient, package quantity/unit, package price cents, purchased quantity, supplier, purchase time |
| `recipes` | Bakery, name/description, yield, selling price cents, packaging/labor/utility/overhead cents, flow, active flag |
| `recipe_ingredients` | Recipe, ingredient, quantity, unit, usage stage, sort order |
| `manual_expenses` | Bakery, category, description, amount cents, expense date, optional order/reference, archived flag |

Inventory on hand must be derivable from a transaction ledger. A cached balance
is allowed only if transactionally maintained and reconcilable.

### Production definitions

| Table | Required data |
|---|---|
| `production_flows` | Bakery, name/description, default/template flags, anchor type, grouping policy, active flag |
| `flow_steps` | Flow, name/instructions/category, timing method, day offset, clock time, relative step, minute offset, duration, dependency, notification, grouping eligibility, sort order, enabled flag |

Flow-step constraints must require only the fields valid for the selected timing
method and must reject dependency cycles.

### Orders, payments, and historical data

| Table | Required data |
|---|---|
| `orders` | Bakery, customer, status, fulfillment type, due time, customer/address snapshots, subtotal/deposit/balance cents, payment status, notes, timestamps |
| `order_items` | Order, recipe, product snapshot, quantity, unit price/cost cents, recipe snapshot JSON, flow snapshot JSON, notes |
| `payments` | Bakery, order, amount cents, method, status/type, paid/refunded time, notes, immutable reference to original payment where applicable |
| `invoices` | Bakery, order, unique invoice number, issue/due dates, bakery/customer snapshots, status, subtotal/paid/balance cents, notes, issue/void timestamps |
| `invoice_items` | Invoice, description/product snapshot, quantity, unit price cents, line total cents, sort order |
| `invoice_deliveries` | Invoice, recipient, attempt number, delivery state, provider message ID, sent/failed timestamps, failure reason |

Required order statuses: `draft`, `confirmed`, `in_production`, `ready`,
`completed`, `cancelled`.

Required payment statuses: `unpaid`, `partially_paid`, `paid`, `refunded`.

Required invoice statuses: `draft`, `sent`, `partially_paid`, `paid`, `overdue`,
`void`.

Confirmed orders and issued invoices preserve customer, product, price, cost,
recipe, flow, and instruction snapshots. Later edits must not rewrite history.

### Production, starter, inventory, and notifications

| Table | Required data |
|---|---|
| `production_tasks` | Bakery, source order/item/flow step, name/instructions, scheduled time, duration, status, category, dependency, grouping ID, completion/skip/reschedule metadata, notes |
| `starter_profiles` | Bakery, name, hydration percent, retained target, current amount, default feeding ratio, estimated peak settings, active flag |
| `starter_builds` | Bakery, profile/task, seed/flour/water/total/usable/retained quantities, planned peak, approval/override state |
| `starter_build_contributors` | Build, order/item/task, required amount, compatibility/grouping evidence |
| `inventory_transactions` | Bakery, ingredient, type, signed quantity change, source/reference, idempotency key, actor, notes, timestamp |
| `notifications` | Bakery, recipient, event type, title/body, source reference, read/dismissed/delivery state, timestamps |

Required task statuses include `upcoming`, `due`, `overdue`, `completed`, and
`skipped`; the implementation may persist a canonical `pending` state and derive
due/overdue from time, but the API and UI vocabulary must be consistent.

Required inventory transaction types: `purchase`, `production_usage`, `waste`,
`manual_adjustment`, and `return`.

## 7. Database integrity requirements

- Foreign keys define every relationship and use intentional delete behavior.
- Uniqueness includes membership per bakery/user, appropriate normalized
  ingredient/recipe/customer keys, idempotency keys, and invoice number per
  bakery.
- Check constraints enforce nonnegative prices, sensible quantities and
  durations, valid totals, supported enum values, and snapshot requirements at
  lifecycle boundaries.
- Money uses integer cents.
- Operational quantities use `numeric`, not floating point.
- Timestamps use `timestamptz` and UTC storage.
- `updated_at` is server-maintained.
- Search/filter indexes cover bakery plus common status, due/scheduled time,
  archived flag, customer, order, and ingredient access patterns.
- Foreign-key columns used in joins or policy checks are indexed.
- Ledger and delivery-attempt records are append-oriented.
- Views exposed to API roles use invoker security or are placed in an
  unexposed schema with restricted grants.

## 8. Row-Level Security and Data API grants

RLS is mandatory on every table in an exposed schema, including lookup or child
tables reachable through relationships.

Policies must cover:

- Own-profile access.
- Bakery membership-based reads.
- Role-aware inserts, updates, archive/restore, and controlled deletes.
- Ownership validation for both the old row (`USING`) and new row
  (`WITH CHECK`) on updates.
- Child rows by joining through their bakery-owned parent.
- Notification recipient access.
- Private storage objects by bakery membership.

`TO authenticated` alone is not sufficient authorization. Every policy must
also test bakery membership, ownership, or the specific resource rule.

Data API grants and RLS are separate controls. Required roles receive only the
table/function privileges needed for the documented API. Unused tables and
functions are not exposed by default.

## 9. Transactional business operations

The following operations must run atomically and validate authorization inside
the transaction:

### Workspace creation

Create the bakery, owner membership, default settings, starter profile, default
ingredients/recipes/flows, and any per-bakery seed data without leaving a
partially initialized workspace.

### Order confirmation and plan generation

1. Lock/validate the editable draft.
2. Validate customer, items, prices, due time, and assigned flows.
3. Copy customer, address, product, recipe, price, cost, and flow snapshots.
4. Scale recipe requirements.
5. Generate dependency-ordered tasks backward from fulfillment time in the
   bakery timezone.
6. Calculate and combine compatible starter builds while retaining contributors.
7. Calculate inventory requirements and return shortages/warnings.
8. Persist one plan per confirmation/version with an idempotency key.
9. Transition the order only if every required write succeeds.

### Regeneration and rescheduling

- Recalculation must not duplicate tasks.
- Completed or skipped work is preserved.
- The user is shown which future tasks/dependencies will move.
- Impossible schedules and capacity conflicts return warnings.
- A retry with the same idempotency key returns the original result.

### Task completion and inventory

- Completing the configured trigger task appends production-usage movements
  once.
- Repeated completion requests cannot deduct inventory twice.
- Waste, returns, purchases, and adjustments are explicit ledger events.
- Every movement records its source and actor.

### Payments and invoices

- Payments and refunds are recorded; original history is not silently edited.
- Order payment totals and state are recalculated in the same transaction.
- Invoice creation copies order/customer/item snapshots.
- Issuance allocates a unique bakery invoice number and freezes issued content.
- Failed email delivery appends a failed attempt and never marks the invoice as
  successfully sent.
- Voiding requires authorization, confirmation, reason, and timestamp.

## 10. Scheduling and calculation requirements

- All stored timestamps are UTC; all business-day and clock-time calculations
  use the bakery's IANA timezone.
- Supported scheduling: relative to pickup, fixed time on a relative day,
  relative to another step, immediately after another step, and duration-based
  backward scheduling.
- Dependencies form an acyclic graph.
- Compatible-task and starter-build grouping retains every source order/item.
- Starter calculations expose seed, flour, water, total, usable, retained, and
  estimated peak quantities/times.
- Ingredient requirements include recipes, packaging, and starter-build inputs
  without double counting.
- Revenue, costs, gross profit, and margin use immutable order snapshots for
  historical reporting.
- CSV exports cover orders, sales, expenses, and ingredients with bakery and
  role authorization.

## 11. Storage, functions, and notifications

### Storage

- A private `invoice-pdfs` bucket is required only when PDFs are retained.
- Paths include bakery and invoice IDs.
- Access uses RLS-backed authorization or short-lived signed links.
- MIME type, file-size, retention, and version rules are enforced.

### Edge Functions

Required server-side capabilities:

- Render an invoice PDF from authoritative issued data.
- Email an invoice through a selected transactional email provider.
- Record every delivery attempt and provider result.
- Dispatch scheduled task, pickup, shortage, unpaid-balance, and delivery
  notifications.
- Produce large or asynchronous exports when direct client export is
  insufficient.
- Verify any provider webhook signature against the raw request body and apply
  events idempotently.

### Notifications

Support in-app notifications for task reminders, starter shortage/build issues,
inventory shortages, upcoming pickups, unpaid balances, and invoice delivery
success/failure. Read/dismiss state and user preferences persist. Browser/email
delivery is opt-in and cannot be treated as guaranteed.

## 12. Seed and bootstrap requirements

Development and new-workspace bootstrap data must include:

- Ingredients used by the default recipes, including flour, water, salt,
  starter, and olive oil with correct base units.
- Sourdough loaf recipe: 500 g flour, 350 g water, 10 g salt, 100 g starter,
  yield one loaf.
- Focaccia recipe: 1,000 g flour, 500 g water, 20 g salt, 200 g starter, 50 ml
  olive oil, configurable yield.
- Standard sourdough production flow, including shaping before cold
  fermentation.
- Standard focaccia production flow, with transfer to tray/container and no
  shaping step.
- A default starter profile and bakery settings where the product requirements
  define defaults.

Repository `seed.sql` is for deterministic local development. Production
workspace defaults should be created by a versioned, idempotent bootstrap
operation rather than by running global development seed data.

## 13. Reliability, performance, and observability

- Safe requests may retry with bounded exponential backoff.
- Mutations with side effects use idempotency keys.
- The UI does not claim success before the server confirms it.
- Unsaved client data is protected during recoverable network failures.
- Typical dashboard/task queries should complete fast enough to support an
  approximately two-second page load under normal MVP usage.
- List APIs are paginated and select only needed columns.
- Slow queries and policy-heavy joins receive reviewed indexes.
- Server failures have structured error codes and correlation IDs.
- Logs exclude access tokens, secret keys, passwords, full invoice PDFs, and
  unnecessary customer-sensitive fields.
- Database backups, point-in-time recovery expectations, retention, and restore
  testing must be chosen before production launch.

## 14. Migration and deployment requirements

- `Front-end/supabase/migrations` is the database source of truth.
- Every schema, policy, grant, function, trigger, bucket-policy, and seed change
  is versioned and reviewable.
- Do not make dashboard-only database changes.
- Create and review migrations using the pinned project CLI.
- Rebuild a clean local database from migrations and seed data before pushing.
- Regenerate and commit `database.types.ts`.
- Compare local and linked migration history before deployment.
- Apply only reviewed pending migrations to the confirmed development project.
- Never use a hosted database reset as a normal deploy or recovery step.
- Run Supabase security and performance advisors after material changes.
- Promote reviewed migrations separately to a distinct production project.
- Document backward compatibility and rollback/forward-fix handling for risky
  migrations.

## 15. Test requirements

### Database and security

- Every migration applies to a clean local database.
- Schema/type drift check passes.
- RLS tests prove allowed same-bakery access and denied cross-bakery access for
  every resource and role.
- Function permission tests cover anonymous, member, and unauthorized callers.
- Constraints, cascades/restrict behavior, and unique keys are tested.

### Integration

- Signup/login/session/logout/recovery.
- Workspace bootstrap and membership changes.
- Customer, ingredient, recipe, flow, order, payment, and invoice operations.
- Order confirmation and idempotent task generation.
- Reschedule/regenerate behavior with completed tasks.
- Starter combination and inventory shortage calculations.
- Single inventory deduction under repeated completion.
- Invoice PDF access, successful/failed email attempts, resend, and void.
- Reporting totals and CSV exports from historical snapshots.

### Release checks

- Type checking, lint, unit tests, integration tests, end-to-end tests, and
  production build pass.
- Generated types are current.
- No committed secret or local Supabase link state exists.
- Security and performance advisor findings are reviewed.
- The deployed environment uses the intended project and redirect URLs.

## 16. Required decisions before production

The requirements identify these needs but do not yet select an implementation:

1. Transactional email provider, sender domain, bounce/webhook behavior, and
   rate limits.
2. Invoice PDF renderer and whether PDFs are retained or generated on demand.
3. Secure invoice-link lifetime, revocation, and public-view behavior.
4. Production email-confirmation policy and SMTP configuration.
5. Account deletion, bakery ownership transfer, record retention, and export
   policy.
6. Backup/PITR service level and tested restore process.
7. Whether inventory balance is computed on read or transactionally cached.
8. Canonical task-state storage versus derived due/overdue state.
9. Notification channels and browser-push provider, if push is included.
10. Rate limits and abuse controls for exports, invoice delivery, signup, and
    password recovery.

No payment processor is required for the MVP unless online payment collection
is added to the product scope.

## 17. Completion criteria

The backend is MVP-ready when:

- The complete schema is reproducible from committed migrations.
- Real Auth and bakery workspace bootstrap replace the mock adapter.
- RLS and grants prevent every tested cross-bakery access path.
- Frontend screens use one persisted source of truth.
- Order confirmation transactionally produces snapshots, tasks, starter plans,
  requirements, and warnings without duplicates.
- Payments, invoice issuance/PDF/delivery, inventory movements, reporting, and
  notifications meet the requirements above.
- Generated types and API documentation match the deployed schema/functions.
- Required automated tests, local reset, advisors, and deployment verification
  pass with no exposed secrets.
