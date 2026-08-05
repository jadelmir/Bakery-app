# Tasks: Clarify Orders Workflow UI

- [x] 1.1 Define pure presentation selectors for Current, Completed, stage
  counts, pickup urgency, pickup-date sorting, and draft/cancelled access.
- [x] 1.2 Add focused selector tests covering status membership, overdue-first
  ordering, date/time ties, search, and combined filters.
- [x] 2.1 Create reusable Orders overview components for the Current/Completed
  control, workflow stage summary, filters, and redesigned order card.
- [x] 2.2 Create reusable order-detail components for the lifecycle indicator,
  pickup/payment summaries, production progress, collapsible task history, and
  sticky next-action area.
- [x] 2.3 Verify status and urgency remain understandable without color and all
  controls expose accessible names, selected states, and focus behavior.
- [x] 3.1 Integrate the new overview and detail hierarchy into
  `OrdersScreen.tsx` without changing transition or persistence contracts.
- [x] 3.2 Implement desktop master-detail and mobile focused-detail behavior.
- [x] 3.3 Preserve pending, failure, retry, terminal-state, and authoritative
  transition behavior from `add-manual-order-status-transitions`.
- [x] 4.1 Add component tests for default Current, Completed, stage counts,
  sorting, filters, lifecycle detail, and completion moving between views.
- [x] 4.2 Add desktop/mobile Playwright coverage for queue comprehension,
  detail navigation, responsive action placement, and sequential transitions.
- [x] 4.3 Add relative pickup labels for tomorrow and future calendar days,
  retain the exact pickup datetime, and cover the labels with deterministic
  tests.
- [x] 4.4 Show completed orders as `Fulfilled at <date>` in cards and detail,
  suppress overdue treatment, and cover the behavior in component and browser
  tests.
- [ ] 4.5 Run typecheck, lint, Vitest, build, and affected Playwright suites;
  record manual visual acceptance before synchronization or archive.
