# Proposal: Refactor App.tsx into a Thin Shell (Phase F12 / Quality Polish)

## Why

`Front-end/src/app/App.tsx` has grown to 2,272 lines and contains every screen, shared component, type, mock constant, and navigation element in the application. This monolith creates merge-conflict risk for concurrent feature work, long compile times for TypeScript language server, and high cognitive overhead when locating or reasoning about any single feature. The shared-application-foundation spec requires a clean, maintainable codebase as a quality gate; this change closes that gap.

## What Changes

The refactor is purely mechanical — no logic changes, no new features, no API modifications. `App.tsx` becomes a thin orchestration shell (~100-150 lines) that:
1. Runs the auth/session bootstrap.
2. Renders public routes (`/invoice/:token`, `/store/:slug`, `/auth/reset-password`).
3. Mounts `WorkspaceSelector` for unauthenticated users.
4. Mounts `BakeryWorkspace` for authenticated users with an active membership.

All screen and component code moves into dedicated files under `src/app/`.

## Scope

### Shared types and constants → `src/app/types.ts` + `src/app/constants.ts`
- `Screen`, `TaskStatus`, `TaskUrgency`, `OrderStatus`, `PaymentStatus`, `InventoryStatus` types.
- `Task`, `Order`, `Recipe`, `InventoryItem`, `Customer` interfaces.
- `TASKS`, `ORDERS`, `RECIPES`, `INVENTORY`, `CUSTOMERS` mock arrays.
- `TASK_STATUS`, `TASK_URGENCY`, `ORDER_STATUS`, `PAYMENT_STATUS`, `INV_STATUS`, `CAT_COLORS` style maps.
- Date/time helpers: `BAKERY_TIME_ZONE`, `dateKey`, `displayTime`, `displayDate`, `addDays`, `pickupDateKey`, `toTask`, `planTasks`.

### Shared UI atoms → `src/app/components/shared/`
- `Chip` → `Chip.tsx`
- `SectionHeader` → `SectionHeader.tsx`

### Screen components → `src/app/screens/`
| File | Extracts |
|---|---|
| `HomeScreen.tsx` | `HomeScreen`, `TaskCard`, `OrderCard` |
| `OrdersScreen.tsx` | `OrdersScreen` |
| `ProductionScreen.tsx` | `ProductionScreen`, `ScheduleTaskCard`, `FlowBuilder` |
| `RecipesScreen.tsx` | `RecipesScreen` |
| `InventoryScreen.tsx` | `InventoryScreen`, `StarterScreen` |
| `CustomersScreen.tsx` | `CustomersScreen` |
| `FinancesScreen.tsx` | `FinancesScreen` |
| `MoreScreen.tsx` | `MoreScreen` |
| `SettingsScreen.tsx` | `SettingsScreen` |

### Navigation components → `src/app/navigation/`
- `Sidebar.tsx` — `Sidebar`, `SIDEBAR_NAV`
- `BottomNav.tsx` — `BottomNav`, `BOTTOM_NAV`, `FAB`

### Workspace shell → `src/app/BakeryWorkspace.tsx`
- `BakeryWorkspaceInner` + `BakeryWorkspace` exported components.
- Owns workspace-level state: `screen`, `orders`, `productionTasks`, `starterProfile`, `starterOverrides`, `deductionTrigger`, `inventoryTransactions`.

### `App.tsx` after refactor — essentials only
- Public route branching (invoice, store, password reset).
- Auth state bootstrap (`useEffect`, `getSession`, `onAuthStateChange`).
- Membership loading (`loadMemberships`).
- Conditional renders: loading spinner, `ProtectedRoute`, `InvitationLanding`, `WorkspaceSelector`, `BakeryWorkspace`.
- Target: ≤150 lines.

## Capabilities

- `frontend-quality-polish`: Codebase maintainability and module separation (F12 quality gate).
- `shared-application-foundation`: Clean module boundaries as baseline for future agents.

## Non-Goals
- No logic changes to any screen or component.
- No changes to mock data content or business rules.
- No new features, routes, or UI changes.
- No test file rewrites beyond updating import paths.

## Impact
- `Front-end/src/app/App.tsx` — dramatically reduced.
- `Front-end/src/app/App.test.tsx` — import paths updated only.
- New files created under `src/app/screens/`, `src/app/navigation/`, `src/app/components/shared/`, and `src/app/types.ts`, `src/app/constants.ts`.
- No Supabase schema changes. No domain adapter changes.

## Verification
- `pnpm run typecheck` passes cleanly.
- `pnpm run lint` passes cleanly.
- `pnpm run test` — all existing App.test.tsx assertions pass unchanged.
- `pnpm run build` produces a clean bundle.
