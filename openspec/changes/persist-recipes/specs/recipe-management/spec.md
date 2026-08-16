## MODIFIED Requirements

### Requirement: Recipe configuration and ingredient costing

The application SHALL allow users to create and edit recipes with associated ingredients, calculate total batch costs from current ingredient unit prices, compute profit margins, optionally assign a production flow, and persist the recipe to the active bakery. Persisted recipes and their ingredient quantities SHALL be restored when the authenticated workspace reloads, without corrupting historic order snapshots.

#### Scenario: Creating a new recipe with ingredient costing

- **WHEN** a user enters a recipe name, yield, selling price, and selects ingredient lines with quantities in an authenticated bakery workspace
- **THEN** the system calculates total batch cost, cost per unit, and profit margin from the active inventory prices
- **AND** saves the recipe and its ingredient quantities to the active bakery
- **AND** displays the authoritative saved recipe after the mutation succeeds

#### Scenario: Reloading a persisted recipe

- **WHEN** an authenticated user refreshes or re-enters the active bakery after creating a recipe
- **THEN** the system loads the recipe and its ingredient quantities from the active bakery
- **AND** restores its selling price, yield, nullable production-flow assignment, batch cost, and ingredient-cost presentation

#### Scenario: Updating an existing recipe

- **WHEN** a user modifies ingredient quantities, selling price, yield, or production-flow assignment of an existing recipe
- **THEN** the total batch cost and profit margin update from the current ingredient prices
- **AND** the system atomically persists the recipe fields and replacement ingredient quantities to the active bakery
- **AND** historic order snapshots remain unchanged

#### Scenario: Failed recipe persistence

- **WHEN** the recipe save boundary returns a validation, authorization, or connection failure
- **THEN** the system keeps the user's draft available for correction or retry
- **AND** does not present an unpersisted optimistic recipe as authoritative

#### Scenario: Bakery-scoped recipe persistence

- **WHEN** an authenticated member creates, reads, or updates recipes in the active bakery
- **THEN** the operation is allowed only for that bakery's membership-scoped rows and ingredient lines
- **AND** a member or anonymous caller cannot read or mutate another bakery's recipe data
