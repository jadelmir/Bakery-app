## Purpose

Defines reusable, recipe-assigned production flows so bakery work can be planned from an ordered sequence of timed steps.

## ADDED Requirements

### Requirement: Default bakery production flows
The system SHALL provide editable Standard Sourdough Loaf and Standard Focaccia flow templates. The sourdough flow SHALL include shaping before cold fermentation, and the focaccia flow SHALL omit shaping while including transfer to a container or tray before cold fermentation.

#### Scenario: Viewing default flows
- **WHEN** a user opens the flow builder
- **THEN** they can inspect the ordered default steps, timing, duration, instructions, and enabled state for the sourdough loaf and focaccia templates

#### Scenario: Comparing product-specific flow steps
- **WHEN** a user views the default sourdough and focaccia flows
- **THEN** the sourdough flow contains shaping and the focaccia flow contains transfer to a container or tray instead of shaping

### Requirement: Editable and assignable flow templates
The system SHALL allow a user to duplicate a flow template, edit its name and enabled ordered steps, configure absolute or relative step timing, and assign one flow to each supported recipe.

#### Scenario: Creating a custom flow from a template
- **WHEN** a user duplicates a default flow and changes a step's timing or instructions
- **THEN** the resulting flow retains the ordered steps and represents the user's configured values

#### Scenario: Assigning a flow to a recipe
- **WHEN** a user selects a production flow for a supported recipe
- **THEN** newly generated production tasks for that recipe use the selected flow

### Requirement: Flow-step scheduling information
Each enabled flow step SHALL define a name, instructions, scheduling rule, and order position. A scheduling rule SHALL support a pickup-relative date and clock time or an offset relative to another flow step; duration and groupability settings SHALL be configurable when applicable.

#### Scenario: Configuring a timed flow step
- **WHEN** a user edits a flow step
- **THEN** they can identify when it is scheduled and what instructions the baker must follow

