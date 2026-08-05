# Project Documentation Governance

## Requirement: OpenSpec remains the planning authority

The repository SHALL use OpenSpec as the only authoritative location for
planned requirements, change design, implementation tasks, progress state, and
change/archive lifecycle state.

### Scenario: Durable documentation describes current behavior

- **WHEN** an agent updates reusable documentation under `docs/`
- **THEN** the document SHALL describe durable current-system or product
  reference rather than active task/progress/change state
- **AND** any planned change state SHALL remain in OpenSpec.

## Requirement: Durable reference documentation has one canonical location

The repository SHALL keep each reusable documentation responsibility in one
canonical location and SHALL prefer references/links over duplicate copies.

### Scenario: A canonical reference document moves

- **WHEN** a durable reference document is moved to a categorized docs path
- **THEN** current non-archive repository references SHALL be updated in the
  same change
- **AND** a duplicate compatibility copy SHALL NOT be left at the old path.

## Requirement: Documentation moves are conservative

Documentation SHALL only be moved when its durable responsibility and target
category are clear from content and repository conventions.

### Scenario: Classification is uncertain

- **WHEN** a document's responsibility or canonical destination is ambiguous
- **THEN** the document SHALL remain in place
- **AND** the ambiguity SHALL be reported for manual review rather than being
  resolved by a speculative move.

## Requirement: Historical OpenSpec artifacts remain immutable

Archived OpenSpec changes SHALL NOT be edited solely to update documentation
paths introduced by later organization changes.

### Scenario: Archived artifact contains an old documentation path

- **WHEN** a later documentation reorganization changes the canonical path
- **THEN** the archived artifact SHALL retain its historical content
- **AND** current configuration/current docs SHALL use the new canonical path.

## Requirement: Categorized database reference is discoverable

When the project contains implemented database/migration behavior, the durable
current database reference SHALL be discoverable under the configured docs
root's database category.

### Scenario: Orch checks database documentation

- **WHEN** Orch detects database implementation signals
- **THEN** a verified current database reference under `docs/database/` SHALL
  satisfy the durable database-reference expectation.
