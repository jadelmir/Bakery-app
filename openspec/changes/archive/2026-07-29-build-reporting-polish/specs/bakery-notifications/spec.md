## Purpose

Keeps bakers aware of time-sensitive production and inventory conditions inside the application.

## ADDED Requirements

### Requirement: Actionable in-app notifications
The system SHALL surface configurable in-app notifications for upcoming production tasks, pickups, shortages, and insufficient starter builds.

#### Scenario: Viewing a shortage alert
- **WHEN** an upcoming requirement has a shortage
- **THEN** the baker sees an in-app alert that identifies the affected item and needed action
