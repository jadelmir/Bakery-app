# Tasks - Replace Application Hardcoded Placeholders & Bind Live Database Names (Phase F12 / Quality Polish)

## 1. Domain Selectors & Database Entity Binding

- [x] 1.1 Add dynamic state selectors in `Front-end/src/app/state/selectors.ts` for `selectLowStockCount`, `selectActiveCustomerCount`, `selectUnpaidCustomerSummary`, `selectActiveStarterInfo`, and `selectFormattedCurrentDate`.
- [x] 1.2 Add helper function for dynamic date formatting (`getFormattedTodayDate()`).

## 2. HomeScreen & Navigation Submenu Polish

- [x] 2.1 Update `HomeScreen` in `Front-end/src/app/App.tsx` replacing hardcoded date "July 29", static task metrics, and mock alerts with live database snapshot tasks, orders, customer names, and starter names.
- [x] 2.2 Update `MoreScreen` in `Front-end/src/app/App.tsx` replacing static menu subtitles ("3 items need attention", "4 active customers", "$103 unpaid balance", "Earl · feed by 8 PM") with live database counts and entity names.
- [x] 2.3 Update storefront link banners dynamically using `/store/${storefront?.slug}` from active database storefront snapshot.

## 3. Verification & Quality Gates

- [x] 3.1 Run TypeScript typecheck (`npm run typecheck`) and Vitest test suite (`npm test`).
- [x] 3.2 Verify all UI screens render actual database names and clean dynamic data without broken placeholders.
- [x] 3.3 Update `openspec/PROGRAM_MAP.md` marking quality polish as verified.
