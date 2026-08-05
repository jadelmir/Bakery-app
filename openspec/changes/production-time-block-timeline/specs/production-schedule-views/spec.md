# production-schedule-views Specification

## MODIFIED Requirements

### Requirement: Today and Tomorrow production views

The system SHALL provide Today and Tomorrow views that show generated
production work and pickup events in chronological time blocks using the
bakery's configured timezone. Today SHALL be selected by default when the
Production page opens. Each time block SHALL group tasks sharing the selected
day, scheduled minute, and flow step while preserving product-level quantities
and underlying task traceability.

#### Scenario: Reviewing today's work

- **WHEN** a user opens the Production page
- **THEN** Today is selected by default
- **AND** today's production blocks and pickups appear in chronological order
- **AND** each block shows the work step and aggregated product quantities

#### Scenario: Reviewing tomorrow's work

- **WHEN** a user opens the Tomorrow view
- **THEN** tomorrow's production blocks and pickups appear in chronological
  order independently of today's completed work
- **AND** the same time-and-step grouping is used

#### Scenario: Grouping shared production work

- **GIVEN** 10 sourdough loaves and 5 focaccia tasks share the same scheduled
  time and flow step
- **WHEN** the time block renders
- **THEN** one block appears for that time and step
- **AND** the block shows `10 sourdough loaves` and `5 focaccia` as separate
  product quantities
- **AND** the underlying tasks remain available for traceable detail

### Requirement: Calendar production view

The system SHALL provide a calendar view that displays scheduled production
time blocks and pickups by day and allows the user to open the underlying task
or order context. Calendar day selections SHALL use the same grouping and
quantity presentation as Today and Tomorrow.

#### Scenario: Inspecting a scheduled day

- **WHEN** a user selects a date containing production work
- **THEN** the calendar displays that day's grouped production blocks and
  pickups in chronological order
- **AND** the user can inspect the underlying task and order details

### Requirement: Actionable schedule items

Each production time block SHALL display its scheduled time, step, product
quantities, derived progress, and any unresolved dependency or conflict warning.
The block SHALL provide a grouped completion action for all remaining active
underlying tasks while preserving task-level controls in expanded details.

#### Scenario: Acting from a schedule view

- **WHEN** a baker opens a pending production block from Today, Tomorrow, or
  Calendar
- **THEN** they can complete the grouped work, inspect instructions, and use
  task-level skip, reschedule, timer, note, and dependency controls without
  losing schedule context

#### Scenario: Completing a grouped production block

- **GIVEN** a time block contains multiple active tasks
- **WHEN** the baker activates the grouped completion action
- **THEN** every active underlying task in that block is completed through the
  existing task update path
- **AND** the block's derived status and product progress update immediately
- **AND** existing task-completion side effects remain applied once per task

### Requirement: Starter preparation is legible in the time-block timeline

Starter work SHALL show the contributing product quantities and the existing
calculated starter preparation details when a compatible starter build is
present for the block.

#### Scenario: Reviewing combined starter demand

- **GIVEN** a starter block contributes to 10 sourdough loaves and 5 focaccia
- **WHEN** the baker expands the starter block
- **THEN** the block identifies both product quantities
- **AND** it shows the calculated seed, flour, water, retained, and usable
  starter amounts from the existing starter planning calculation
