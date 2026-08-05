## ADDED Requirements

### Requirement: Newly created orders retain generated-plan association
The system SHALL retain the generated-plan association for a newly created order so order details can retrieve its tasks by that order identifier.

#### Scenario: Opening a newly created order
- **WHEN** a baker opens an order after completing its creation workflow
- **THEN** the order details show the tasks generated for that order

## MODIFIED Requirements

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
