# Specification: Production Flow Management & Custom Builder

## ADDED Requirements

### Requirement: Custom Production Flow Building & Task Dependency Resolution
The application SHALL allow users to create, modify, reorder, and save custom multi-step production flows for recipe products.

#### Scenario: User creates and saves a custom multi-step production flow for a recipe
- **GIVEN** a recipe manager or production administrator
- **WHEN** the user opens the Production Flow Builder for a recipe, adds custom steps with day offsets and target times, and saves the flow
- **THEN** the custom production flow SHALL be persisted in the bakery workspace domain snapshot
- **AND** subsequent orders for that recipe SHALL generate tasks adhering to the custom step flow

#### Scenario: Task dependency resolution
- **GIVEN** a generated production task that depends on a prerequisite flow step
- **WHEN** the prerequisite task is still pending or incomplete
- **THEN** the downstream task SHALL display a dependency warning indicator in the production workspace
