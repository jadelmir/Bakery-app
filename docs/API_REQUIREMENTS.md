> Canonical path: `docs/API_REQUIREMENTS.md`. Source of truth for all API contracts.

# Bakery App API

**Version:** 1.0  
**Last audited:** July 29, 2026  
**Backend:** Supabase Auth, PostgreSQL Data API, Storage, and Edge Functions  
**Implementation status:** Supabase foundation, Auth, multi-store workspaces,
membership RLS, and secure team invitations are implemented. Remaining bakery
domain APIs are required but not yet implemented.

## 1. Purpose and status

This document is the canonical API inventory for the Bakery App. It separates
the API that exists in the repository today from the API required for the MVP.

### Implemented today

- A pinned Supabase JavaScript client and CLI dependency.
- Public browser configuration through `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY`.
- A typed browser-client boundary in `Front-end/src/lib/supabase/client.ts`.
- Generated TypeScript database types representing the current empty `public`
  application schema.
- Local Supabase configuration with the `public` and `graphql_public` schemas
  exposed by the Data API.
- A harmless baseline migration plus a conditional permission-hardening
  migration; neither creates application objects.
- Supabase Auth login, signup, logout, and session restoration.
- `profiles`, `bakeries`, `bakery_memberships`, and `bakery_invitations`.
- Membership-backed RLS, atomic first-bakery onboarding, default selection,
  role management, final-owner protection, and invitation consumption RPCs.
- The authenticated `send-bakery-invite` Edge Function.

### Not implemented today

- Password recovery and the production custom-SMTP configuration.
- Order, production, inventory, customer, finance, and other bakery domain
  tables, policies, and seed records.
- Frontend Data API calls outside authentication and workspace/team access.
- Storage buckets, Realtime subscriptions, Edge Functions, scheduled jobs,
  invoice PDF generation, invoice email delivery, or third-party webhooks.

The resource and operation names in sections 5–8 are the required contract for
future backend phases. They become live only after a reviewed SQL migration or
Edge Function implements them.

### Connected development project audit

The connected hosted Supabase development project was verified on July 29,
2026:

- No `public` tables.
- Both committed foundation migrations are recorded and match local history.
- No deployed Edge Functions.
- No performance-advisor findings.
- No remaining security-advisor findings. A forward migration revoked execute
  access to the inherited `public.rls_auto_enable()` helper from `PUBLIC`,
  `anon`, and `authenticated`.

Advisor references:

- [Anonymous execution warning](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Authenticated execution warning](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)

## 2. API architecture

The browser uses the Supabase JavaScript client. Normal bakery-scoped CRUD uses
the generated PostgreSQL Data API and is protected by Row-Level Security (RLS).
Multi-record business operations use database functions so they can run in one
transaction. Operations that require private credentials or external network
calls use Edge Functions.

| API surface | Base path | Intended use |
|---|---|---|
| Auth | `{SUPABASE_URL}/auth/v1` | Accounts, sessions, verification, and password recovery |
| Data API | `{SUPABASE_URL}/rest/v1` | RLS-protected table CRUD and database functions |
| Storage | `{SUPABASE_URL}/storage/v1` | Private invoice PDFs and future bakery assets |
| Edge Functions | `{SUPABASE_URL}/functions/v1` | Invoice delivery, reminders, webhooks, and other secret-bearing work |
| Realtime | Supabase Realtime connection | Optional live task and notification updates after persistence exists |

Frontend code should use `@supabase/supabase-js`, not assemble these URLs
directly.

## 3. Configuration and authentication

### Browser environment variables

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Both values are browser-visible. Authorization depends on RLS, not on hiding the
publishable key.

Never put a Supabase secret key, legacy `service_role` key, database password,
SMTP credential, invoice-delivery provider key, or other private credential in
a `VITE_` variable.

### Authentication operations

| User action | Supabase client operation | Access | Status |
|---|---|---|---|
| Create account | `supabase.auth.signUp({ email, password })` | Public | Required |
| Log in | `supabase.auth.signInWithPassword({ email, password })` | Public | Required |
| Restore session | `supabase.auth.getSession()` plus `onAuthStateChange` | Public | Required |
| Log out | `supabase.auth.signOut()` | Authenticated | Required |
| Request password reset | `supabase.auth.resetPasswordForEmail(email, options)` | Public | Required |
| Set recovered password | `supabase.auth.updateUser({ password })` | Recovery session | Required |
| Resend verification | `supabase.auth.resend(...)` | Public | Required when email confirmation is enabled |

Every Data API call for business data must carry the signed-in user's session.
The Supabase client sends the session JWT automatically. A request without a
valid user session must not be able to read or modify bakery data.

For direct HTTP integrations, a signed-in user request uses:

```http
apikey: <publishable-key>
Authorization: Bearer <user-access-token>
Content-Type: application/json
```

Secret keys are reserved for trusted server-side work. They must never be sent
to the browser.

## 4. Common API conventions

### Tenant boundary

- Every bakery-owned top-level record contains `bakery_id`.
- Child records inherit their bakery through a required parent relationship and
  may also carry `bakery_id` where this materially simplifies safe RLS and
  queries.
- RLS verifies membership through `bakery_members`; frontend filters are never
  an authorization control.
- The active bakery must be explicit when a user belongs to multiple bakeries.

### Identifiers, time, money, and units

- Primary keys: UUID.
- Timestamps: `timestamptz`, stored in UTC and returned as ISO 8601 strings.
- Bakery-local display: convert using `bakeries.timezone`, default
  `America/New_York`.
- Money: integer cents (`1250` means `$12.50`); never floating point.
- Quantities and ratios: PostgreSQL `numeric`, with a documented base unit.
- Currency: ISO 4217 code, default `USD`.

### Reads, filtering, and pagination

- Lists must be scoped to the active bakery and use deterministic ordering.
- UI lists use a finite page size; the local Data API is configured with a
  1,000-row response ceiling.
- Archived records are excluded by default and included only through an
  explicit filter.
- Search inputs must be bounded and escaped through the Supabase client query
  builder.
- Detail reads use `.single()` only when uniqueness is guaranteed.

### Writes and concurrency

- Clients send only writable fields; server-generated IDs, timestamps, totals,
  and ownership fields are not trusted from the browser.
- Updates use `updated_at` or an equivalent version check when overwriting
  concurrent edits could lose data.
- Destructive business records are archived or voided. Hard deletion is limited
  to safe draft/configuration records with no historical references.
- Order confirmation, task regeneration, inventory deduction, payment
  application, invoice issuance, and invoice voiding are transactional and
  idempotent.

### Response and error handling

Supabase table calls return:

```ts
const { data, error, count } = await supabase
  .from("customers")
  .select("*", { count: "exact" });
```

The application must:

- Treat `error` as a failed operation and show an actionable message.
- Never update irreversible UI state before the server confirms the write.
- Distinguish validation, authentication, authorization, conflict, not-found,
  rate-limit, network, and unexpected server errors.
- Log a correlation or request identifier for server-side failures when one is
  available, without logging tokens or customer-sensitive data.

Edge Functions return JSON errors in this shape:

```json
{
  "error": {
    "code": "stable_machine_code",
    "message": "Safe human-readable message",
    "request_id": "optional-correlation-id"
  }
}
```

## 5. Required Data API resources

The exact generated REST syntax comes from the implemented PostgreSQL schema.
The following table defines the required resource surface and access model.

| Resource | Required operations | Important relationships and rules | Status |
|---|---|---|---|
| `profiles` | Read/update own profile | `id = auth.uid()`; no role claims from user-editable metadata | Required |
| `bakeries` | Create/read/update | Update limited to authorized bakery roles | Required |
| `bakery_members` | List, invite/add, update role, remove | Membership changes require owner authorization; never allow removal of the last owner | Required |
| `customers` | List/search/create/read/update/archive/restore | Bakery-scoped; warn on duplicate normalized email or phone; historical snapshots remain unchanged | Required |
| `ingredients` | List/create/read/update/archive/restore | Bakery-scoped; base unit is grams, milliliters, or units | Required |
| `ingredient_purchases` | List/create/read/update | Records package quantity, package price, supplier, and purchase time | Required |
| `inventory_transactions` | List/create through controlled operation | Append-oriented ledger; purchase, production usage, waste, adjustment, or return | Required |
| `recipes` | List/create/read/update/duplicate/archive/restore | Bakery-scoped; money in cents; assigned production flow | Required |
| `recipe_ingredients` | List/create/update/delete within recipe editing | Quantity/unit validation and deterministic sort order | Required |
| `production_flows` | List/create/read/update/duplicate/archive | Bakery-scoped reusable templates | Required |
| `flow_steps` | List/create/update/delete/duplicate/reorder/enable | Validate dependency graph and timing method fields | Required |
| `orders` | List/search/create draft/read/update/confirm/reschedule/cancel/status transitions | Bakery and customer scoped; confirmed/completed history uses snapshots | Required |
| `order_items` | List/create/update/delete while editable | Snapshot product, recipe, price, cost, and flow at confirmation | Required |
| `payments` | List/create/refund/void as allowed | Amounts in cents; updates order payment state transactionally | Required |
| `production_tasks` | List by range/order/status; complete/skip/reschedule/add notes | Retains source order/item/flow-step links; lifecycle changes use controlled operations | Required |
| `starter_profiles` | List/create/read/update/archive | Bakery-scoped hydration, retained target, current amount, and default ratio | Required |
| `starter_builds` | List/read/approve/update allowed overrides | Retains contributing orders/tasks and calculated quantities | Required |
| `manual_expenses` | List/create/read/update/archive | Bakery-scoped reporting input; money in cents | Required |
| `invoices` | List/search/create draft/read/update draft/issue/void | Unique bakery invoice number; immutable issued snapshots | Required |
| `invoice_items` | List/create/update/delete while invoice is draft | Usually copied from order items; immutable after issue | Required |
| `invoice_deliveries` | Read list/detail | Append-only attempts with recipient, provider result, timestamps, and failure reason | Required |
| `notifications` | List/read/mark read/dismiss | Bakery/user scoped; links to its source record when applicable | Required |
| `notification_preferences` | Read/update own preferences | Per-user delivery channel and lead-time choices | Required |
| `bakery_settings` | Read/update | Timezone, currency, business hours, buffers, deduction trigger, units, and operational defaults | Required |

Direct grants must be explicit. RLS must be enabled before `anon` or
`authenticated` can access any exposed business table.

## 6. Required transactional database operations

Multi-table state changes must not be implemented as an unprotected sequence of
browser CRUD calls. Names below are the proposed stable RPC contract; migrations
must document arguments and return types before frontend adoption.

| Proposed RPC | Purpose | Key requirements |
|---|---|---|
| `create_bakery_workspace` | Create a bakery and first owner membership | Authenticated user only; one transaction; safe retry behavior |
| `confirm_order` | Validate a draft, freeze customer/item/recipe/flow/cost snapshots, check shortages, and generate its plan | Bakery membership; idempotency key; no partial confirmation |
| `regenerate_order_plan` | Recalculate only eligible future work after an order timing change | Preserve completed/skipped work; prevent duplicate tasks; return warnings |
| `transition_order_status` | Enforce valid order lifecycle transitions | Reject invalid/backward transitions unless a dedicated reversal exists |
| `complete_production_task` | Complete a task and apply configured inventory usage once | Idempotent; records completion time and actor |
| `skip_production_task` | Skip a task with reason | Enforce reason and dependency rules |
| `reschedule_production_task` | Move a task and optionally eligible dependents | Return affected tasks and conflicts |
| `record_inventory_transaction` | Append a validated stock movement | Never directly overwrite ledger-derived stock |
| `record_payment` | Add payment and recalculate balance/status | Reject invalid amounts; preserve payment history |
| `refund_payment` | Record a refund and recalculate totals | Authorized role; cannot silently mutate original payment |
| `create_invoice_from_order` | Create a draft invoice from order/customer/item snapshots | Idempotent for the selected business rule |
| `issue_invoice` | Allocate invoice number and freeze issued values | Atomic unique numbering per bakery |
| `void_invoice` | Void with reason and timestamp | Confirmation and authorization required |
| `mark_notification_read` | Update user notification state | Only the notification recipient |

Privileged database functions must use the invoker's rights wherever possible.
Any necessary `SECURITY DEFINER` function must live outside exposed schemas,
set a safe `search_path`, check `auth.uid()` and bakery authorization internally,
and have execute grants restricted to its intended roles.

## 7. Required Edge Functions and external integrations

| Function | Caller/auth | Responsibility | External dependency | Status |
|---|---|---|---|---|
| `render-invoice-pdf` | Authenticated authorized user or internal service | Render an issued invoice from immutable server-side data and store the PDF privately | PDF renderer/runtime | Required; provider not selected |
| `send-invoice-email` | Authenticated authorized user | Confirm recipient, render/reuse PDF, send email, and append a delivery attempt | Transactional email provider | Required; provider not selected |
| `invoice-public-link` | Signed-link request | Return or validate a short-lived secure link without exposing unrelated bakery data | Supabase Storage signed URLs or dedicated token | Optional MVP capability |
| `dispatch-reminders` | Scheduled trusted caller | Create/send task, pickup, shortage, payment, and invoice-delivery notifications | Cron and optional browser/email provider | Required for automated reminders |
| `export-bakery-data` | Authenticated authorized user | Produce bounded CSV exports for orders, sales, expenses, and ingredients | None unless asynchronous storage is used | Required |
| Provider webhooks | Signed external caller | Verify raw-body signature and update delivery/payment state idempotently | Selected provider | Only when a provider requires it |

Publicly reachable webhook functions must disable Supabase user-JWT verification
only when necessary and must verify the provider's signature before reading or
writing protected data. Edge Functions must keep all private provider keys in
server-side secrets.

No online payment processor is required for the current MVP: payments are
records of amounts, methods, statuses, and refunds. Adding Stripe or another
processor is a separate approved change.

## 8. Storage contract

The MVP needs a private `invoice-pdfs` bucket when generated PDFs are retained.

- Object path: `{bakery_id}/{invoice_id}/{document_version}.pdf`.
- Allowed MIME type: `application/pdf`.
- Browser uploads are not required.
- Reads use an authenticated authorization check or short-lived signed URL.
- Reissuing or rerendering does not overwrite an immutable issued document
  without a recorded document version.
- Storage object policies must enforce bakery membership; knowledge of an object
  path is never sufficient authorization.
- Retention and deletion rules must be decided before production launch.

No recipe-image or customer-upload bucket is currently required.

## 9. Query examples for the future implementation

These examples are illustrative and must be enabled only after the matching
schema, grants, and RLS policies exist.

```ts
const { data: customers, error } = await supabase
  .from("customers")
  .select("id, name, phone, email, is_archived, updated_at")
  .eq("bakery_id", activeBakeryId)
  .eq("is_archived", false)
  .order("name")
  .range(0, 49);
```

```ts
const { data: tasks, error } = await supabase
  .from("production_tasks")
  .select("*, orders(id, customer_name_snapshot), order_items(id, product_name_snapshot)")
  .eq("bakery_id", activeBakeryId)
  .gte("scheduled_at", rangeStartUtc)
  .lt("scheduled_at", rangeEndUtc)
  .order("scheduled_at");
```

```ts
const { data: result, error } = await supabase.rpc("confirm_order", {
  p_order_id: orderId,
  p_idempotency_key: idempotencyKey,
});
```

```ts
const { data, error } = await supabase.functions.invoke("send-invoice-email", {
  body: { invoiceId, recipientEmail },
});
```

## 10. Versioning and change control

- PostgreSQL migrations are the schema and Data API source of truth.
- Edge Function folders and their tests are the function API source of truth.
- Generated TypeScript database types must be committed and regenerated after
  every schema change.
- Breaking renames/removals require a coordinated migration, frontend change,
  and update to this document.
- Dashboard-only schema edits are prohibited.
- The linked development project must be checked before every push; a hosted
  database reset is not a normal deployment or recovery step.

## 11. API readiness checklist

An API area is ready only when:

1. Its migration or Edge Function is committed.
2. Required constraints, indexes, grants, and RLS policies are present.
3. Cross-bakery denial and authorized success cases are tested.
4. Generated types and this document match the implementation.
5. Validation, idempotency, errors, and loading behavior are tested.
6. Security and performance advisor findings have been reviewed.
7. No secret appears in browser code, logs, fixtures, or committed environment
   files.
