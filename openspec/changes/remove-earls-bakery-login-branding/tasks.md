# Task Ledger: Remove Bakery Name from Login Header

## 1. Live Login Header

- [x] 1.1 Remove the `Earl's Bakery` label from the top header in
  `Front-end/src/app/LoginScreen.tsx` while preserving the leaf mark,
  `Production Studio`, and surrounding layout.

## 2. Regression Coverage

- [x] 2.1 Extend the existing authentication-shell test in
  `Front-end/src/app/App.test.tsx` to assert that the top login header omits
  `Earl's Bakery` while retaining the login heading and neutral subtitle.

## 3. Verification

- [x] 3.1 Run the focused authentication-shell test.
- [x] 3.2 Run `pnpm run typecheck`.
- [x] 3.3 Run `pnpm run lint`.
- [x] 3.4 Run `pnpm run test`.
- [x] 3.5 Run `pnpm run build`.
- [x] 3.6 Run the focused authentication Playwright test when the browser
  harness is available and record the result.

## Verification Notes

- Focused `App.test.tsx`: 13/13 passed.
- `pnpm run typecheck`: passed.
- `pnpm run lint`: passed with zero warnings or errors.
- `pnpm run test`: passed with 17 test files and 133 tests passing.
- `pnpm run build`: passed.
- Focused authentication Playwright suite: 4/4 passed across desktop and
  mobile.
- OpenSpec CLI validation was attempted through `pnpm dlx openspec`, but the
  package exposes no executable; the delta and synchronized main specification
  were checked manually.
