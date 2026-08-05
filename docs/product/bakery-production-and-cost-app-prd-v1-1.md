**PRODUCT REQUIREMENTS DOCUMENT**

**Bakery Production, Costing & Order Planning App**

MVP PRD — Version 1.1

| **Document Field** | **Value**                         |
|--------------------|-----------------------------------|
| Status             | Draft for implementation          |
| Primary user       | Home-based sourdough bakery owner |
| Initial products   | Sourdough loaf and focaccia       |
| Primary platform   | Responsive web application        |
| Prepared           | July 28, 2026                     |

**Product principle**

*Enter the order once. The app calculates cost, ingredients, starter
requirements, and every production task needed before pickup.*

# 1. Executive Summary

This product is a bakery operations application for small and home-based
sourdough businesses. It combines recipe costing, customer orders,
production planning, starter preparation, inventory requirements, sales
tracking, and profitability reporting in one system.

The central feature is a configurable production-flow engine. Each
recipe is assigned a reusable flow containing timed steps. When an order
is created, the system works backward from the pickup date and time to
generate the baker’s tasks for today, tomorrow, and later days. Similar
tasks may be combined when safe, such as building starter for multiple
compatible orders.

# 2. Problem Statement

- Cost information is often spread across receipts, memory, and
  spreadsheets.

- Order dates do not automatically translate into preparation schedules.

- Sourdough requires work across multiple days, making missed starter
  builds or fermentation steps costly.

- Different products share ingredients and starter but follow different
  production processes.

- Small bakers need to know what to do next, what ingredients are
  missing, and whether each order is profitable.

# 3. Product Vision

Create the operational command center for a small artisan bakery: a
simple app that turns orders into accurate production schedules,
ingredient requirements, costs, and profits without requiring the baker
to manually plan every step.

# 4. Goals and Non-Goals

## 4.1 MVP Goals

- Calculate batch and per-unit cost for recipes.

- Create customer orders with pickup date and time.

- Save customer contact information and select an existing customer when
  creating an order.

- Generate production tasks automatically from reusable flows.

- Support default flows for sourdough loaves and focaccia.

- Calculate starter builds, including seed starter, flour, water, usable
  amount, and retained amount.

- Show Today, Tomorrow, and Upcoming task views.

- Calculate combined ingredient needs and identify shortages.

- Track sales, costs, payment status, and gross profit.

- Create, preview, download, and email invoices from customer orders.

- Allow users to create, duplicate, edit, and assign custom flows.

## 4.2 Non-Goals for MVP

- Full accounting, payroll, or tax filing.

- Automated purchasing from suppliers.

- Delivery-route optimization.

- Multi-location commercial bakery management.

- Advanced food-safety compliance documentation.

- Native iOS or Android applications; the MVP is responsive web-first.

# 5. Target Users

| **Persona**              | **Needs**                                                                                               |
|--------------------------|---------------------------------------------------------------------------------------------------------|
| Primary: Home baker      | Manage a small number of daily or weekly orders, understand costs, and avoid missing preparation steps. |
| Growing micro-bakery     | Coordinate larger batches, combined starter builds, inventory, and oven capacity.                       |
| Future: Bakery assistant | See assigned tasks and mark steps complete without editing core recipes or pricing.                     |

# 6. Core Product Concepts

| **Concept**           | **Definition**                                                                                                                  |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Ingredient            | A purchasable item with package quantity, unit, price, and calculated cost per base unit.                                       |
| Recipe                | Ingredients, quantities, yield, costs, and an assigned production flow.                                                         |
| Customer              | A saved person or business with a name and optional phone, email, address, and notes that can be selected when creating orders. |
| Production flow       | A reusable sequence of timed steps describing how a recipe is produced.                                                         |
| Flow step             | A task scheduled relative to pickup time, a fixed clock time, or another step.                                                  |
| Order                 | A customer commitment with one or more products, quantities, pickup date/time, payment, and status.                             |
| Invoice               | A numbered customer billing document generated from an order, with delivery and payment status.                                |
| Production task       | A dated task generated from a flow for an order or combined group of orders.                                                    |
| Starter build         | A calculated feeding plan that produces sufficient active starter plus a retained amount.                                       |
| Inventory requirement | The total ingredient quantity required for orders, including starter-build ingredients.                                         |

# 7. Initial Recipes

## 7.1 Sourdough Loaf

| **Ingredient**         | **Quantity** | **Unit** |
|------------------------|--------------|----------|
| Kirkland Organic Flour | 500          | g        |
| Water                  | 350          | g/ml     |
| Salt                   | 10           | g        |
| Active starter         | 100          | g        |

Default yield: 1 loaf. The user may change yield and recipe quantities.

## 7.2 Focaccia

| **Ingredient**         | **Quantity** | **Unit** |
|------------------------|--------------|----------|
| Kirkland Organic Flour | 1,000        | g        |
| Water                  | 500          | g/ml     |
| Salt                   | 20           | g        |
| Active starter         | 200          | g        |
| Olive oil              | 50           | ml       |

Default yield is user-defined, such as one tray or multiple portions.
The standard focaccia flow does not include shaping; it moves from bulk
work into the chosen container or tray and then cold fermentation.

# 8. Functional Requirements

## 8.1 Dashboard

- Show urgent and overdue tasks at the top.

- Show sections for Today, Tomorrow, and Upcoming.

- Show upcoming pickups and order status.

- Show current ingredient shortages.

- Show revenue, cost, gross profit, and units sold for a selected date
  range.

- Allow one-click completion of production tasks.

## 8.2 Ingredients and Costing

- Users can create ingredients with package size, unit, package price,
  supplier, and notes.

- The system calculates cost per gram, milliliter, or unit.

- Changing an ingredient price updates current recipe-cost estimates.

- The system supports flour, water, salt, starter, olive oil, toppings,
  packaging, and custom ingredients.

- Water cost may be zero or user-defined.

- Starter cost may be calculated from its flour and water composition
  instead of entered as a purchased ingredient.

- Recipes include optional labor, utilities, packaging, and overhead
  allocations.

- The system calculates ingredient cost, batch cost, cost per unit,
  gross profit per unit, and margin.

## 8.3 Recipe Management

- Users can create, edit, duplicate, archive, and restore recipes.

- Each recipe includes ingredients, quantities, units, yield, yield
  unit, selling price, and assigned production flow.

- A recipe can be assigned to one production flow at a time in the MVP.

- Multiple recipes may share the same production flow.

- Recipe changes should not silently alter historical completed-order
  costs; completed orders retain a cost snapshot.

## 8.4 Customer Management

- Users can create, edit, archive, restore, and search customer records.

- Customer fields include full name, phone number, email address, street
  address, apartment or unit, city, state, ZIP code, and notes.

- Only the customer name is required for MVP; phone, email, and address
  fields are optional.

- Phone numbers and email addresses should be validated without blocking
  reasonable international or uncommon formats.

- The order form includes a searchable customer selector and an option
  to create a new customer without leaving the order workflow.

- Selecting a customer displays saved contact and address information
  and links the order to that customer record.

- Users may edit order-specific pickup or delivery notes without
  overwriting the customer’s saved profile.

- Historical orders retain the customer details used at the time of the
  order, even if the customer profile is later edited.

- The system should warn about likely duplicate customers based on
  matching phone numbers or email addresses.

## 8.5 Orders

- Create an order by selecting an existing customer or creating a new
  customer, then adding products, quantities, pickup date, pickup time,
  notes, price, and payment status.

- Show the selected customer’s phone, email, and address on the order
  detail screen, with one-click call, email, or copy-address actions
  where supported.

- Support multiple products within one order.

- Order statuses: Draft, Confirmed, In Production, Ready, Completed,
  Cancelled.

- Confirming or rescheduling an order regenerates future production
  tasks.

- Completed tasks are preserved when an order is rescheduled unless the
  user explicitly resets them.

- Cancelling an order cancels its uncompleted generated tasks and
  removes its future ingredient demand.

- Orders display estimated revenue, cost, and gross profit.

## 8.6 Production Flow Builder

The flow builder is the core scheduling system. Users can begin with a
default template, duplicate it, or create a blank flow.

- Flow fields: name, description, anchor, default status,
  compatible-task grouping option, and assigned recipes.

- Step fields: name, instructions, category, timing method, date offset,
  time of day, duration, dependency, notification setting, grouping
  eligibility, and sort order.

- Users can add, edit, remove, disable, duplicate, and reorder steps.

- A disabled step remains in the template but does not generate tasks.

- Deleting a flow is blocked when active recipes use it; the user must
  reassign those recipes first.

- Flow changes affect newly generated tasks. Existing confirmed-order
  tasks require an explicit regenerate action.

## 8.7 Supported Scheduling Methods

| **Method**                         | **Example**                     | **Required behavior**                                             |
|------------------------------------|---------------------------------|-------------------------------------------------------------------|
| Relative to pickup                 | 2 days before pickup            | Subtract the configured duration from the order pickup timestamp. |
| Fixed time on relative day         | Day before at 8:00 AM           | Use the order timezone and chosen clock time.                     |
| Relative to another step           | 30 minutes after mixing         | Schedule after the referenced step.                               |
| Immediately after another step     | Cold ferment after transfer     | Use zero-minute offset and maintain dependency order.             |
| Duration-based backward scheduling | Bake ends 2 hours before pickup | Calculate start using configured task duration.                   |

## 8.8 Starter Manager

- Track current retained starter amount and last feeding time.

- Allow a default feeding ratio and custom ratios per starter-build
  step.

- Calculate total usable starter required across relevant orders.

- Add a configurable retained-starter target.

- Show seed starter, flour, water, total build, expected usable amount,
  and expected remainder.

- Warn when the calculated seed amount exceeds available retained
  starter.

- Allow the baker to override the recommended build.

- Support combined starter builds when products use compatible starter
  and peak timing.

Example for one loaf: the recipe requires 100 g starter. A starter-build
task may specify 20 g retained starter + 60 g water + 60 g flour,
producing 140 g total, with 100 g used and approximately 40 g retained.

## 8.9 Inventory and Requirements

- Track on-hand quantities for ingredients and packaging.

- Calculate requirements by day and by order.

- Include recipe ingredients and starter-build flour/water in total
  requirements.

- Show Available, Required, and Shortage quantities.

- Provide a shopping-list view for shortages.

- Inventory deductions may occur when a production task is completed or
  when an order is completed; the MVP should use one configurable method
  and prevent double deductions.

## 8.10 Task Management

- Views: Today, Tomorrow, Upcoming, Calendar, and Order timeline.

- Task statuses: Pending, In Progress, Completed, Skipped, Cancelled,
  Overdue.

- Each task shows time, product/order, quantity, instructions,
  ingredients if relevant, and dependencies.

- Users can mark tasks complete, add notes, adjust time, or skip with a
  reason.

- Dependent tasks should clearly indicate when a prerequisite is
  incomplete.

- Overdue tasks remain visible until completed, skipped, or rescheduled.

## 8.11 Sales and Profit

- Record payment method and payment status.

- Calculate order revenue, cost snapshot, and gross profit.

- Dashboard filters: day, week, month, custom range, and product.

- Show units sold by product and average selling price.

- Allow manual expenses outside recipes, such as market fees or delivery
  costs.

## 8.12 Invoices

- Provide a dedicated Invoices tab on desktop and mobile navigation.

- Users can create an invoice from an existing order without re-entering
  customer or product information.

- Each invoice includes a unique invoice number, issue date, optional due
  date, bakery details, customer snapshot, order items, quantities, prices,
  subtotal, payments received, remaining balance, and notes.

- Invoice statuses are Draft, Sent, Partially Paid, Paid, Overdue, and
  Void.

- Users can preview, print, and download an invoice as a PDF.

- Users can email an invoice to the customer's saved email address or an
  order-specific email address after confirming the recipient.

- The system records when an invoice was sent, the recipient address, the
  delivery result, and any resend attempts.

- Failed invoice delivery shows a clear error and does not incorrectly mark
  the invoice as sent.

- Users can resend an invoice, copy a secure invoice link when supported,
  and mark an invoice void with confirmation.

- Editing a customer or recipe later does not alter an already issued
  invoice.

# 9. Default Production Flow Templates

## 9.1 Standard Sourdough Loaf Flow

| **Step**                    | **Default schedule**            | **Notes**                                                                     |
|-----------------------------|---------------------------------|-------------------------------------------------------------------------------|
| Check starter and inventory | 2 days before pickup            | Verify seed starter, ingredients, and packaging.                              |
| Build starter               | 1 day before at 8:00 AM         | Default example: 20 g seed + 60 g water + 60 g flour per loaf plan, scalable. |
| Mix dough                   | 1 day before at 2:00 PM         | Use active starter and recipe ingredients.                                    |
| Stretch and fold 1          | 30 minutes after mixing         | Editable or removable.                                                        |
| Stretch and fold 2          | 60 minutes after mixing         | Editable or removable.                                                        |
| Stretch and fold 3          | 90 minutes after mixing         | Editable or removable.                                                        |
| Shape dough                 | 1 day before at 8:00 PM         | Prepare loaf for refrigeration.                                               |
| Begin cold fermentation     | Immediately after shaping       | Place covered dough in refrigerator.                                          |
| Preheat oven                | Calculated from bake time       | Duration configurable.                                                        |
| Bake                        | Calculated backward from pickup | Must allow cooling buffer.                                                    |
| Cool                        | After baking                    | Default minimum duration configurable.                                        |
| Package                     | Before pickup                   | Packaging task and readiness check.                                           |

## 9.2 Standard Focaccia Flow

| **Step**                      | **Default schedule**            | **Notes**                                         |
|-------------------------------|---------------------------------|---------------------------------------------------|
| Check starter and inventory   | 2 days before pickup            | Check flour, oil, toppings, tray, and packaging.  |
| Build starter                 | 1 day before at 8:00 AM         | Scales to total starter requirement.              |
| Mix dough                     | 1 day before at 2:00 PM         | Use recipe quantities.                            |
| Stretch and fold steps        | After mixing                    | Configurable count and spacing.                   |
| Transfer to container or tray | Before refrigeration            | No shaping step.                                  |
| Begin cold fermentation       | 1 day before at 8:00 PM         | Move covered dough to refrigerator.               |
| Remove from refrigerator      | Pickup day                      | Time is based on desired final proof.             |
| Final proof                   | Before baking                   | Duration configurable.                            |
| Add olive oil and toppings    | Immediately before baking       | May include recipe-specific topping instructions. |
| Bake                          | Calculated backward from pickup | Accounts for cooling and packaging.               |
| Cool                          | After baking                    | Duration configurable.                            |
| Package                       | Before pickup                   | Mark order ready after completion.                |

# 10. Task Generation and Grouping Rules

1.  When an order becomes Confirmed, calculate every order item’s recipe
    quantity and load its assigned flow.

2.  Create step timestamps using the pickup timestamp, date offsets,
    fixed clock times, durations, and step dependencies.

3.  Scale ingredient and starter requirements by ordered quantity and
    recipe yield.

4.  Group eligible tasks only when they share compatible recipe/flow
    settings, required completion window, equipment constraints, and
    starter type.

5.  Never group tasks marked as non-groupable.

6.  If grouped, preserve traceability to every contributing order and
    product.

7.  Recalculate future uncompleted tasks when quantities, due time, or
    recipe assignment changes.

8.  Flag conflicts instead of silently creating impossible schedules.

# 11. Capacity and Conflict Warnings

- Mixer batch exceeds configured dough capacity.

- Oven demand exceeds configured number of ovens, Dutch ovens, trays, or
  bake slots.

- Two required tasks overlap beyond configured user capacity.

- Starter is expected to peak outside the required mixing window.

- Cold fermentation duration falls outside the recipe’s configured
  range.

- Pickup time does not leave enough bake, cooling, or packaging time.

- Ingredient or packaging shortage exists.

MVP conflict handling may provide warnings and manual rescheduling
rather than a fully automatic optimization engine.

# 12. Screen Requirements

| **Screen**      | **Primary content/actions**                                                                                                        |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------|
| Customers       | Searchable customer directory, add/edit/archive customer, contact details, address, notes, and order history.                      |
| Dashboard       | Urgent tasks, Today/Tomorrow/Upcoming, upcoming orders, shortages, revenue and profit summary.                                     |
| Orders          | Order list, filters, customer selector, quick-add customer, add/edit order, payment, status, generated plan, mark ready/completed. |
| Invoices        | Invoice list, search and status filters, order-to-invoice creation, preview, PDF download, email delivery, resend, and void actions. |
| Calendar        | Production tasks and pickups shown by day/week.                                                                                    |
| Tasks           | Chronological work list with complete, skip, reschedule, notes, and dependencies.                                                  |
| Recipes         | Recipe list, ingredient quantities, yield, costing, price, assigned flow.                                                          |
| Flow Builder    | Template list, visual ordered steps, timing controls, duplicate and assign.                                                        |
| Starter         | Current starter, feed settings, upcoming builds, build calculator, warnings.                                                       |
| Inventory       | On-hand quantities, upcoming demand, shortages, shopping list.                                                                     |
| Costs & Reports | Ingredient prices, recipe costs, sales, expenses, margin, date filters.                                                            |
| Settings        | Timezone, business hours, equipment capacity, default buffers, units, notifications.                                               |

# 13. Data Model

| customers              | id, user_id, full_name, phone, email, address_line_1, address_line_2, city, state, postal_code, notes, is_archived, created_at, updated_at                             |
|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Entity**             | **Key fields**                                                                                                                                                         |
| users                  | id, name, email, timezone, settings                                                                                                                                    |
| ingredients            | id, user_id, name, base_unit, package_quantity, package_price, on_hand_quantity, supplier                                                                              |
| recipes                | id, user_id, name, yield_quantity, yield_unit, selling_price, production_flow_id, active                                                                               |
| recipe_ingredients     | id, recipe_id, ingredient_id, quantity, unit, usage_stage                                                                                                              |
| production_flows       | id, user_id, name, description, anchor_type, is_template, is_default                                                                                                   |
| flow_steps             | id, flow_id, name, instructions, category, timing_method, date_offset, time_of_day, relative_step_id, offset_minutes, duration_minutes, groupable, enabled, sort_order |
| customers              | id, user_id, name, phone, email, notes                                                                                                                                 |
| orders                 | id, user_id, customer_id, customer_name_snapshot, phone_snapshot, email_snapshot, address_snapshot, pickup_at, status, payment_status, notes, revenue, cost_snapshot   |
| order_items            | id, order_id, recipe_id, quantity, unit_price, cost_snapshot                                                                                                           |
| invoices               | id, user_id, order_id, invoice_number, customer_snapshot, issue_date, due_date, status, subtotal, amount_paid, balance, notes, issued_at, voided_at                     |
| invoice_deliveries     | id, invoice_id, recipient_email, delivery_status, provider_message_id, sent_at, failed_at, failure_reason                                                              |
| production_tasks       | id, order_id, order_item_id, flow_step_id, scheduled_at, status, quantity_summary, grouped_task_id, completed_at, notes                                                |
| starter_profiles       | id, user_id, name, hydration_percent, retained_target, current_amount, default_ratio                                                                                   |
| starter_builds         | id, task_id, seed_amount, flour_amount, water_amount, total_amount, usable_amount, retained_amount                                                                     |
| inventory_transactions | id, ingredient_id, quantity_change, reason, order_id, task_id, created_at                                                                                              |
| expenses               | id, user_id, category, amount, date, notes                                                                                                                             |

# 14. Business Rules and Calculations

## 14.1 Ingredient Cost

Cost per base unit = package price ÷ package quantity. Recipe ingredient
cost = required quantity × cost per base unit.

## 14.2 Recipe and Unit Cost

Batch cost = ingredient costs + packaging + labor + utilities +
allocated overhead. Cost per unit = batch cost ÷ recipe yield.

## 14.3 Gross Profit

Gross profit = order revenue − order cost snapshot. Gross margin
percentage = gross profit ÷ revenue × 100.

## 14.4 Starter Requirement

Required usable starter = sum of active-starter quantities for all
included recipe batches. Total target build = usable starter + retained
target. The split between seed starter, flour, and water is calculated
from the selected feeding ratio and starter hydration.

## 14.5 Historical Integrity

Completed orders store ingredient-cost and recipe-cost snapshots.
Updating present-day ingredient prices must not change previously
reported completed-order profit.

# 15. Notifications

- Optional in-app and browser notification before a task.

- Configurable reminder lead time per flow step.

- Overdue-task alert.

- Low-inventory or shortage alert.

- Starter-build warning when seed starter is insufficient.

- Upcoming pickup reminder.

- Invoice delivery success or failure notice.

# 16. Permissions and Security

- Users may access only their own bakery data.

- Authentication is required for all business data.

- MVP roles may be Owner only; Assistant role can be added later.

- Sensitive credentials are never stored in client-side code.

- Destructive actions require confirmation.

- Order, recipe, and task changes should have timestamps for
  traceability.

# 17. Non-Functional Requirements

| **Area**          | **Requirement**                                                                                       |
|-------------------|-------------------------------------------------------------------------------------------------------|
| Responsive design | Usable on desktop and mobile, especially the Today task view.                                         |
| Performance       | Typical dashboard and task pages should load within approximately two seconds under normal MVP usage. |
| Reliability       | Task regeneration must be idempotent and avoid accidental duplicates.                                 |
| Timezone          | All order and task times use the bakery’s configured timezone.                                        |
| Accessibility     | Keyboard-accessible controls, readable contrast, labels, and semantic structure.                      |
| Data export       | Allow CSV export of orders, sales, expenses, and ingredient data.                                     |
| Auditability      | Generated tasks retain links to source order, recipe, flow, and step.                                 |

# 18. MVP Acceptance Criteria

- [ ] A user can create a customer with a required name and optional
  phone, email, address, and notes.

- [ ] The order form allows selecting an existing customer or creating a
  new customer inline.

- [ ] Selecting a customer links the order to the customer and displays
  saved contact information.

- [ ] Editing a customer later does not change the customer snapshot on
  completed historical orders.

- **☐** A user can enter package size and price for Kirkland Organic
  Flour and see its cost per gram.

- **☐** A user can create the specified sourdough loaf and focaccia
  recipes and see batch and unit costs.

- **☐** A user can assign the Standard Sourdough flow to the loaf recipe
  and Standard Focaccia flow to focaccia.

- **☐** Creating a confirmed Friday loaf order generates a starter check
  for Wednesday and production tasks for Thursday and Friday according
  to the assigned flow.

- **☐** The sourdough flow includes shaping before cold fermentation.

- **☐** The focaccia flow contains no shaping step and can proceed from
  transfer to tray/container into cold fermentation.

- **☐** The user can duplicate either default flow, edit its steps, and
  assign it to a recipe.

- **☐** The system scales a 500 g flour loaf recipe correctly for
  multiple loaves.

- **☐** The system calculates starter build quantities and clearly
  separates seed starter, flour, water, usable amount, and retained
  amount.

- **☐** Today and Tomorrow views show generated tasks in chronological
  order.

- **☐** Changing an order’s pickup time recalculates future uncompleted
  tasks.

- **☐** The inventory screen includes flour and water needed for starter
  builds in addition to dough ingredients.

- **☐** A completed order displays revenue, cost snapshot, gross profit,
  and payment status.

- **☐** Updating an ingredient price does not change the profit of
  completed orders.

- **☐** The system warns about insufficient inventory and impossible
  timing buffers.

- [ ] A user can create a numbered invoice from an order and preview its
  customer, items, totals, payments, and remaining balance.

- [ ] A user can download or print an invoice as a PDF.

- [ ] A user can email an invoice after confirming the recipient, see
  whether delivery succeeded or failed, and resend it when necessary.

- [ ] An issued invoice retains its original customer, product, and price
  details when source records are edited later.

# 19. MVP Frontend Delivery Phases

Frontend delivery is divided into testable feature phases that complete the
workflows already represented by the prototype. These phases may be delivered
alongside their corresponding backend phases; their placement before the
backend roadmap does not require completing the entire frontend first.

The phases remain product milestones. When multi-agent execution is requested,
work inside a phase follows the orchestrator, ownership, model-selection, and
integration gates in `docs/MULTI_AGENT_DELIVERY.md`. Independent workstreams may
run in parallel, but the phase completion gate remains unchanged.

## Frontend Phase 1 — Shared Application Foundation

Introduce URL-based navigation, a shared application data layer, feature
service adapters, and consistent loading, error, empty, connection-loss, retry,
and unsaved-form states. Replace isolated screen-specific mock collections with
one shared source of truth.

**Completion gate:** A local order or task update appears consistently on the
Dashboard, Orders, Production, Inventory, Customers, and Finances screens
without a refresh.

## Frontend Phase 2 — Authentication and Account Experience

Complete login, signup, logout, email-verification, forgot-password,
reset-password, session-restoration, owner onboarding, and account-profile
interfaces.

**Completion gate:** The complete account journey has accessible pending,
success, expired-link, and failure states and restores an authenticated session
after refresh.

## Frontend Phase 3 — Ingredients and Stock Entry

Add ingredient creation and editing, package quantity and price entry, base-unit
selection, supplier and notes, purchase recording, and traceable stock
adjustments for purchases, waste, returns, and corrections.

**Completion gate:** A baker can create an ingredient, see its calculated
base-unit cost, record stock movement, and see the updated available amount.

## Frontend Phase 4 — Recipe Management

Add recipe creation, editing, duplication, archive and restore, ingredient-line
editing, yield and selling-price controls, optional cost allocations, calculated
batch and unit costs, margins, and production-flow assignment.

**Completion gate:** A baker can create and fully configure a recipe, duplicate
it, archive it, restore it, and verify its cost and margin.

## Frontend Phase 5 — Customer Management

Add customer creation, editing, archive and restore, validation, likely-duplicate
warnings, order history, inline customer creation during order entry, and
call, email, and copy-address actions.

**Completion gate:** A baker can manage a customer from the directory or create
one without leaving the order workflow.

## Frontend Phase 6 — Orders and Payments

Complete order editing, rescheduling, cancellation, status transitions,
pickup and delivery notes, payment recording, refunds, customer snapshots,
order cost and profit display, and task-regeneration confirmation.

**Completion gate:** A baker can manage an order from Draft through Completed or
Cancelled, including schedule changes and payment updates.

## Frontend Phase 7 — Production Flow Builder

Add blank-flow creation and complete step add, edit, remove, duplicate,
enable, disable, and reorder interactions. Expose timing methods, offsets,
durations, categories, dependencies, grouping eligibility, instructions,
notifications, flow assignment, and safe deletion rules.

**Completion gate:** A baker can build a valid custom flow from scratch, assign
it to a recipe, and understand validation or deletion blockers.

## Frontend Phase 8 — Production Task Workspace

Complete Today, Tomorrow, Upcoming, Calendar, and order-timeline views. Add
Pending, In Progress, Completed, Skipped, Cancelled, and Overdue controls,
grouped-task presentation, functional timing tools, dependent-task shifting,
and confirmation for disruptive schedule changes.

**Completion gate:** A baker can run a production day from the task workspace,
including delays, notes, skips, dependencies, and grouped work.

## Frontend Phase 9 — Starter and Inventory Planning

Add actual starter-feeding records, retained-amount and last-fed updates,
starter profile and peak-time settings, override acceptance and reset,
combined-build approval, day and order requirement filters, inventory
transaction history, shortage explanations, shopping lists, and deduction
protection.

**Completion gate:** The baker can move from upcoming orders to an actionable
starter build and shopping list, then record the resulting inventory movement.

## Frontend Phase 10 — Dashboard and Notifications

Connect dashboard metrics, tasks, pickups, shortages, starter warnings, unpaid
balances, and profit summaries to shared data. Add navigation from alerts to
their source, notification read and dismiss actions, empty states, and user
preferences.

**Completion gate:** Creating or updating an order immediately changes the
relevant dashboard and notification information.

## Frontend Phase 11 — Finances and Invoices

Add custom reporting ranges, product filters, average selling price,
order-level cost and profit details, manual expenses, real CSV downloads, and
empty/error states. Add a dedicated Invoices tab with invoice search and status
filters, order-to-invoice creation, preview, PDF print/download, recipient
confirmation, email sending, delivery result, resend, secure-link copy when
supported, and void actions.

**Completion gate:** A baker can review accurate financial results, create an
invoice from an order, download it, send it to a customer, and see whether the
delivery succeeded.

## Frontend Phase 12 — Settings, Reliability, and Release

Add bakery name, timezone, currency, business hours, default production
buffers, inventory-deduction method, starter defaults, notification settings,
and equipment capacity. Complete accessibility, responsive behavior,
performance, destructive-action confirmations, form recovery, integration
tests, and end-to-end release verification.

**Completion gate:** All primary MVP journeys work on mobile and desktop with
accessible controls, reliable recovery states, and passing release checks.

## Frontend Delivery Milestones

| **Milestone**              | **Included Phases** | **Outcome**                                                               |
|----------------------------|---------------------|---------------------------------------------------------------------------|
| Connected application      | Phases 1–2          | Shared navigation, state, and complete account interfaces.                |
| Business management        | Phases 3–7          | Ingredients, recipes, customers, orders, payments, and flows are usable.  |
| Daily operations           | Phases 8–10         | Tasks, starter, inventory, dashboard, and alerts work together.           |
| Customer and release tools | Phases 11–12        | Reporting, invoices, settings, reliability, and release checks are ready. |

# 20. MVP Backend Delivery Phases

Backend delivery is divided into small, testable phases. Each phase has a
defined completion gate and should be delivered using versioned database
migrations, automated tests appropriate to its scope, and updated generated
database types.

When multi-agent execution is requested, one orchestrator owns the OpenSpec
change and final integration. Database, API, frontend-integration, and
verification workstreams may run in parallel only when their file ownership and
contracts do not overlap. Recommended lanes and Sol/Terra assignments are
defined in `docs/MULTI_AGENT_DELIVERY.md`.

## Phase 1 — Backend Foundation

Set up Supabase, local configuration, migration structure, generated database
types, and deployment environments.

**Completion gate:** Migrations can be applied consistently in local and hosted
environments.

## Phase 2 — Authentication and Bakery Workspaces

Replace mock authentication with Supabase Auth. Add profiles, bakeries,
memberships, owner onboarding, and workspace-level Row-Level Security.

**Completion gate:** Users can register, log in, log out, and access only their
own bakery.

## Phase 3 — Ingredients and Costing

Add ingredients, purchase records, package pricing, base-unit conversion,
inventory cost, and cost-per-unit calculations.

**Completion gate:** Entering a package quantity and price produces an accurate
ingredient cost.

## Phase 4 — Recipes and Production Flows

Add recipes, recipe ingredients, yields, selling prices, production flows, flow
steps, dependencies, and recipe-to-flow assignments. Seed the default
sourdough loaf and focaccia recipes and flows.

**Completion gate:** Both default products have accurate costs and editable
production flows.

## Phase 5 — Customers and Orders

Add customers, contact validation, search, archive and restore behavior,
duplicate warnings, orders, multiple order items, statuses, and customer
snapshots.

**Completion gate:** A baker can create and confirm a multi-product order for a
saved customer.

## Phase 6 — Payments, Invoices, and Historical Snapshots

Add payments, balances, payment statuses, price snapshots, recipe snapshots,
flow snapshots, numbered invoices, invoice delivery records, and completed-order
and issued-invoice historical protection.

**Completion gate:** Payments and invoices are stored against orders, and later
customer, recipe, flow, or price changes cannot alter historical order or
issued-invoice results.

## Phase 7 — Production Scheduling Engine

Generate production tasks by working backward from pickup time. Support fixed
times, relative offsets, durations, dependencies, bakery timezones, and timing
warnings.

**Completion gate:** Confirming an order produces the correct chronological plan
for sourdough and focaccia.

## Phase 8 — Task Lifecycle and Regeneration

Add task completion, skipping, notes, delays, overdue status, order
rescheduling, cancellation, and idempotent regeneration. Preserve completed
work during regeneration.

**Completion gate:** An order can be rescheduled without duplicated tasks or
lost task history.

## Phase 9 — Starter Planning

Add starter profiles, retained amounts, feeding ratios, build calculations,
overrides, insufficient-seed warnings, and compatible build grouping.

**Completion gate:** The system calculates seed, flour, water, usable starter,
and retained starter for all relevant orders.

## Phase 10 — Inventory Requirements

Add inventory transactions, on-hand balances, recipe requirements,
starter-build requirements, packaging demand, shortages, and shopping lists.
Select one inventory deduction event for the MVP and prevent double
deductions.

**Completion gate:** The baker can see exactly what is available, required, and
missing for upcoming production.

## Phase 11 — Reporting, Invoice Delivery, and Notifications

Add revenue, cost, gross profit, unpaid balances, units sold, expenses,
reporting filters, CSV exports, invoice PDF generation, secure invoice delivery
through a transactional-email provider, delivery-result tracking, and in-app
operational notifications.

**Completion gate:** Dashboard figures and notifications use persisted backend
records, and an invoice can be generated and emailed without exposing email
provider credentials to the frontend.

## Phase 12 — Security, Testing, and Release

Complete Row-Level Security coverage, database indexes, audit timestamps, error
handling, integration tests, end-to-end tests, deployment documentation, backup
guidance, and release verification.

**Completion gate:** The complete MVP journey works securely from account
creation through order planning, production completion, payment tracking, and
profit reporting.

## Backend Delivery Milestones

| **Milestone**           | **Included Phases** | **Outcome**                                                        |
|-------------------------|---------------------|--------------------------------------------------------------------|
| Foundation release      | Phases 1–4          | Secure backend with persistent ingredients, recipes, and flows.    |
| Order-planning release  | Phases 5–8          | Orders generate dependable production plans and task history.      |
| Operational MVP         | Phases 9–10         | Starter and inventory requirements work end to end.                |
| Production release      | Phases 11–12        | Reporting, invoice delivery, notifications, security, and release checks are ready. |

# 21. Recommended Technical Approach

| **Layer**            | **Recommendation**                                                                                             |
|----------------------|----------------------------------------------------------------------------------------------------------------|
| Frontend             | React, TypeScript, Vite, ShadCN UI, React Query.                                                               |
| Backend/MVP platform | Supabase for PostgreSQL, authentication, row-level security, and APIs.                                         |
| Scheduling logic     | Application service with deterministic task-generation functions and database transactions.                    |
| Invoice delivery     | Server-generated PDF or secure invoice view plus a Supabase Edge Function for transactional email delivery.    |
| Hosting              | Vercel for frontend; Supabase-hosted database and backend services.                                            |
| Later expansion      | Introduce NestJS when integrations, worker queues, or more complex business logic require a dedicated backend. |
| Delivery workflow    | OpenSpec-governed orchestrator with bounded Sol/Terra sub-agents for independent workstreams when requested.     |

Multi-agent delivery changes how phases are implemented, not what the Bakery
App does at runtime. See `docs/MULTI_AGENT_DELIVERY.md` and the repository
`AGENTS.md`.

# 22. Future Features

- Online customer ordering and deposits.

- Recurring subscriptions and standing weekly orders.

- Automated SMS or email pickup reminders.

- Equipment-aware batch optimization and oven scheduling.

- Barcode or receipt scanning for ingredient purchases.

- Ingredient price history and supplier comparison.

- Printable labels and market-day order sheets.

- Assistant accounts and task assignment.

- Food-safety logs and temperature tracking.

- Native mobile applications and offline task mode.

# 23. Open Decisions Before Development

- Final product name and brand identity.

- Whether addresses are used only for records or whether delivery
  scheduling is included in a later release.

- Exact focaccia recipe yield: tray, portion, or both.

- Default stretch-and-fold count and timing for each recipe.

- Default cooling and packaging buffers.

- Whether inventory deducts at task completion or order completion.

- Whether starter builds are always combined or require user approval.

- The first version’s notification channels: in-app only or browser push
  as well.

- The transactional-email provider and sending domain used for invoice
  delivery.

- Equipment capacity values for mixer, oven, Dutch ovens, and focaccia
  trays.

# 24. Definition of MVP Success

The MVP is successful when the baker can enter upcoming orders and rely
on the app’s Today and Tomorrow views to complete production without
manually calculating starter builds, ingredient quantities, or backward
schedules, while also seeing the true cost and gross profit of each
product and order, and creating and sending an accurate invoice without
re-entering order information.
