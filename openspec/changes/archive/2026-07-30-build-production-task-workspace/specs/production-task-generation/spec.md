# production-task-generation Delta Specification

## ADDED Requirements

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
