# prep-list Specification

## Purpose

Provide a bakery-scoped preparation view that shows the products and ingredient quantities required for scheduled orders, grouped by an editable preparation date.

## Requirements

### Requirement: Prep List Generation

The system MUST generate Prep List entries from eligible scheduled orders and their order-item quantities and MUST retain a reference to the originating order and order item.

#### Scenario: Generate product requirements for a prep date

Given an eligible order contains two sourdough loaves and one focaccia
And the order's fulfillment date is 2026-09-24
When the user opens the Prep List for 2026-09-23
Then the list includes two sourdough loaves and one focaccia
And each product requirement can be traced to the originating order.

### Requirement: Default Prep Date

The system MUST default the prep date to one calendar day before the order's fulfillment date, using the bakery's local calendar date.

#### Scenario: Default prep date is derived from fulfillment date

Given an eligible order has a fulfillment date of 2026-09-24
And the order has no manually overridden prep date
When the Prep List schedule is generated
Then the order's prep date is 2026-09-23.

### Requirement: Editable Prep Date

The system MUST allow an authorized bakery user to change an order or order-item prep date according to the selected scheduling model, MUST persist the override, and MUST provide a way to reset it to the default rule.

#### Scenario: User overrides the prep date

Given an order has a fulfillment date of 2026-09-24
And its default prep date is 2026-09-23
When an authorized user changes the prep date to 2026-09-22
Then the changed prep date is persisted
And the order appears on the Prep List for 2026-09-22
And the system marks the date as manually overridden.

#### Scenario: Fulfillment date changes after an override

Given an order has a manually overridden prep date of 2026-09-22
When its fulfillment date changes from 2026-09-24 to 2026-09-25
Then the manually overridden prep date remains 2026-09-22
And the user can reset the prep date to the default.

#### Scenario: Reset an overridden prep date

Given an order has a manually overridden prep date
When an authorized user selects reset to default
Then the override is cleared
And the prep date becomes one calendar day before the current fulfillment date.

### Requirement: Ingredient Requirement Calculation

The system MUST calculate ingredient requirements from the applicable recipe definition, recipe yield, order-item quantity, and established unit conventions.

#### Scenario: Scale recipe ingredients by ordered quantity

Given a recipe yields one product
And the recipe requires 500 grams of flour and 350 grams of water per product
And an eligible order contains three products using that recipe
When the Prep List requirements are calculated
Then the ingredient requirements include 1500 grams of flour and 1050 grams of water
And the calculation retains the source recipe and order-item references.

### Requirement: Aggregation

The system MUST aggregate equivalent ingredient requirements for the selected prep date by stable ingredient or inventory-item identity and compatible base unit.

#### Scenario: Aggregate requirements from multiple orders

Given two eligible orders on the same prep date each require 500 grams of the same flour inventory item
When the user opens the aggregated ingredient view
Then the total required quantity is 1000 grams
And the user can expand the total to see both contributing orders.

### Requirement: Product and Ingredient Views

The system MUST display product-level quantities and ingredient-level quantities for the selected prep date and SHOULD provide order-level traceability for both views.

#### Scenario: Review preparation workload and ingredients

Given the selected prep date has orders for multiple products
When the user views the Prep List
Then the user can see how many units of each product must be prepared
And the user can see the total ingredient quantity required
And the user can identify the fulfillment date and originating order for each requirement.

### Requirement: Inventory Availability Separation

The system MUST keep total required preparation quantity separate from available inventory quantity and MUST NOT deduct inventory merely because the Prep List is viewed or marked complete.

#### Scenario: View required versus available stock

Given the Prep List requires 2000 grams of flour
And inventory currently contains 1200 grams of that flour
When the user views the ingredient requirement
Then the system shows required quantity as 2000 grams
And available quantity as 1200 grams
And the shortage is 800 grams
And no inventory deduction is recorded.

### Requirement: Calculation Warnings

The system MUST surface actionable warnings for eligible order items that cannot be calculated because of missing recipes, invalid quantities, unsupported units, or incomplete ingredient data.

#### Scenario: Missing recipe mapping

Given an eligible order contains a product without an associated recipe
When the Prep List is generated
Then the product quantity remains visible in the product-level view
And the system displays a warning that ingredient requirements cannot be calculated
And the product is not silently omitted.

### Requirement: Eligibility and Order Status

The system MUST apply the repository's established order eligibility rules and MUST NOT include cancelled orders in calculated requirements unless an explicit future requirement allows them.

#### Scenario: Cancelled order is excluded

Given a cancelled order contains products scheduled for the selected prep date
When the Prep List is generated
Then the cancelled order does not contribute to product or ingredient totals.

### Requirement: Tenant Isolation

The system MUST scope Prep List reads, date changes, and any persisted prep scheduling data to the active bakery workspace and MUST enforce the existing authenticated membership and row-level security boundary.

#### Scenario: Cross-bakery data is inaccessible

Given a user is authenticated in bakery A
And an order belongs to bakery B
When the user loads or updates the Prep List
Then bakery B's order and prep scheduling data are not returned or modified.

### Requirement: Production Flow Boundary

The system MUST NOT create duplicate production-flow tasks or alter inventory deduction behavior solely because Prep List entries are generated or viewed.

#### Scenario: Prep List does not duplicate production tasks

Given an order already has a generated production plan
When its Prep List entries are generated
Then the existing production plan remains the source of production tasks
And no duplicate tasks are created by the Prep List operation.
