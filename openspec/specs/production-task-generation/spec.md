# production-task-generation Specification

## Purpose

Defines deterministic production-task planning from confirmed orders, their recipe assignments, and their promised pickup times.
## Requirements
### Requirement: Confirmed orders generate a production plan
The system SHALL generate production tasks for each item in a confirmed order using the assigned production flow, ordered quantity, and pickup timestamp. When the assigned flow includes a starter-build step, the generated task SHALL expose the calculated starter build associated with that order or its compatible combined build.

#### Scenario: Confirming a sourdough order
- **WHEN** a user confirms an order containing sourdough loaves with a Friday pickup time
- **THEN** the system creates the applicable starter check, preparation, mixing, fermentation, baking, cooling, and packaging tasks at the times defined by the assigned flow

#### Scenario: Viewing a starter-build task
- **WHEN** a user opens a generated starter-build task
- **THEN** they can view the associated seed starter, flour, water, total build, usable amount, and expected retained amount

### Requirement: Deterministic task scheduling and traceability
The system SHALL calculate task timestamps from flow-step scheduling rules and SHALL retain links from every generated task to its source order, order item, recipe, flow, and flow step.

#### Scenario: Inspecting a generated task
- **WHEN** a user opens a generated production task
- **THEN** they can identify its scheduled time, instructions, product quantity, source order, and source flow step

#### Scenario: Generating the same plan again
- **WHEN** the system regenerates an unchanged confirmed order's plan
- **THEN** it produces the same future task schedule without duplicate tasks

### Requirement: Newly created orders retain generated-plan association
The system SHALL retain the generated-plan association for a newly created order so order details can retrieve its tasks by that order identifier.

#### Scenario: Opening a newly created order
- **WHEN** a baker opens an order after completing its creation workflow
- **THEN** the order details show the tasks generated for that order

### Requirement: Future-task recalculation
The system SHALL recalculate only future incomplete tasks when a confirmed order's quantity, pickup time, or recipe-flow assignment changes, and SHALL preserve completed, skipped, and cancelled task history.

#### Scenario: Moving a pickup time
- **WHEN** a user changes the pickup time for a confirmed order
- **THEN** its future pending tasks are rescheduled according to the assigned flow while completed tasks remain unchanged

### Requirement: Task states and dependency handling
The system SHALL persist Pending, In Progress, Completed, Skipped, or Cancelled as a production task's lifecycle state. It SHALL derive Due Soon, Due Now, or Overdue scheduling urgency from the scheduled timestamp, bakery timezone, current time, and whether the task is terminal; urgency SHALL NOT replace or mutate lifecycle state. Users SHALL be able to complete a task, add a note, reschedule a future task, or skip a task with a reason, and dependent tasks SHALL indicate when their prerequisite is incomplete.

#### Scenario: Viewing an overdue pending task
- **WHEN** a Pending task's scheduled time has passed in the bakery timezone
- **THEN** the task remains in the Pending lifecycle state and is separately presented with Overdue urgency

#### Scenario: Completing an overdue task
- **WHEN** a user completes a task that was displayed as Overdue
- **THEN** the persisted lifecycle becomes Completed and the task is no longer presented as actionable overdue work

#### Scenario: Skipping a production task
- **WHEN** a user skips a task and provides a reason
- **THEN** the task records the Skipped lifecycle state and reason and dependent tasks show that the prerequisite is incomplete

### Requirement: Production-plan warnings
The system SHALL flag incomplete dependency, timing-buffer, and schedule-overlap conflicts without silently changing the generated schedule.

#### Scenario: Detecting an impossible plan
- **WHEN** a flow schedule leaves insufficient time for required baking, cooling, or packaging before pickup
- **THEN** the system displays a warning and leaves the user in control of any rescheduling

### Requirement: Interactive Task Timers & Execution Tracking
The production workspace MUST allow bakers to start and stop active timers for individual tasks, tracking accumulated execution seconds and displaying elapsed time.

#### Scenario: Starting and stopping a task timer
- **GIVEN** a pending production task on the Production screen
- **WHEN** the user clicks "Start Timer"
- **THEN** the timer begins counting elapsed seconds live
- **WHEN** the user clicks "Pause Timer" or "Complete"
- **THEN** the timer stops and records the total elapsed execution duration

### Requirement: Task Delay Postponement & Rescheduling
The production workspace MUST allow postponing tasks by preset intervals (+15m, +30m, next shift) and updating scheduled time strings and urgency indicators accordingly.

#### Scenario: Postponing a delayed task
- **GIVEN** a task scheduled for `10:00 AM`
- **WHEN** the user clicks "Delay" and selects "+15 minutes"
- **THEN** the task scheduled time updates to `10:15 AM` and logs a delay movement

### Requirement: Prerequisite Dependency Guarding
The production workspace MUST validate step dependencies and warn bakers if upstream prerequisite tasks are incomplete before allowing completion of downstream tasks.

#### Scenario: Attempting to complete a task with pending prerequisite
- **GIVEN** a shaping task whose mixing step task is still pending
- **WHEN** the user views the shaping task card
- **THEN** a warning badge "Prerequisite Pending: Mix Dough" is displayed and quick-complete requires confirmation

### Requirement: Database Task Generation and Idempotent Rescheduling
The database engine MUST automatically generate and update production schedule tasks in `production_tasks` when an order is created or rescheduled without overwriting completed tasks or creating duplicate entries.

#### Scenario: Idempotent task regeneration for an updated order date
- **GIVEN** an existing customer order with generated production tasks
- **WHEN** the order fulfillment date is changed
- **THEN** pending task scheduled dates are updated in `production_tasks` while completed step records remain intact

