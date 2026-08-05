# ingredients-and-stock-entry Specification

## Purpose
TBD - created by archiving change add-ingredients-and-stock-entry. Update Purpose after archive.
## Requirements
### Requirement: Ingredient Package Pricing and Base Unit Costing
The system MUST store ingredient package quantities, package prices, and automatically derive the base-unit cost (price / quantity).

#### Scenario: Creating a new ingredient with package pricing
Given a bakery manager in an active bakery workspace
When they enter an ingredient named "Organic Flour", unit "g", package quantity 5000, package price 15.00
Then the system stores the ingredient and computes cost_per_unit as 0.003 (15.00 / 5000).

### Requirement: Inventory Movement Logging
The system MUST record inventory movements (restock, waste, adjustment) and update on-hand stock levels.

#### Scenario: Recording a restock movement
Given an existing ingredient with on-hand quantity 1000g
When the user records a restock movement of 5000g
Then the on-hand quantity updates to 6000g and an inventory movement record is logged.

