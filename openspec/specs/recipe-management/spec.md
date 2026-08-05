# recipe-management Specification

## Purpose
Provides recipe configuration, ingredient costing, profit margin calculation, batch yield scaling, and recipe lifecycle management (duplication, archiving, and restoration) for multi-store bakery operations.
## Requirements
### Requirement: Recipe configuration and ingredient costing
The application SHALL allow users to create and edit recipes with associated ingredients, calculate total batch costs from current ingredient unit prices, and compute profit margins.

#### Scenario: Creating a new recipe with ingredient costing
- **WHEN** a user enters a recipe name, yield, selling price, and selects ingredient lines with quantities
- **THEN** the system calculates total batch cost, cost per unit, and profit margin percentage, and saves the recipe to the active bakery

#### Scenario: Updating an existing recipe
- **WHEN** a user modifies ingredient quantities, selling price, or yield of an existing recipe
- **THEN** the total batch cost and profit margin update immediately without corrupting historic order snapshots

### Requirement: Recipe lifecycle and duplication
The application SHALL support duplicating existing recipes to create variations and soft-archiving or restoring recipes.

#### Scenario: Duplicating a recipe
- **WHEN** a user selects duplicate on an existing recipe
- **THEN** a new draft recipe copy is created with "(Copy)" appended to the name and identical ingredient ratios

#### Scenario: Archiving and restoring a recipe
- **WHEN** a user archives a recipe
- **THEN** the recipe is hidden from active order creation options but remains visible under archived filters and intact in existing orders

#### Scenario: Restoring an archived recipe
- **WHEN** a user selects restore on an archived recipe
- **THEN** the recipe returns to active status and is available for new orders

