## Why

The redesigned Production Flow Builder currently saves only to the in-memory bakery workspace, so imported or edited flows disappear after a reload and are not available on another signed-in device. The product already treats flows as reusable bakery configuration, but the hosted Supabase schema and adapter do not yet persist the flow and step data.

## What Changes

- Add a bakery-scoped Supabase persistence model for production flows and their ordered steps, with row-level security based on active bakery membership.
- Connect the existing domain production-flow ports and snapshot to hosted load, save, and delete operations while preserving the current flow and step identifiers used by task generation.
- Make the Production Flow Builder and recipe flow entry points use the persisted hosted snapshot after save and reload; keep the local adapter behavior for local/demo mode.
- Persist flows imported from an existing flow or organized JSON as ordinary editable flow records, including their timing, instructions, ordering, and dependency references.
- Keep writes atomic so a flow and its replacement step set cannot be left partially saved.
- Add migration, generated-type, adapter, domain, UI, and persistence-regression verification, including bakery-isolation checks.

### Non-goals

- No additional redesign of the flow-builder UI; that behavior remains owned by `redesign-production-flow-builder`.
- No AI service or server-side JSON organizer; the existing client-side prompt and JSON import remain the input experience.
- No migration of historical generated tasks or change to task-generation semantics.
- No cross-bakery sharing or multi-user collaboration model beyond the existing bakery membership permissions.
- No hosted rollout or production deployment in this change; deployment follows the repository's existing migration/release workflow after verification.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `production-flow-management`: production flows and their ordered steps become bakery-scoped persisted configuration that survives reloads and remains available to authorized bakery members.

## Impact

- Database: new Supabase migration(s), tables, indexes, foreign keys, grants, and RLS policies for flows and flow steps.
- Frontend domain: hosted adapter loading, save/delete commands, snapshot change application, and the `BakeryWorkspace` save path.
- Frontend UI: existing flow-builder save/import behavior must report persistence errors and refresh from the hosted snapshot without changing its redesigned interaction model.
- Verification and documentation: generated Supabase types, focused adapter/domain/UI tests, local migration/RLS checks, `docs/api/api.md` corrections if the verified endpoint contract changes, and `openspec/PROGRAM_MAP.md` traceability.
- Product traceability: F7 Production Flow Builder and B4 Recipes and Production Flows, depending on the shared application foundation and existing bakery tenant isolation. Owning change: `persist-production-flows`. The active UI change `redesign-production-flow-builder` owns interaction design, while `optional-recipe-production-flow` owns nullable recipe assignment.
