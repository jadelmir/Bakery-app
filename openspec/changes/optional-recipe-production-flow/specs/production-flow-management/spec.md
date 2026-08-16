## MODIFIED Requirements

### Requirement: Editable and assignable flow templates

The system SHALL allow a user to duplicate a flow template, edit its name and
enabled ordered steps, configure absolute or relative step timing, and
optionally assign one flow to each supported recipe. A recipe MAY be created
without a flow and receive its assignment later.

#### Scenario: Creating a custom flow from a template

- **WHEN** a user duplicates a default flow and changes a step's timing or
  instructions
- **THEN** the resulting flow retains the ordered steps and represents the
  user's configured values

#### Scenario: Assigning a flow during recipe creation

- **WHEN** a user selects a production flow while creating a recipe
- **THEN** the recipe retains that flow assignment
- **AND** subsequent supported production planning can use the assigned flow

#### Scenario: Deferring flow assignment

- **WHEN** a user creates a recipe without selecting a production flow
- **THEN** the recipe is saved without a flow assignment
- **AND** the user can assign a flow later through the recipe's flow workflow
