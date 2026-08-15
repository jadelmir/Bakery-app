# Delta: Database Migration Integrity

## ADDED Requirements

### Requirement: hosted migration history matches the actual schema

The system MUST detect and repair cases where a hosted Supabase migration is recorded as applied but required schema objects from that migration are absent.

#### Scenario: Applied migration is missing expected objects

- **WHEN** staging migration history reports a committed migration as applied
- **AND** one or more required objects defined by that migration are absent from the linked staging schema
- **THEN** deployment verification MUST fail
- **AND** the system MUST treat the condition as schema drift rather than removing the missing object from verification.

#### Scenario: Forward-only repair

- **WHEN** schema drift is confirmed
- **THEN** the repair MUST be delivered as a new timestamped migration
- **AND** already-published historical migration files MUST remain unchanged
- **AND** existing legitimate staging data MUST be preserved.

### Requirement: schema drift repair is additive and guarded

A repair migration MUST create or restore only missing or safely repairable foundational objects and MUST fail rather than silently perform destructive replacement.

#### Scenario: Required object is absent

- **WHEN** a required foundational table, function, trigger, index, foreign key, or policy is missing
- **THEN** the repair MAY create it using idempotent or catalog-guarded SQL
- **AND** existing unrelated objects and data MUST remain unchanged.

#### Scenario: Existing object conflicts with expected contract

- **WHEN** an existing object cannot be made compliant through a safe additive change
- **THEN** the migration MUST stop with an actionable error
- **AND** MUST NOT drop, truncate, or silently replace user data.

### Requirement: staging migration repair is verifiable

The system MUST prove that migration history, schema state, and deployment behavior are aligned after repair.

#### Scenario: Repair succeeds

- **WHEN** the repair migration is applied to staging
- **THEN** required tables including `profiles`, `bakeries`, `bakery_memberships`, `customers`, `orders`, `order_items`, and `recipes` MUST exist
- **AND** foundational auth/profile and membership behavior MUST pass smoke verification
- **AND** a subsequent migration comparison MUST show no unexpected historical replay.

#### Scenario: Deployment continues only after schema integrity is proven

- **WHEN** required schema and migration integrity checks pass
- **THEN** the staging deployment MAY continue to Edge Functions deployment
- **ELSE** the staging deployment MUST remain failed.
