## Why

The Figma-derived frontend is now runnable and covered by a basic quality gate, but it is still a static prototype whose product catalog, lifecycle labels, and implied capabilities drift from the canonical product requirements. Before restructuring the frontend or introducing a backend, the prototype needs a clear requirements audit and a small alignment pass so it can serve as a trustworthy visual reference.

## What Changes

- Create a requirement-traceability audit that maps the MVP requirements and primary workflows to the current frontend as **implemented**, **partial**, or **not implemented**, with the planned follow-up phase recorded for gaps.
- Align the visible mock catalog and order examples to the initial MVP products: sourdough loaf and focaccia.
- Normalize displayed order, task, and payment terminology to the canonical requirement vocabulary while keeping scheduling urgency distinct from lifecycle state.
- Make prototype-only confirmation and data behavior clear so the UI does not imply persistence, automatic production planning, or backend functionality that does not exist.
- Preserve the existing Figma visual direction, responsive navigation, and add-order journey; this change deliberately does not restructure the application or add backend features.

## Capabilities

### New Capabilities

- `frontend-prototype-alignment`: Provides traceability between the frontend prototype and the approved requirements, and defines the MVP catalog, status vocabulary, and prototype-scope behavior used by the frontend.

### Modified Capabilities

- None.

## Impact

- Affected frontend: `Front-end/src/app/App.tsx`, its mock data and user-facing labels, and focused frontend tests.
- Affected documentation: a frontend requirements audit and, where helpful, the frontend run guide.
- No backend, database, authentication, persistence, architectural refactor, or production scheduler is included. Those gaps will remain explicitly tracked for later phases.
