# bakery-workspace-selection Delta Specification

## MODIFIED Requirements

### Requirement: Deterministic local bakery seed and mock fixtures

The local development environment SHALL derive bakery memberships from
committed migrations and `Front-end/supabase/seed.sql`, SHALL keep mock
workspace fixtures free of runtime-created bakery records, and SHALL provide a
repeatable verification that the seeded admin sees only the committed bakery
before explicit creation.

#### Scenario: Clean local seed restores the admin workspace

- **WHEN** the local Supabase database is reset from committed migrations and
  seed data
- **THEN** `admin@jadorebakery.com` has exactly one accessible bakery named
  `J'adore Bakery`
- **AND** no `Runtime Check Bakery` row exists in the local bakery data

#### Scenario: Default mock workspace contains no runtime verification bakery

- **WHEN** the default mock workspace adapter is loaded for the admin journey
- **THEN** it exposes the committed mock bakery fixture
- **AND** it does not expose a `Runtime Check Bakery` membership

#### Scenario: Explicit creation remains the only addition path

- **GIVEN** the clean-seeded admin has the existing `J'adore Bakery`
  membership
- **WHEN** the user explicitly creates a valid new bakery
- **THEN** the new bakery is added to the user's accessible memberships and
  becomes active
- **AND** the existing seeded bakery remains accessible
