## Purpose

Provides a dependable feeding plan for scheduled sourdough work so bakers can prepare sufficient active starter while retaining the configured amount for future production.

## ADDED Requirements

### Requirement: Starter profile and build calculation
The system SHALL track a starter profile's current retained amount, last feeding time, hydration, default feeding ratio, and retained-starter target. For relevant scheduled orders, it SHALL calculate usable starter demand and a recommended build showing seed starter, flour, water, total build, usable amount, and expected retained amount.

#### Scenario: Calculating a loaf starter build
- **WHEN** scheduled orders require 100 g of usable active starter and the retained target is 40 g
- **THEN** the Starter view shows a build whose total target is 140 g and separately displays its seed starter, flour, water, usable amount, and expected retained amount

#### Scenario: Using a custom build ratio
- **WHEN** a baker selects a custom feeding ratio for a starter-build step
- **THEN** the displayed seed, flour, and water quantities are recalculated using that ratio while preserving the required usable amount and retained target

### Requirement: Compatible starter requirements can be combined
The system SHALL combine starter demand into one recommended build only when the contributing orders use compatible starter profiles and require the starter to peak in the same production window. The combined build SHALL retain the contributing orders and their usable-starter quantities for traceability.

#### Scenario: Combining compatible orders
- **WHEN** two orders use the same starter profile and have compatible starter-build peak windows
- **THEN** the Starter view presents one build with their combined usable-starter demand and identifies both contributing orders

#### Scenario: Separating incompatible starter builds
- **WHEN** two scheduled orders use different starter profiles or incompatible peak windows
- **THEN** the system presents separate recommended builds for those orders

### Requirement: Starter availability warnings and baker overrides
The system SHALL warn when a recommended build's seed amount exceeds the current retained starter amount. A baker SHALL be able to override the recommended seed, flour, water, or retained amount, and the system SHALL show the resulting totals and preserve the override for the associated build.

#### Scenario: Insufficient retained starter
- **WHEN** a calculated build needs more seed starter than the profile's current retained amount
- **THEN** the build is visibly flagged with an insufficient-starter warning

#### Scenario: Overriding a recommended build
- **WHEN** a baker changes the flour or water amount of a recommended build
- **THEN** the Starter view shows the adjusted total, usable amount, and expected remainder for that build
