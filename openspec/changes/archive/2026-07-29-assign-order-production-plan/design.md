## Context

The current add-order flow appends generated tasks but does not add the corresponding order record to the shared local order collection.

## Goals / Non-Goals

**Goals:** Create one local order record and one traceable task plan together.

**Non-Goals:** Backend persistence or changes to scheduling rules.

## Decisions

Use a shared local order collection with a stable generated order id, then add its tasks atomically and guard repeated completion by id.

## Risks / Trade-offs

- [Repeated submission] → Reuse the generated order id and skip an existing plan.

## Migration Plan

Update creation state, order details, and focused tests; rollback is a normal source revert.
