# production-schedule-views Specification

## Purpose

Defines chronological production work views that help a baker see and act on the tasks due for upcoming pickup commitments.

## Requirements

### Requirement: Today and Tomorrow production views
The system SHALL provide Today and Tomorrow views that show generated production tasks and pickup events in chronological order using the bakery's configured timezone.

#### Scenario: Reviewing today's work
- **WHEN** a user opens the Today view
- **THEN** they see today's tasks and pickups ordered by time with their status, product or order context, and urgency

#### Scenario: Reviewing tomorrow's work
- **WHEN** a user opens the Tomorrow view
- **THEN** they see tomorrow's tasks and pickups in chronological order independently of today's completed work

### Requirement: Calendar production view
The system SHALL provide a calendar view that displays scheduled production tasks and pickups by day and allows the user to open the underlying task or order context.

#### Scenario: Inspecting a scheduled day
- **WHEN** a user selects a date containing production work
- **THEN** the calendar displays the day's scheduled tasks and pickups and allows the user to inspect their details

### Requirement: Actionable schedule items
Each schedule item SHALL display its scheduled time, task status, product or order context, instructions when relevant, and any unresolved dependency or conflict warning.

#### Scenario: Acting from a schedule view
- **WHEN** a user opens a pending task from Today, Tomorrow, or Calendar
- **THEN** they can complete, skip with a reason, reschedule, or add a note without losing schedule context
