# Tasks: Optional Recipe Production Flow Assignment

- [x] 1.1 Update recipe editor and domain contracts so Production Flow remains
  available during create/edit but is optional, defaults to `Assign later`, and
  preserves selected or null assignments.
- [x] 1.2 Update recipe persistence/local mapping and the recipe list so null
  `flow_id` values round-trip without defaulting to a template and display a
  clear unassigned state.
- [x] 1.3 Preserve and verify the existing later-assignment flow-builder path
  for recipes without a flow, including the authoritative/local result.
- [x] 1.4 Add focused component and adapter tests for create-without-flow,
  create-with-flow, edit-without-flow, later assignment, and assigned-flow
  regression behavior.
- [x] 1.5 Run typecheck, lint, focused/full Vitest, production build, and the
  relevant recipe/flow Playwright journey; record any unrelated baseline
  failures without weakening this contract.
  - Evidence: typecheck, lint, focused recipe tests (34/34), and production build pass. Full Vitest is 250/255 with five unrelated existing failures in production controls, OrdersScreen sorting, and App inventory/production expectations. The recipe Playwright journey was attempted against the running local server but its mock-auth precondition was unavailable, so both desktop/mobile variants stopped before reaching recipe management.
- [x] 1.6 Update `openspec/PROGRAM_MAP.md` with this change as the sole active
  owner of the optional recipe-flow assignment delta for F4/F7, without
  altering archived provenance.
