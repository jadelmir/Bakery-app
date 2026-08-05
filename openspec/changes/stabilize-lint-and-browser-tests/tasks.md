# Task Ledger: Stabilize Lint and Browser Verification

## 1. Baseline and Diagnosis

- [x] 1.1 Record the exact lint error inventory and confirm the owned files.
- [x] 1.2 Reproduce the eight browser failures and classify each as calendar/
  fixture drift or an application defect before editing assertions.

## 2. Static Quality Corrections

- [x] 2.1 Replace explicit `any` boundaries in
  `Front-end/src/app/screens/ProductionScreen.tsx` with existing narrow domain
  types and run a focused lint check.
- [x] 2.2 Replace explicit `any` boundaries in
  `Front-end/src/lib/supabase/starterInventoryAdapter.ts` and its tests with
  generated or narrow adapter/test-double types.
- [x] 2.3 Replace explicit `any` boundaries in
  `Front-end/src/lib/supabase/taskRegenerationAdapter.ts` and its tests with
  generated or narrow adapter/test-double types.
- [x] 2.4 Verify the complete lint gate reports zero warnings and errors without
  rule suppression.

## 3. Deterministic Browser Verification

- [x] 3.1 Replace the hard-coded July store-switch assertion with a controlled
  clock or stable dynamic-date expectation that still proves the switched
  bakery view reset.
- [x] 3.2 Ensure the browser fixtures expose a pending actionable production task
  for timer and delay scenarios on the controlled date.
- [x] 3.3 Ensure the browser fixtures expose a downstream task with an incomplete
  prerequisite on the controlled date.
- [x] 3.4 Run the focused store-switch and production-workspace Playwright tests
  on desktop and mobile and confirm all eight previously failing cases pass.

## 4. Integrated Verification and Evidence

- [x] 4.1 Run `pnpm run typecheck`.
- [x] 4.2 Run `pnpm run lint` and record zero warnings/errors.
- [x] 4.3 Run `pnpm run test` and record the complete passing count.
- [x] 4.4 Run `pnpm run build` and record the result.
- [x] 4.5 Run `pnpm run test:e2e` and record 42/42 passing across desktop and
  mobile.
- [x] 4.6 Review the integrated diff for weakened assertions, lint suppression,
  unrelated behavior changes, and ownership violations.
- [x] 4.7 Update `openspec/PROGRAM_MAP.md` with current evidence only after tasks
  4.1-4.6 pass.
