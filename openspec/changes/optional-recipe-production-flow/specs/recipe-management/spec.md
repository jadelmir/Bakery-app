## MODIFIED Requirements

### Requirement: Recipe configuration and ingredient costing

The application SHALL allow users to create and edit recipes with associated
ingredients, calculate total batch costs from current ingredient unit prices,
compute profit margins, and optionally assign a production flow. A recipe SHALL
remain valid when no production flow is assigned, and the flow SHALL be
assignable later.

#### Scenario: Creating a new recipe without a production flow

- **WHEN** a user enters a recipe name, yield, selling price, and ingredient
  lines without selecting a production flow
- **THEN** the system saves the recipe with a null flow assignment
- **AND** calculates total batch cost, cost per unit, and profit margin

#### Scenario: Creating a new recipe with a production flow

- **WHEN** a user enters recipe details and selects an available production
  flow
- **THEN** the system saves the recipe with that flow assignment
- **AND** calculates total batch cost, cost per unit, and profit margin

#### Scenario: Assigning a production flow later

- **WHEN** a user opens the flow assignment action for a recipe with no
  production flow
- **THEN** the system allows the user to create or select a flow and save the
  assignment
- **AND** the recipe displays the assigned flow after the authoritative result

#### Scenario: Updating an existing recipe

- **WHEN** a user modifies ingredient quantities, selling price, yield, or the
  optional production-flow assignment of an existing recipe
- **THEN** the total batch cost and profit margin update immediately without
  corrupting historic order snapshots
