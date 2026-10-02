# prep-list Specification

## Purpose

Provide a bakery-scoped preparation view that shows the products and ingredient or packaging quantities required for scheduled orders, grouped by a derived preparation date.

## ADDED Requirements

### Requirement: Prep List Generation

The system MUST generate Prep List entries from eligible scheduled orders and their order-item quantities and MUST retain a reference to the originating order and order item.

#### Scenario: Generate product requirements for a prep date

Given an eligible order contains two sourdough loaves and one focaccia
And the order's fulfillment date is 2026-09-24
When the user opens the Prep List for 2026-09-23
Then the list includes two sourdough loaves and one focaccia
And each product requirement can be traced to the originating order.

### Requirement: Recipe-Level Prep Timing

The system MUST store a non-negative preparation lead time on each recipe,
defaulting to one calendar day before fulfillment, and MUST allow an
authorized bakery user to set it to same day, one day before, two days before,
or another non-negative number of days.

#### Scenario: Default recipe timing

Given a recipe has no saved preparation lead-time setting
And an eligible order uses that recipe with fulfillment date 2026-09-24
When the Prep List schedule is generated
Then the order's prep date is 2026-09-23.

#### Scenario: Recipe timing changes the derived prep date

Given a recipe's preparation lead time is set to 2 days
And an eligible order uses that recipe with fulfillment date 2026-09-24
When the Prep List schedule is generated
Then the order's prep date is 2026-09-22.

#### Scenario: Same-day preparation

Given a recipe's preparation lead time is set to 0 days
And an eligible order uses that recipe with fulfillment date 2026-09-24
When the Prep List schedule is generated
Then the order appears on the Prep List for 2026-09-24.

#### Scenario: Fulfillment date changes with recipe timing

Given a recipe's preparation lead time is 1 day
When an eligible order's fulfillment date changes from 2026-09-24 to 2026-09-25
Then its derived prep date changes from 2026-09-23 to 2026-09-24.

### Requirement: Ingredient and Packaging Requirement Calculation

The system MUST calculate requirements from the applicable persisted recipe
lines, order-item quantity, and established unit conventions. Recipe-linked
inventory items of kind ingredient or packaging MUST be included; finished
goods MUST be excluded.

#### Scenario: Scale recipe ingredients by ordered quantity

Given a recipe yields one product
And the recipe requires 500 grams of flour and 350 grams of water per product
And an eligible order contains three products using that recipe
When the Prep List requirements are calculated
Then the ingredient requirements include 1500 grams of flour and 1050 grams of water
And the calculation retains the source recipe and order-item references.

#### Scenario: Include packaging requirements

Given a recipe requires one bakery bag per ordered product
And an eligible order contains three products using that recipe
When the Prep List requirements are calculated
Then the packaging requirements include three bakery bags
And the packaging requirement retains the source recipe and order-item references.

### Requirement: Aggregation

The system MUST aggregate equivalent ingredient or packaging requirements for
the selected prep date by stable inventory-item identity and compatible base
unit.

#### Scenario: Aggregate requirements from multiple orders

Given two eligible orders on the same prep date each require 500 grams of the same flour inventory item
When the user opens the aggregated ingredient view
Then the total required quantity is 1000 grams
And the user can expand the total to see both contributing orders.

### Requirement: Product and Material Views

The system MUST display product-level quantities and material-level quantities
for the selected prep date, with ingredients and packaging shown as distinct
groups, and SHOULD provide order-level traceability for both views.

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
And the system displays a warning that material requirements cannot be calculated
And the product is not silently omitted.

#### Scenario: Archived material reference

Given an eligible order uses a recipe that references an archived packaging item
When the Prep List is generated
Then the product quantity remains visible
And the system displays a warning naming the archived packaging item
And the archived material is not silently treated as available stock.

### Requirement: Eligibility and Order Status

The system MUST apply the repository's established order eligibility rules and MUST NOT include cancelled orders in calculated requirements unless an explicit future requirement allows them.

#### Scenario: Cancelled order is excluded

Given a cancelled order contains products scheduled for the selected prep date
When the Prep List is generated
Then the cancelled order does not contribute to product or ingredient totals.

### Requirement: Tenant Isolation

The system MUST scope Prep List reads and recipe timing changes to the active
bakery workspace and MUST enforce the existing authenticated membership and
row-level security boundary.

#### Scenario: Cross-bakery data is inaccessible

Given a user is authenticated in bakery A
And an order belongs to bakery B
When the user loads or updates the Prep List or recipe timing
Then bakery B's order and prep scheduling data are not returned or modified.

### Requirement: Production Flow Boundary

The system MUST NOT create duplicate production-flow tasks or alter inventory deduction behavior solely because Prep List entries are generated or viewed.

#### Scenario: Prep List does not duplicate production tasks

Given an order already has a generated production plan
When its Prep List entries are generated
Then the existing production plan remains the source of production tasks
And no duplicate tasks are created by the Prep List operation.
