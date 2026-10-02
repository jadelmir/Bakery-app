# Task Ledger: Calm First-Run Bakery Onboarding

## 1. Confirm contracts and ownership

- [x] 1.1 Confirm the first-run entry point in `App.tsx`, bakery creation
  success path, active membership state, and guarded navigation behavior.
- [x] 1.2 Define the derived onboarding step model and its empty, partial,
  completed, and failed states without duplicating recipe, order, inventory, or
  Prep List business logic.
- [ ] 1.3 Decide the minimal persisted owner/bakery dismissal and completion
  boundary, including migration and RLS evidence if the existing schema cannot
  represent it safely.

## 2. Build the onboarding presentation

- [x] 2.1 Add the responsive onboarding screen with the warm bakery visual
  language, clear step hierarchy, segmented `Step N of 3` progress, and one
  primary action per state.
- [ ] 2.2 Add the welcome, active-step, skipped, resumed, completed, loading,
  and inline-error states with accessible labels and keyboard focus behavior.
- [x] 2.3 Add a compact Home “Continue setup” entry point that does not compete
  with orders or Today’s Prep List and disappears after completion/dismissal
  rules are satisfied.
- [ ] 2.4 Add explicit return paths for recipe and order handoffs;
  preserve the active bakery and avoid creating duplicate domain forms.

## 3. Wire the state boundary

- [x] 3.1 Connect product/material/order readiness to active bakery-scoped
  records and ensure incomplete relationships explain the next action.
- [ ] 3.2 Persist and restore only the necessary user/bakery dismissal and
  completion markers using the repository's migration and RLS workflow.
- [x] 3.3 Ensure invited non-owner members bypass owner onboarding and that
  multi-bakery switching isolates all onboarding state.

## 4. Verification and visual quality

- [ ] 4.1 Add unit tests for the derived step model and bakery/user isolation.
- [ ] 4.2 Add component tests for welcome, skip/resume, error, completion, and
  accessibility labels.
- [ ] 4.3 Add Playwright journeys for first-time setup, skip/resume, invited
  member entry, and two-bakery switching.
- [ ] 4.4 Verify mobile and desktop screenshots or equivalent browser evidence,
  including long bakery names, keyboard navigation, and narrow widths.
- [ ] 4.5 Run `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and
  `pnpm run build`; record unrelated baseline failures separately.
- [ ] 4.6 Update `openspec/PROGRAM_MAP.md` and current architecture/database
  references only after the implementation and persistence boundary are
  verified.
