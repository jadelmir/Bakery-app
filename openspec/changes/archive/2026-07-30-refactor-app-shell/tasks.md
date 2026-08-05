# Tasks: Refactor App.tsx into a Thin Shell

## 1. Shared Types and Constants Extraction

- [x] 1.1 Create `Front-end/src/app/types.ts` — move `Screen`, `TaskStatus`, `TaskUrgency`, `OrderStatus`, `PaymentStatus`, `InventoryStatus` union types and `Task`, `Order`, `Recipe`, `InventoryItem`, `Customer` interfaces verbatim from `App.tsx` (lines 56–95).
- [x] 1.2 Create `Front-end/src/app/constants.ts` — move `TASKS`, `ORDERS`, `RECIPES`, `INVENTORY`, `CUSTOMERS` mock arrays, all style maps (`TASK_STATUS`, `TASK_URGENCY`, `ORDER_STATUS`, `PAYMENT_STATUS`, `INV_STATUS`, `CAT_COLORS`), `BAKERY_TIME_ZONE`, and date/plan helpers (`dateKey`, `displayTime`, `displayDate`, `addDays`, `pickupDateKey`, `toTask`, `planTasks`) verbatim from `App.tsx` (lines 97–209).

## 2. Shared UI Atoms

- [x] 2.1 Create `Front-end/src/app/components/shared/Chip.tsx` — move `Chip` component verbatim from `App.tsx` (lines 213–219).
- [x] 2.2 Create `Front-end/src/app/components/shared/SectionHeader.tsx` — move `SectionHeader` component verbatim from `App.tsx` (lines 221–230).

## 3. Screen Components

- [x] 3.1 Create `Front-end/src/app/screens/HomeScreen.tsx` — move `HomeScreen`, `TaskCard`, `OrderCard` verbatim (lines 234–618). Updated imports to use `types.ts`, `constants.ts`, `shared/Chip`, `shared/SectionHeader`, and domain/selector imports.
- [x] 3.2 Create `Front-end/src/app/screens/OrdersScreen.tsx` — move `OrdersScreen` verbatim (lines 622–750). Updated imports.
- [x] 3.3 Create `Front-end/src/app/screens/ProductionScreen.tsx` — move `ProductionScreen`, `ScheduleTaskCard`, `FlowBuilder` verbatim (lines 751–995). Updated imports including `ProductionFlowBuilder` modal integration.
- [x] 3.4 Create `Front-end/src/app/screens/RecipesScreen.tsx` — move `RecipesScreen` verbatim (lines 997–1106). Updated imports.
- [x] 3.5 Create `Front-end/src/app/screens/InventoryScreen.tsx` — move `InventoryScreen`, `StarterScreen` verbatim (lines 1108–1280). Updated imports.
- [x] 3.6 Create `Front-end/src/app/screens/CustomersScreen.tsx` — move `CustomersScreen` verbatim (lines 1184–1280). Updated imports.
- [x] 3.7 Create `Front-end/src/app/screens/FinancesScreen.tsx` — move `FinancesScreen` verbatim (lines 1281–1355). Updated imports.
- [x] 3.8 Create `Front-end/src/app/screens/MoreScreen.tsx` — move `MoreScreen` verbatim (lines 1357–1436). Updated imports.
- [x] 3.9 Create `Front-end/src/app/screens/SettingsScreen.tsx` — move `SettingsScreen` verbatim (lines 1438–1443). Updated imports.

## 4. Navigation Components

- [x] 4.1 Create `Front-end/src/app/navigation/Sidebar.tsx` — move `Sidebar`, `SIDEBAR_NAV` verbatim (lines 1674–1800). Updated imports.
- [x] 4.2 Create `Front-end/src/app/navigation/BottomNav.tsx` — move `BottomNav`, `BOTTOM_NAV`, `FAB` verbatim (lines 1800–1842). Updated imports.

## 5. Add Order Modal

- [x] 5.1 Create `Front-end/src/app/components/orders/AddOrderModal.tsx` — move `AddOrderModal` verbatim (lines 1445–1673). Updated imports.

## 6. BakeryWorkspace Shell

- [x] 6.1 Create `Front-end/src/app/BakeryWorkspace.tsx` — move `BakeryWorkspaceInner` and `BakeryWorkspace` verbatim (lines 1844–2182). Updated all imports. `BakeryWorkspace` exported as named export.

## 7. App.tsx Reduction

- [x] 7.1 Rewrote `Front-end/src/app/App.tsx` — now ~175 lines. Contains only: public route branching, auth state bootstrap, membership loading, and conditional renders.
- [x] 7.2 Re-exported `BakeryWorkspace` as a named export from `App.tsx` (backward compatibility with `App.test.tsx` confirmed).

## 8. Verification

- [x] 8.1 `npm run typecheck` — ✅ zero errors.
- [x] 8.2 lint — not configured; typecheck covers type correctness.
- [x] 8.3 `npm test` — ✅ 93/93 tests pass (all 14 test files, including all App.test.tsx tests).
- [x] 8.4 `npm run build` — ✅ clean production bundle (798 kB gzipped 207 kB, no regression).
