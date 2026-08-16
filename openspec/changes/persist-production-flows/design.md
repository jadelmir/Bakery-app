## Context

The Production Flow Builder edits the existing `ProductionFlow` contract (`id`,
`name`, `recipe`, and ordered `FlowStep` values) and currently reaches the local
adapter only. The domain types already declare `saveProductionFlow` and
`deleteProductionFlow`, and the local adapter writes flows into
`BakeryDomainSnapshot.flowsById`, but `BakeryDomainCommands`, the reducer's
change application, and the hosted `BakeryWorkspace` adapter do not yet expose
or load those mutations from Supabase.

The application is a React SPA using Supabase's Data API and PostgreSQL
functions, with bakery membership as the tenant boundary. Existing generated
production tasks refer to the current string flow and step IDs, so persistence
must not silently replace those identifiers with unrelated UUIDs.

## Goals / Non-Goals

**Goals:**

- Persist editable production flows and their ordered steps per bakery.
- Load persisted flows into the domain snapshot when an authenticated bakery
  workspace opens.
- Save a complete flow and replacement step set atomically, then apply the
  authoritative result to the in-memory snapshot.
- Preserve local/demo adapter behavior and current task-generation contracts.
- Enforce bakery membership in the database and verify cross-bakery isolation.

**Non-Goals:**

- Redesigning the builder interaction, which belongs to
  `redesign-production-flow-builder`.
- Adding an AI provider or server-side JSON transformation.
- Rewriting historical production tasks or introducing flow versioning.
- Seeding or migrating every historical local-only flow into hosted storage;
  built-in defaults remain code-backed fallbacks and persisted edits/custom
  flows overlay them.

## Decisions

### 1. Add bakery-scoped `production_flows` and `production_flow_steps` tables

Use two normalized public tables. Flow and step IDs remain `text` so existing
IDs such as `flow-sourdough` and task references remain valid. Every row also
stores `bakery_id`; uniqueness is scoped by bakery. The step table stores the
current domain fields (`day_offset`, `time`, `duration`, `category`,
`instructions`, `enabled`, `groupable`, `depends_on`, and `sort_order`) and
uses a same-bakery/same-flow foreign-key relationship for dependency targets.

Alternative considered: storing the entire flow as JSONB. That would make
atomic replacement easy but would weaken relational constraints, indexing, and
future task/recipe joins. Normalized tables match the product's planned
`production_flows`/`flow_steps` model and current database conventions.

### 2. Use an authenticated PostgreSQL mutation boundary

Save will call a narrowly scoped `save_production_flow` function that validates
bakery membership, upserts the flow row, replaces its steps in one transaction,
and returns the persisted flow shape. Delete will use a corresponding guarded
operation or the equivalent constrained adapter path so step rows cannot be
orphaned. The function will use an explicit `search_path`, grant execution only
to `authenticated`, and keep the existing tenant/RLS checks active.

Alternative considered: separate browser upserts for the flow and steps. That
would expose an intermediate partially saved flow if the second request fails,
which is unacceptable for a scheduling definition.

### 3. Overlay persisted rows on built-in defaults

Hosted snapshot loading will begin with the existing built-in default flows and
overlay bakery rows by flow ID, then add custom rows. This preserves the
required Standard Sourdough and Standard Focaccia templates without a risky
one-time seed migration, while saving an edited default creates the bakery's
durable override. Reset-to-default can remove that override through the normal
save/reset path.

Alternative considered: seed all current bakeries from SQL. That couples the
feature migration to the current tenant population and makes staging repair
more fragile.

### 4. Make the domain snapshot the single UI read model

Expose `saveProductionFlow` and `deleteProductionFlow` on
`BakeryDomainCommands`, apply `changes.flows` in the reducer, and compose the
Supabase flow adapter into the existing hosted adapter in `BakeryWorkspace`.
The Production and Recipe screens will receive flows from the domain snapshot;
the existing local handler remains the local-mode implementation. Save errors
will remain visible to the builder caller and will not optimistically discard a
dirty draft.

Alternative considered: keep a second `useState` list and mirror Supabase after
save. That would allow stale cards and recipe assignments when another domain
consumer refreshes, so it is rejected.

### 5. Keep dependency and assignment compatibility at the adapter boundary

The adapter will map database rows to the existing `ProductionFlow` and
`FlowStep` fields without changing the scheduling engine. Same-flow dependency
references will be protected by database constraints; cycle, disabled-target,
and editor validation remain in the existing domain/editor model. Recipe
assignment remains compatible with the current contract and is not converted
to a new relation in this change.

## Risks / Trade-offs

- [Risk] Existing hosted rows may use an incompatible shape or partially applied
  migrations. → The migration will be additive, fail loudly on incompatible
  objects, and local reset/type generation will be required before rollout.
- [Risk] A persisted edited default can diverge from the built-in template. →
  Overlay by stable ID and keep reset-to-default as an explicit delete/restore
  path; do not mutate historical generated tasks.
- [Risk] RPC responses can drift from the TypeScript domain shape. → Add focused
  adapter mapping tests and a database verification query that round-trips a
  flow with multiple steps and dependencies.
- [Risk] Tenant filters in the browser could be accidentally trusted as
  authorization. → Require RLS policies using `private.is_bakery_member`, test
  anonymous and cross-bakery reads/writes, and never use user metadata as the
  authorization source.
- [Risk] A flow save may race with a workspace switch. → Scope every command by
  the active bakery and ignore stale mutation results when the domain controller
  is no longer on that bakery.

## Migration Plan

1. Add the migration for tables, constraints, indexes, RLS, grants, and guarded
   mutation functions.
2. Generate and check Supabase TypeScript types; implement the adapter/domain
   wiring against the generated names.
3. Verify local reset, migration history, RLS isolation, atomic replacement,
   and round-trip mapping before hosted rollout.
4. Deploy through the existing staging migration workflow, run authenticated
   flow-builder acceptance, then promote with the normal production backup and
   migration gate.

Rollback is forward-only: if the application path must be disabled, stop using
the hosted flow adapter and keep the additive tables/functions in place until a
separate corrective migration is approved. Do not drop flow tables or rewrite
task references as part of rollback.

## Open Questions

- Confirm during implementation whether the existing recipe foreign key should
  eventually replace the current `ProductionFlow.recipe` display string; this
  change intentionally preserves the current contract.
- Confirm whether delete/reset should be exposed for built-in default IDs as a
  protected reset operation rather than a hard delete; the implementation must
  not remove a default needed by the builder.
- Confirm the exact hosted adapter activation signal and whether an authenticated
  workspace can run with a temporary offline/local fallback, without allowing
  that fallback to masquerade as persisted success.
