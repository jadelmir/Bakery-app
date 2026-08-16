## 1. Database contract and security

- [x] 1.1 Confirm the current bakery, recipe, membership, and task identifier contracts, then review the official Supabase migration/RLS guidance before implementing the hosted flow boundary.
- [x] 1.2 Add a migration for bakery-scoped `production_flows` and `production_flow_steps` using text flow/step IDs, ordered-step constraints, same-flow dependency references, timestamps, and supporting indexes.
- [x] 1.3 Add authenticated grants, membership-based RLS policies, and guarded atomic save/delete database operations; verify anonymous denial and cross-bakery isolation with local database checks.
- [x] 1.4 Generate/check Supabase database types and update the durable database/API references only from the committed migration and verified contract.

## 2. Hosted adapter and domain state

- [x] 2.1 Implement row-to-domain and domain-to-row mapping for every current flow and step field, including dependency IDs, default flags, and readable adapter failures.
- [x] 2.2 Load hosted flows into the bakery snapshot by overlaying persisted bakery rows on the built-in default templates and adding custom flows.
- [x] 2.3 Implement hosted save/delete operations through the atomic database boundary and return the authoritative `production-flow-mutated` changes shape.
- [x] 2.4 Expose production-flow mutations through `BakeryDomainCommands`, apply `changes.flows` in the reducer, and prevent stale results from a previous bakery from updating the active snapshot.
- [x] 2.5 Compose the hosted flow adapter into `BakeryWorkspace` while preserving the existing local adapter behavior for local/demo mode.

## 3. Builder and consumer integration

- [x] 3.1 Route the redesigned Flow Builder save/import path through the active domain command with an operation ID, pending state, and visible persistence failure without discarding the draft.
- [x] 3.2 Ensure Production and Recipe screens read the persisted snapshot after save and reload, including flows created from existing-flow import and organized JSON import.
- [x] 3.3 Verify default-template overlay, reset behavior, recipe assignment, and generated-task behavior remain compatible with existing flow and step IDs.

## 4. Verification evidence

- [x] 4.1 Add adapter and mapping tests covering load, save, replacement steps, delete/reset, malformed database rows, and atomic-operation failures.
- [x] 4.2 Add domain reducer/controller tests covering flow changes, mutation errors, bakery switching, and local/hosted adapter parity.
- [x] 4.3 Add local Supabase tests for schema constraints, RLS isolation, atomic replacement, dependency integrity, and round-trip persistence.
- [x] 4.4 Add focused component/screen tests for save success/error and reload of imported JSON/custom flows; run the affected Playwright journey against the local authenticated workspace where available.
- [x] 4.5 Run the frontend baseline (`pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`) plus migration/type-generation checks, and record any unrelated pre-existing failures separately.

## 5. Traceability and rollout handoff

- [x] 5.1 Update `openspec/PROGRAM_MAP.md` to show `persist-production-flows` as the owning persistence change for the F7/B4 production-flow capability while retaining the UI redesign and optional-assignment ownership boundaries.
- [x] 5.2 Update current API/database documentation only after implementation and verification prove the actual Supabase tables/functions and frontend consumer paths.
- [x] 5.3 Document the staged migration verification and forward-only rollback handoff without claiming hosted rollout until authenticated staging acceptance is complete.

Verification note: the focused persistence/builder/state suite passed (25 tests), and the updated production workspace Playwright journey passed in desktop and mobile projects (4 tests). The full Vitest suite currently reports 10 unrelated failures in the existing production timeline, orders sorting, and app/catalog expectations; these were recorded without changing those areas.
