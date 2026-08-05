## Purpose

Defines deterministic production-task planning from confirmed orders, their recipe assignments, and their promised pickup times.

## ADDED Requirements

### Requirement: Confirmed orders generate a production plan
The system SHALL generate production tasks for each item in a confirmed order using the assigned production flow, ordered quantity, and pickup timestamp.

#### Scenario: Confirming a sourdough order
- **WHEN** a user confirms an order containing sourdough loaves with a Friday pickup time
- **THEN** the system creates the applicable starter check, preparation, mixing, fermentation, baking, cooling, and packaging tasks at the times defined by the assigned flow

### Requirement: Deterministic task scheduling and traceability
The system SHALL calculate task timestamps from flow-step scheduling rules and SHALL retain links from every generated task to its source order, order item, recipe, flow, and flow step.

#### Scenario: Inspecting a generated task
- **WHEN** a user opens a generated production task
- **THEN** they can identify its scheduled time, instructions, product quantity, source order, and source flow step

#### Scenario: Generating the same plan again
- **WHEN** the system regenerates an unchanged confirmed order's plan
- **THEN** it produces the same future task schedule without duplicate tasks

### Requirement: Future-task recalculation
The system SHALL recalculate only future incomplete tasks when a confirmed order's quantity, pickup time, or recipe-flow assignment changes, and SHALL preserve completed, skipped, and cancelled task history.

#### Scenario: Moving a pickup time
- **WHEN** a user changes the pickup time for a confirmed order
- **THEN** its future pending tasks are rescheduled according to the assigned flow while completed tasks remain unchanged

### Requirement: Task states and dependency handling
The system SHALL support Pending, In Progress, Completed, Skipped, Cancelled, and Overdue task states. Users SHALL be able to complete a task, add a note, reschedule a future task, or skip a task with a reason; dependent tasks SHALL indicate when their prerequisite is incomplete.

#### Scenario: Skipping a production task
- **WHEN** a user skips a task and provides a reason
- **THEN** the task records the skipped state and reason and dependent tasks show that the prerequisite is incomplete

### Requirement: Production-plan warnings
The system SHALL flag incomplete dependency, timing-buffer, and schedule-overlap conflicts without silently changing the generated schedule.

#### Scenario: Detecting an impossible plan
- **WHEN** a flow schedule leaves insufficient time for required baking, cooling, or packaging before pickup
- **THEN** the system displays a warning and leaves the user in control of any rescheduling

