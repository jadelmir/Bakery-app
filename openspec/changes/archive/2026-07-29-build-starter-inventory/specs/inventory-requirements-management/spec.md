## Purpose

Gives bakers a complete, time-bound view of ingredient and packaging demand so shortages can be resolved before scheduled production starts.

## ADDED Requirements

### Requirement: Inventory availability is tracked
The system SHALL track an on-hand quantity for each ingredient and packaging item used by supported recipes. It SHALL present each item's available quantity in the Inventory view.

#### Scenario: Viewing on-hand inventory
- **WHEN** a baker opens Inventory
- **THEN** each tracked ingredient and packaging item displays its current available quantity and unit

### Requirement: Requirements include recipe and starter-build inputs
The system SHALL calculate required quantities by selected day and by order from scheduled recipe ingredients, packaging, and the flour and water used by associated starter builds. The system SHALL show Available, Required, and Shortage quantities for each item.

#### Scenario: Viewing a daily requirement
- **WHEN** a baker selects a day containing scheduled sourdough production
- **THEN** the requirement includes dough ingredients and the flour and water required by that day's related starter build

#### Scenario: Inspecting an order requirement
- **WHEN** a baker views inventory requirements for a specific order
- **THEN** the system shows the ingredients and packaging required for that order and its attributable starter-build inputs

### Requirement: Shortages produce a shopping list
The system SHALL identify an item as short when its required quantity exceeds its available quantity and SHALL provide a shopping-list view containing each short item and the quantity needed to cover the shortfall.

#### Scenario: Generating a shopping list
- **WHEN** flour availability is lower than the selected period's calculated flour requirement
- **THEN** the shopping list includes flour and the difference between required and available quantities

#### Scenario: No shortage for sufficient stock
- **WHEN** an item's available quantity meets or exceeds its requirement
- **THEN** the item is not included in the shopping list

### Requirement: Inventory deductions are applied once
The system SHALL use one configured deduction point: either associated production-task completion or order completion. It SHALL record the source of each deduction and SHALL prevent the same order item or production work from reducing inventory more than once.

#### Scenario: Deducting at task completion
- **WHEN** task-completion deduction is configured and a qualifying production task is completed
- **THEN** the associated inventory quantities are reduced once and the deduction is recorded against that task

#### Scenario: Preventing duplicate deduction
- **WHEN** an order already has inventory deducted through the configured deduction point
- **THEN** completing a related event does not deduct its inventory a second time
