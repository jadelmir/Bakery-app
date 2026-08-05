# Bakery App â€” Technical Stack & Backend Requirements

**Version:** 1.1  
**Purpose:** Technical implementation guide for an AI coding agent  
**Project type:** Mobile-first bakery production, costing, order, inventory, and customer management app

## Active implementation

**Current OpenSpec change:** `add-multi-store-workspaces`  
**Change artifacts:** `openspec/changes/add-multi-store-workspaces/`  
**Implementation owner:** active Codex task  
**Status:** implementation and local/hosted development verification complete
as of July 29, 2026; ready for OpenSpec archival

The Supabase development foundation prerequisite is complete and verified in
local and hosted development environments. The active change replaces mock
authentication with Supabase Auth and adds:

- a required bakery-selection gate after login;
- automatic creation of a first bakery with an Owner membership;
- support for one user belonging to multiple bakery stores;
- an active-bakery switcher and optional saved default bakery;
- Owner, Manager, and Staff role enforcement;
- secure email invitations, acceptance, decline, revocation, and expiry;
- verified-email invitation consumption and atomic Owner transfer;
- RLS-backed tenant isolation for all workspace data.

Other agents must treat the OpenSpec artifacts above and this requirements file
as the current source of truth. Do not add bakery-scoped frontend data loading
outside the active-bakery boundary or bypass membership checks with client-only
filters.

**Detailed backend references:**

- [`docs/API_REQUIREMENTS.md`](docs/API_REQUIREMENTS.md) â€” API surfaces,
  resource operations, authentication, RPCs, Edge Functions, and current
  implementation status.
- [`docs/BACKEND_REQUIREMENTS.md`](docs/BACKEND_REQUIREMENTS.md) â€” complete
  database, security, business transaction, integration, deployment, and test
  requirements plus the repository gap audit.
- [`docs/MULTI_AGENT_DELIVERY.md`](docs/MULTI_AGENT_DELIVERY.md) â€” orchestrator
  workflow, OpenSpec task assignments, Sol/Terra selection, phase workstreams,
  and integration gates.

---

## 1. Recommended MVP Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- ShadCN UI
- React Router
- TanStack Query
- React Hook Form
- Zod
- date-fns
- Lucide React
- Recharts
- Vitest
- React Testing Library
- Playwright

### Backend

Use Supabase for the MVP.

Supabase should provide:

- PostgreSQL database
- Authentication
- Row-Level Security
- Database APIs
- File storage
- SQL migrations
- Generated TypeScript database types
- Edge Functions only when needed

Do not create a separate NestJS backend for the MVP unless a feature truly requires it.

### Hosting

- Frontend: Cloudflare Pages
- Backend: Supabase Cloud

---

## 2. Architecture

```text
React + TypeScript
        |
        â”œâ”€â”€ Supabase Auth
        â”œâ”€â”€ Supabase PostgreSQL
        â”œâ”€â”€ Supabase Storage
        â””â”€â”€ Supabase Edge Functions when needed
```

The frontend may communicate directly with Supabase for normal CRUD operations.

Use Edge Functions only for:

- Secure production-plan generation if needed
- Scheduled reminders
- Email sending
- Payment webhooks
- Operations requiring secret API keys

---

## 3. Agent Setup Responsibilities

The developer or project owner must manually:

1. Create the Supabase account.
2. Create the Supabase project.
3. Select the project region.
4. Store the database password securely.
5. Connect the coding agent using Supabase MCP or Supabase CLI.
6. Keep billing and account ownership under personal control.
7. Add environment variables locally and in hosting settings.

The coding agent may handle:

- SQL migrations
- Database schema
- Foreign keys
- Indexes
- Row-Level Security policies
- Authentication integration
- Seed data
- Storage buckets
- TypeScript type generation
- React data hooks
- CRUD screens
- Production scheduling logic
- Starter calculations
- Inventory transactions
- Automated tests
- Setup documentation

All database changes must be written as migration files and committed to Git.

---

## 4. Security Requirements

### Environment Variables

Frontend-safe environment variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Never expose these in frontend code:

- Supabase secret key
- Service role key
- Database password
- Third-party private API keys

Do not commit `.env` files.

Include:

```text
.env
.env.local
.env.*.local
```

in `.gitignore`.

### Row-Level Security

Enable Row-Level Security on every business-owned table.

Users must only access data belonging to their bakery workspace.

Every main table should contain:

```text
bakery_id
```

RLS policies must verify that the authenticated user belongs to that bakery.

Do not rely only on frontend filtering.

---

## 5. Multi-Tenant Model

Even if the MVP initially has one user, design it for multiple bakeries.

Core tables:

```text
profiles
bakeries
bakery_members
customers
ingredients
ingredient_purchases
inventory_transactions
recipes
recipe_ingredients
production_flows
flow_steps
orders
order_items
production_tasks
payments
```

Suggested membership roles:

```text
owner
manager
staff
```

All three roles are part of the active MVP implementation:

- `owner`: manage the bakery, members, invitations, and roles; at least one
  Owner must always remain.
- `manager`: operate the bakery and manage Staff membership/invitations, but
  cannot grant or remove Owner access.
- `staff`: use bakery operations without team-administration privileges.

An authenticated user may belong to multiple bakeries. No bakery business data
may load until the user explicitly confirms an accessible active bakery. A
saved default bakery is a preference only and must be revalidated against
current membership before use.

---

## 6. Core Database Requirements

### Profiles

```text
id
full_name
email
phone
default_bakery_id
created_at
updated_at
```

### Bakeries

```text
id
name
timezone
currency
created_at
updated_at
```

Default timezone:

```text
America/New_York
```

Default currency:

```text
USD
```

### Bakery Members

```text
id
bakery_id
user_id
role
created_at
updated_at
```

Required constraints:

- one membership per `bakery_id` and `user_id`;
- role constrained to `owner`, `manager`, or `staff`;
- membership access enforced with RLS;
- transactional final-owner protection.

### Bakery Invitations

```text
id
bakery_id
email
normalized_email
role
status
token_hash
invited_by
expires_at
accepted_at
declined_at
revoked_at
created_at
updated_at
```

Invitation status is constrained to `pending`, `accepted`, `declined`,
`revoked`, or `expired`. Only token hashes may be stored. Pending invitations
must be deduplicated by bakery and normalized email, rate limited, and accepted
only by an authenticated account whose email matches the invitation.

### Customers

```text
id
bakery_id
name
phone
email
address_line_1
address_line_2
city
state
postal_code
notes
is_archived
created_at
updated_at
```

### Ingredients

```text
id
bakery_id
name
base_unit
current_cost_per_base_unit
minimum_stock_quantity
is_active
created_at
updated_at
```

Base units:

```text
grams
milliliters
units
```

### Ingredient Purchases

```text
id
bakery_id
ingredient_id
package_quantity
package_price_cents
quantity_purchased
supplier
purchased_at
created_at
```

### Inventory Transactions

```text
id
bakery_id
ingredient_id
transaction_type
quantity_change
reference_type
reference_id
notes
created_at
```

Transaction types:

```text
purchase
production_usage
waste
manual_adjustment
return
```

Do not only store a manually editable current quantity.

Inventory must be traceable through transactions.

### Recipes

```text
id
bakery_id
name
description
batch_yield
yield_unit
selling_price_cents
packaging_cost_cents
labor_cost_cents
utility_cost_cents
overhead_cost_cents
production_flow_id
is_active
created_at
updated_at
```

### Recipe Ingredients

```text
id
recipe_id
ingredient_id
quantity
unit
sort_order
created_at
```

### Production Flows

```text
id
bakery_id
name
description
is_default
is_template
anchor_type
created_at
updated_at
```

Possible anchor types:

```text
pickup_time
delivery_time
bake_time
```

### Flow Steps

```text
id
production_flow_id
name
instructions
category
timing_method
days_offset
time_of_day
relative_to_step_id
offset_minutes
duration_minutes
notification_enabled
sort_order
is_active
created_at
updated_at
```

Possible timing methods:

```text
relative_to_order
fixed_time_relative_day
relative_to_step
immediately_after_step
```

### Orders

```text
id
bakery_id
customer_id
order_status
fulfillment_type
due_at
delivery_address_snapshot
customer_name_snapshot
customer_phone_snapshot
customer_email_snapshot
subtotal_cents
deposit_cents
balance_cents
payment_status
notes
created_at
updated_at
```

Order statuses:

```text
draft
confirmed
in_production
ready
completed
cancelled
```

Payment statuses:

```text
unpaid
partially_paid
paid
refunded
```

### Order Items

```text
id
order_id
recipe_id
product_name_snapshot
quantity
selling_price_cents
cost_per_unit_cents
recipe_snapshot_json
flow_snapshot_json
notes
created_at
```

### Production Tasks

```text
id
bakery_id
order_id
order_item_id
flow_step_id
name
instructions
scheduled_at
duration_minutes
status
category
dependency_task_id
combined_group_id
completed_at
notes
created_at
updated_at
```

Task statuses:

```text
upcoming
due
overdue
completed
skipped
```

### Payments

```text
id
bakery_id
order_id
amount_cents
payment_method
payment_status
paid_at
notes
created_at
```

---

## 7. Money Requirements

Store money as integer cents.

Example:

```text
$12.50 = 1250
```

Never store currency values as floating-point numbers.

Format all user-facing money in USD for the MVP.

---

## 8. Time and Scheduling Requirements

Store timestamps in UTC.

Display all times using the bakery timezone.

When confirming an order:

1. Load each ordered recipe.
2. Scale recipe quantities.
3. Load its assigned production flow.
4. Work backward from fulfillment time.
5. Generate production tasks.
6. Calculate starter requirements.
7. Combine compatible tasks when allowed.
8. Check inventory requirements.
9. Store cost and recipe snapshots.
10. Show shortages before final confirmation.

Task dependencies must be supported.

When a task is delayed, ask whether incomplete dependent tasks should move by the same amount.

---

## 9. Historical Snapshot Requirements

Completed and confirmed orders must preserve their original values.

Store snapshots for:

- Customer name
- Customer phone
- Customer email
- Delivery address
- Product name
- Recipe ingredients
- Selling price
- Cost per unit
- Production flow
- Task instructions

Editing a recipe, customer, cost, or flow later must not change historical orders.

---

## 10. Starter Calculation Requirements

The app must support:

- Required starter amount
- Existing starter amount
- Retained starter target
- Feeding ratio
- Flour quantity
- Water quantity
- Total starter produced
- Estimated peak time

Example:

```text
20 g existing starter
60 g flour
60 g water
140 g total starter
```

Starter calculations should be implemented in a pure TypeScript utility with unit tests.

---

## 11. Default Seed Data

Create seed data for:

### Sourdough Loaf Recipe

```text
500 g Kirkland Organic Flour
350 g water
10 g salt
100 g starter
Yield: 1 loaf
```

### Focaccia Recipe

```text
1000 g Kirkland Organic Flour
500 g water
20 g salt
200 g starter
50 g olive oil
Yield: configurable
```

### Standard Sourdough Flow

Include:

- Starter availability check
- Build starter
- Mix dough
- Stretch and folds
- Bulk fermentation
- Shape
- Begin cold fermentation
- Preheat
- Bake
- Cool
- Package

### Standard Focaccia Flow

Include:

- Starter availability check
- Build starter
- Mix dough
- Stretch and folds
- Transfer to tray or container
- Begin cold fermentation
- Remove from refrigerator
- Final proof
- Add toppings and oil
- Bake
- Cool
- Package

Do not include shaping for focaccia.

---

## 12. Frontend Requirements

Suggested structure:

```text
src/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ router/
â”‚   â”œâ”€â”€ providers/
â”‚   â””â”€â”€ layouts/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/
â”‚   â””â”€â”€ shared/
â”œâ”€â”€ features/
â”‚   â”œâ”€â”€ auth/
â”‚   â”œâ”€â”€ workspaces/
â”‚   â”œâ”€â”€ team/
â”‚   â”œâ”€â”€ dashboard/
â”‚   â”œâ”€â”€ orders/
â”‚   â”œâ”€â”€ production/
â”‚   â”œâ”€â”€ recipes/
â”‚   â”œâ”€â”€ flows/
â”‚   â”œâ”€â”€ starter/
â”‚   â”œâ”€â”€ inventory/
â”‚   â”œâ”€â”€ customers/
â”‚   â””â”€â”€ finances/
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ supabase/
â”‚   â”œâ”€â”€ calculations/
â”‚   â”œâ”€â”€ dates/
â”‚   â””â”€â”€ validation/
â”œâ”€â”€ hooks/
â”œâ”€â”€ types/
â””â”€â”€ test/
```

Organize code by feature.

Use:

- TanStack Query for server state
- React Hook Form for forms
- Zod for validation
- date-fns for date calculations
- ShadCN UI for components
- Tailwind CSS for styling

The authenticated shell must use these states in order:

1. restore or establish the Supabase Auth session;
2. load accessible bakery memberships;
3. show first-bakery onboarding when no membership exists;
4. show bakery selection with a validated default preselection;
5. render bakery business screens only after explicit selection.

Logout and bakery switching must clear bakery-scoped state before another
bakery is loaded. Every bakery feature adapter must require a bakery identifier.
Team management must show members and pending invitations for the active bakery
and hide or disable actions the current role cannot perform.

Run:

```bash
tsc --noEmit
```

during CI and production builds.

---

## 13. Offline and Error Handling

Full offline mode is not required for the MVP.

The app must:

- Show connection-loss warnings
- Preserve unsaved form data in memory
- Retry safe failed requests
- Show pending states
- Prevent silent data loss
- Show clear errors
- Avoid marking tasks complete before server confirmation unless clearly shown as pending

---

## 14. Testing Requirements

### Unit Tests

Test:

- Recipe scaling
- Starter calculations
- Cost calculations
- Profit calculations
- Task scheduling
- Dependency shifting
- Inventory totals
- Unit conversion
- Money formatting

### Integration Tests

Test:

- Creating a customer
- Creating a recipe
- Creating an order
- Generating production tasks
- Inventory shortage detection
- Payment updates
- RLS ownership rules

### End-to-End Tests

Use Playwright for:

- Login
- First bakery onboarding
- Bakery selection and multi-store switching
- Invite, accept, decline, and revoke team access
- Logout clearing active-bakery state
- Create customer
- Create order
- Confirm order
- Generate production plan
- Complete a task
- Update inventory
- View finances

---

## 15. Coding Agent Instructions

```text
Set up the Supabase backend for this project.

Use SQL migration files for every database change.

Create:
- profiles
- bakeries
- bakery members
- customers
- ingredients
- ingredient purchases
- inventory transactions
- recipes
- recipe ingredients
- production flows
- flow steps
- orders
- order items
- production tasks
- payments

Enable Row-Level Security on all business-owned tables.

Users must only access records belonging to bakeries where they are members.

Create seed data for:
- one sourdough loaf recipe
- one focaccia recipe
- the default sourdough production flow
- the default focaccia production flow

Generate TypeScript database types.

Add unit tests for:
- recipe scaling
- starter calculations
- task scheduling
- cost calculations

Document:
- installation
- environment variables
- migration commands
- seed commands
- local development
- deployment

Do not expose secret or service-role credentials in frontend code.

Do not make database changes only through the Supabase dashboard.
All schema changes must exist as committed migrations.
```

---

## 16. MVP Technical Acceptance Criteria

The MVP is technically complete when:

- A user can register and log in.
- A first bakery workspace and Owner membership are created atomically.
- A returning user selects an accessible bakery before business data renders.
- A user can switch between multiple authorized bakery stores.
- Owners and Managers can invite people within their permitted role limits.
- Invitation acceptance, decline, expiry, revocation, and duplicate handling
  are enforced securely.
- Removing membership immediately removes bakery access, and the last Owner
  cannot be removed or demoted.
- RLS prevents access to another bakeryâ€™s data.
- Customers can be created and selected for orders.
- Recipes can be created and assigned production flows.
- Orders can contain multiple products.
- Confirming an order generates production tasks.
- Starter requirements are calculated.
- Inventory shortages are shown.
- Costs and profits are calculated.
- Tasks can be completed or delayed.
- Historical orders preserve snapshots.
- The app works on mobile and desktop.
- Type checking passes.
- Required tests pass.
- The app can be deployed using the documented process.

