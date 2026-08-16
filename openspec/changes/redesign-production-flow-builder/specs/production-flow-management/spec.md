## MODIFIED Requirements

### Requirement: Default bakery production flows
The system SHALL provide editable Standard Sourdough Loaf and Standard Focaccia flow templates. The sourdough flow SHALL include shaping before cold fermentation, and the focaccia flow SHALL omit shaping while including transfer to a container or tray before cold fermentation.

#### Scenario: Viewing default flows
- **WHEN** a user opens the flow builder
- **THEN** they can choose a default flow from larger clickable cards displayed next to each other, with an Add flow card always first
- **AND** clicking a flow card opens that flow directly in the full builder with its ordered steps in a visual timeline showing each step's name, category, enabled state, readable pickup-relative timing, duration, and baker instructions

#### Scenario: Comparing product-specific flow steps
- **WHEN** a user views the default sourdough and focaccia flows
- **THEN** the sourdough flow contains shaping and the focaccia flow contains transfer to a container or tray instead of shaping
- **AND** the timeline makes the difference visible without requiring the user to open every step

### Requirement: Editable and assignable flow templates
The system SHALL allow a user to duplicate a flow template, edit its name and ordered steps, configure the supported pickup-relative step timing, and assign one flow to each supported recipe. The flow builder SHALL provide explicit add, duplicate, reorder, delete, reset, cancel, and save actions without exposing technical field names as the primary user-facing labels. Enabled/disabled state SHALL remain visible and compatible with the existing model, but the selected-step toolbar SHALL NOT show a separate Enable/Disable button.

#### Scenario: Creating a custom flow from a template
- **WHEN** a user duplicates a default flow and changes a step's timing or instructions
- **THEN** the resulting flow retains the ordered steps and represents the user's configured values
- **AND** the duplicated step has a unique identity and appears next to the source step

#### Scenario: Creating a custom flow from an empty start
- **WHEN** a user chooses to create a new flow for a recipe
- **THEN** the builder opens with no steps in the timeline
- **AND** the user can add the first step explicitly before adding subsequent steps
- **AND** the first step has no prerequisite unless the user chooses one

#### Scenario: Importing an existing flow into a new draft
- **WHEN** a user chooses to create a new flow and selects an existing flow to import
- **THEN** the builder copies the source flow's steps, timing, instructions, and dependency relationships into the new draft
- **AND** the copied steps receive fresh identities while the source flow remains unchanged
- **AND** the user can edit the imported draft before saving it
- **AND** selecting `Start with a blank flow` clears the imported steps and restores the new-flow draft to zero steps

#### Scenario: Importing organized JSON into a new flow
- **WHEN** a user opens JSON import for a new flow, copies the AI-organizer prompt, pastes a valid organized flow JSON, and chooses to add it
- **THEN** the builder populates the flow name, recipe, steps, timing, instructions, enabled state, and dependency relationships from the JSON
- **AND** the builder remaps imported step identities so the new draft can be saved independently
- **AND** malformed JSON or missing required step names is rejected with a correction message without changing the draft

#### Scenario: Reordering and reviewing step state
- **WHEN** a user reorders a step or reviews its enabled state in the flow builder
- **THEN** the timeline reflects the new order and current enabled or disabled state immediately
- **AND** the saved flow preserves the corresponding order and `enabled` value

#### Scenario: Deleting a depended-on step
- **WHEN** a user attempts to delete a step referenced by another step
- **THEN** the builder identifies the affected dependency and requires the user to remove or reassign that dependency before saving

#### Scenario: Assigning a flow to a recipe
- **WHEN** a user selects a production flow for a supported recipe
- **THEN** newly generated production tasks for that recipe use the selected flow

### Requirement: Flow-step scheduling information
Each enabled flow step SHALL define a name, instructions, scheduling rule, and order position. A scheduling rule SHALL support a pickup-relative date and clock time or an offset relative to another flow step; duration and groupability settings SHALL be configurable when applicable. The builder SHALL present the supported current pickup-relative date/time values in plain language and show a live readable schedule summary.

#### Scenario: Configuring a timed flow step
- **WHEN** a user edits a flow step
- **THEN** they can identify when it is scheduled from a guided timing section and what instructions the baker must follow
- **AND** the builder displays a summary such as “1 day before pickup at 2:00 PM” rather than requiring interpretation of a raw offset field

#### Scenario: Reviewing a step dependency
- **WHEN** a user configures a prerequisite for a flow step
- **THEN** the control lists steps by their baker-facing names and the timeline shows the dependency relationship without exposing `dependsOn` as the primary label

### Requirement: Custom Production Flow Building & Task Dependency Resolution
The application SHALL allow users to create, modify, reorder, and save custom multi-step production flows for recipe products. The builder SHALL validate the draft before saving and SHALL preserve the existing `ProductionFlow` and `FlowStep` save contract so subsequent generated tasks continue to follow the saved flow.

#### Scenario: User creates and saves a custom multi-step production flow for a recipe
- **GIVEN** a recipe manager or production administrator
- **WHEN** the user opens the Production Flow Builder for a recipe, adds custom steps with day offsets and target times, and saves a valid flow
- **THEN** the custom production flow SHALL be persisted in the bakery workspace domain snapshot
- **AND** subsequent orders for that recipe SHALL generate tasks adhering to the custom step flow

#### Scenario: Builder blocks an invalid flow
- **WHEN** a user attempts to save a flow with no enabled steps, an empty enabled step name or instruction, an invalid time, a non-positive duration, a missing dependency reference, a self-dependency, or a dependency cycle
- **THEN** the builder SHALL block the save
- **AND** it SHALL identify the affected step and explain the correction in baker-facing language

#### Scenario: Task dependency resolution
- **GIVEN** a generated production task that depends on a prerequisite flow step
- **WHEN** the prerequisite task is still pending or incomplete
- **THEN** the downstream task SHALL display a dependency warning indicator in the production workspace

## ADDED Requirements

### Requirement: Flow builder draft safety and responsive editing
The flow builder SHALL keep unsaved edits in a draft until the user explicitly saves, warn before discarding a dirty draft, and provide equivalent editing access on desktop and mobile layouts.

#### Scenario: Canceling a dirty draft
- **WHEN** a user changes a flow and chooses Cancel or closes the builder before saving
- **THEN** the builder SHALL ask the user to confirm discarding unsaved changes
- **AND** choosing to keep editing SHALL preserve the draft

#### Scenario: Editing a step on a narrow viewport
- **WHEN** a user opens the flow builder on a mobile-sized viewport
- **THEN** the ordered timeline, add-step action, selected-step details, validation messages, and save/cancel actions SHALL remain reachable without requiring horizontal scrolling

#### Scenario: Keyboard-accessible step management
- **WHEN** a user navigates the flow builder with a keyboard or assistive technology
- **THEN** every step action SHALL have an accessible name, reorder SHALL have a non-drag alternative, and the selected step and validation errors SHALL be announced through standard focus and status semantics
