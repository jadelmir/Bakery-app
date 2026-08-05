## Purpose

Ensures primary bakery workflows remain usable and understandable on desktop and mobile screens.

## ADDED Requirements

### Requirement: Responsive accessible workflow states
The system SHALL provide accessible labels and clear loading, empty, error, and completion feedback for primary workflows at desktop and mobile widths.

#### Scenario: Viewing an empty report
- **WHEN** no records match the selected report filters
- **THEN** the interface displays an accessible empty state with guidance to change the filters
