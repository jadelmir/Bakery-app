## ADDED Requirements

### Requirement: Post-migration dependencies remain schema-compatible

Every migration that replaces or materially changes a shared table SHALL
reconcile committed functions, triggers, policies, seed data, and generated
database types that depend on that table before the migration is considered
complete.

#### Scenario: Online checkout uses the regenerated task table

- **WHEN** an online customer checkout creates its production task after the
  task-regeneration migration has been applied
- **THEN** `private.create_online_order` inserts only current
  `production_tasks` columns, returns its existing contract, and does not
  reference removed order-item snapshot columns

#### Scenario: Online checkout retry remains idempotent

- **WHEN** the same supported checkout idempotency key is submitted again
- **THEN** the function returns the existing order result without creating a
  duplicate order or production task

#### Scenario: A clean local rebuild checks dependent objects

- **WHEN** the local database is reset from all committed migrations and seed
  data
- **THEN** migrations apply successfully, the online-order database test passes,
  and database lint reports no stale production-task dependency
