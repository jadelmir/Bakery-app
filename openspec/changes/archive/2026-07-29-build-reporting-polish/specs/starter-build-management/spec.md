## ADDED Requirements

### Requirement: Insufficient starter creates notifications
The system SHALL create an in-app notification when a starter build has insufficient seed starter.

#### Scenario: Notifying a baker of insufficient starter
- **WHEN** a calculated build needs more seed starter than is available
- **THEN** the baker can identify the build from an in-app notification
