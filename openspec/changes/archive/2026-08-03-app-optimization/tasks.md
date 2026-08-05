# Task Ledger: App Optimization

## 1. Performance Baseline and Budget

- [x] 1.1 Record the current Vite entry raw and gzip sizes and identify the
  manifest entry asset.
- [x] 1.2 Add a dependency-free bundle-budget script and package command.
- [x] 1.3 Configure the production build to emit the manifest and verify the
  budget script fails and passes deterministically at controlled thresholds.

## 2. Shell and Screen Code Splitting

- [x] 2.1 Define accessible loading fallbacks for public and authenticated
  asynchronous boundaries.
- [x] 2.2 Lazy-load public invoice and storefront views from `App.tsx` while
  preserving direct URL behavior.
- [x] 2.3 Lazy-load authenticated feature screens/managers from
  `BakeryWorkspace.tsx` while keeping navigation and order creation responsive.
- [x] 2.4 Remove unused compatibility exports that forced the authenticated
  workspace into the entry asset, and verify the manifest proves the intended
  chunk boundaries.
- [x] 2.5 Add focused component/browser coverage for first navigation into lazy
  screens and loading/error behavior.

## 3. Runtime Render Optimization

- [x] 3.1 Add selector subscription/equality behavior without weakening active
  bakery isolation.
- [x] 3.2 Add focused state tests proving unrelated updates do not notify stable
  selected values.
- [x] 3.3 Replace per-card timer intervals with one production-workspace clock.
- [x] 3.4 Verify multiple timers, pause/resume, delay, prerequisite, and
  completion behavior with fake-timer and browser coverage.

## 4. Integration and Evidence

- [x] 4.1 Integrate async screens and optimized selectors in the central app
  shell and review compatibility exports.
- [x] 4.2 Run `pnpm run typecheck`.
- [x] 4.3 Run `pnpm run lint` with zero warnings/errors.
- [x] 4.4 Run `pnpm run test` and record the complete passing count.
- [x] 4.5 Run `pnpm run build` and `pnpm run check:bundle`; record entry raw and
  gzip sizes against the baseline.
- [x] 4.6 Run `pnpm run test:e2e` and confirm the complete 44-test
  desktop/mobile suite passes (the shared-clock regression adds two cases).
- [x] 4.7 Review the diff for weakened tests, loading regressions, timer drift,
  unnecessary manual chunking, and unrelated behavior changes.
- [x] 4.8 Synchronize the verified delta and update `openspec/PROGRAM_MAP.md` only
  after tasks 4.2-4.7 pass.
