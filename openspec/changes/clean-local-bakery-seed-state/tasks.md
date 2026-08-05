# Tasks: Clean Local Bakery Seed State

- [x] 1.1 Add a focused mock workspace regression assertion in
  `Front-end/src/app/workspace.test.tsx` proving the default fixture contains
  `J'adore Bakery` and no `Runtime Check Bakery` membership.
- [x] 1.2 Add
  `Front-end/scripts/verify-local-bakery-seed.mjs` and a
  `supabase:verify-seed` package script that fail when the local admin has
  anything other than the committed bakery or when a runtime-check bakery row
  exists. Keep the script local-only and read-only.
- [x] 1.2a Align the production-task rows in `Front-end/supabase/seed.sql`
  with the schema created by the committed task-regeneration migration so a
  clean reset can load all seed data. Do not rewrite historical migrations or
  add a data-deletion migration.
- [x] 1.3 Run the local Supabase reset using the repository command after
  approval, then run the new seed verification command and record the exact
  admin membership result. Do not use a linked or production reset.
- [x] 1.4 Manually verify the actual local-backend admin login: the seeded
  bakery is shown before onboarding, no runtime-check bakery appears, and an
  explicitly created bakery appears and becomes active while the seeded bakery
  remains selectable.
- [x] 1.5 Run focused frontend tests, typecheck, lint, the full Vitest suite,
  production build, and the relevant Playwright journey. Record the known
  unrelated database lint findings without changing them.
