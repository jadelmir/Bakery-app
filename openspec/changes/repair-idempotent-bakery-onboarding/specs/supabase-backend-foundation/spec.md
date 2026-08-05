## ADDED Requirements

### Requirement: Workspace creation RPC contracts are distinct and versioned

The database SHALL expose separate authenticated operations for idempotent
default onboarding and explicit additional bakery creation, and each operation
SHALL retain its documented return contract across migrations.

#### Scenario: Default creation is idempotent

- **WHEN** an authenticated user invokes default bakery creation twice
- **THEN** both calls return the same accessible bakery ID and exactly one
  owner membership exists for that onboarding flow

#### Scenario: Explicit additional creation is additive

- **WHEN** an authenticated user with an existing bakery invokes the explicit
  additional-bakery operation
- **THEN** one new bakery and owner membership are created, the existing bakery
  remains accessible, and the new bakery ID is returned

#### Scenario: Clean rebuild preserves both RPC contracts

- **WHEN** the local database is reset from committed migrations and seed data
- **THEN** both RPC wrappers, grants, generated database types, and database
  tests agree with their distinct onboarding and additional-creation semantics
