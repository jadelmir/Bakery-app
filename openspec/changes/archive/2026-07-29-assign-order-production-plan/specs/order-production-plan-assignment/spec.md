## Purpose

Ensures a completed order immediately owns and exposes its generated production plan in the local prototype.

## ADDED Requirements

### Requirement: Completed orders receive one production plan
The system SHALL assign the generated production plan to the order created by the completed order workflow and retain the plan's tasks under that order identifier.

#### Scenario: Completing a new order
- **WHEN** a baker completes a new order and generates its local production plan
- **THEN** the new order displays its assigned plan and every generated task identifies that new order

#### Scenario: Preventing duplicate assignment
- **WHEN** the plan-generation completion action is repeated for the same new order
- **THEN** the order retains one plan without duplicate generated tasks
