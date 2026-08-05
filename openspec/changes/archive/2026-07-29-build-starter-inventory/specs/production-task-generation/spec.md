## MODIFIED Requirements

### Requirement: Confirmed orders generate a production plan
The system SHALL generate production tasks for each item in a confirmed order using the assigned production flow, ordered quantity, and pickup timestamp. When the assigned flow includes a starter-build step, the generated task SHALL expose the calculated starter build associated with that order or its compatible combined build.

#### Scenario: Confirming a sourdough order
- **WHEN** a user confirms an order containing sourdough loaves with a Friday pickup time
- **THEN** the system creates the applicable starter check, preparation, mixing, fermentation, baking, cooling, and packaging tasks at the times defined by the assigned flow

#### Scenario: Viewing a starter-build task
- **WHEN** a user opens a generated starter-build task
- **THEN** they can view the associated seed starter, flour, water, total build, usable amount, and expected retained amount
