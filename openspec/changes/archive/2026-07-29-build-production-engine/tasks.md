## 1. Production domain and scheduling foundation

- [x] 1.1 Add typed local models for production flows, ordered flow steps, generated tasks, task notes, scheduling warnings, and recipe-flow assignments.
- [x] 1.2 Seed Standard Sourdough Loaf and Standard Focaccia flows with their required product-specific steps, instructions, timing, and default assignments.
- [x] 1.3 Implement pure scheduling utilities that create stable, traceable task plans from a confirmed order, item quantities, pickup time, and assigned flow.
- [x] 1.4 Implement future-incomplete-task regeneration and preserve completed, skipped, and cancelled task history.
- [x] 1.5 Add unit tests for default-flow differences, timestamp calculation, idempotent regeneration, dependency state, and schedule warnings.

## 2. Flow management

- [x] 2.1 Add shared local state and actions for listing, duplicating, editing, enabling, ordering, and assigning production-flow templates.
- [x] 2.2 Build the responsive Flow Builder screen with template selection, ordered step details, timing controls, duplicate action, and recipe assignment.
- [x] 2.3 Add validation and visible feedback for incomplete flow-step scheduling data while retaining the default templates.

## 3. Order-plan generation and task actions

- [x] 3.1 Generate or regenerate a local production plan when a supported order is confirmed or when its quantity, pickup time, or assigned flow changes.
- [x] 3.2 Add an order production-plan view that shows generated task timing, quantity, instructions, source-flow context, dependency state, and warnings.
- [x] 3.3 Implement shared task actions for completion, note entry, skip-with-reason, and rescheduling, preserving task traceability and terminal task history.
- [x] 3.4 Update confirmation and prototype-scope language to accurately state that a local production plan was generated without claiming persistence or backend processing.

## 4. Production schedule views

- [x] 4.1 Build chronological Today and Tomorrow views for generated tasks and pickup events using the configured bakery timezone.
- [x] 4.2 Build a responsive Calendar view with day selection, scheduled task and pickup indicators, and access to task or order details.
- [x] 4.3 Surface task status, urgency, instructions, unresolved dependencies, and schedule-conflict warnings consistently across schedule views.

## 5. Verification and documentation

- [x] 5.1 Add focused component and journey tests for flow management, confirmed-order plan generation, task actions, and schedule views.
- [x] 5.2 Run frontend typecheck, lint, tests, and production build; address any regressions.
- [x] 5.3 Perform desktop and mobile smoke checks for the flow builder, confirmed-order production plan, Today, Tomorrow, and Calendar journeys.
