# Tasks: Repair Online-Order Task Contract and Recipes RLS

- [x] 1.1 Create a new Supabase migration through the repository-pinned CLI.
  Replace `private.create_online_order` against the final
  `production_tasks` schema, preserving its signature, return contract,
  security-definer/search-path posture, grants, and idempotency behavior.
  Do not edit historical migrations.
- [x] 1.2 Add a pgTAP test covering a synthetic online checkout, its generated
  production task fields, and a repeated idempotency-key submission with no
  duplicate order or task.
- [x] 2.1 In the same new migration, add membership-scoped RLS for
  `public.recipes`: install the policy using the existing helper, enable RLS,
  and preserve the public storefront boundary without exposing recipes to
  anonymous callers.
- [x] 2.2 Extend the database tests with positive same-bakery recipe access,
  cross-bakery read denial, cross-bakery mutation denial, anonymous denial,
  and direct RLS/privilege assertions.
- [x] 3.1 Rebuild the local Supabase database from committed migrations and
  seed data; run the database tests, `supabase db lint --local --fail-on
  error`, relevant security/performance advisors, and generated-type drift
  checks. Do not reset or push a linked project.
- [x] 3.2 Run the focused and full frontend verification baseline, plus the
  affected online-storefront/browser journey if available. Record any
  unrelated blocker with its exact command and output.
- [x] 3.3 After all acceptance criteria pass, update the delta specs, task
  checkboxes, `openspec/PROGRAM_MAP.md`, and archive readiness evidence. Do
  not archive before manual verification is complete.
