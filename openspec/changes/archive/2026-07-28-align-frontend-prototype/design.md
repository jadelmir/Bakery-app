## Context

The current frontend is a Figma-derived React/Vite prototype concentrated in `Front-end/src/app/App.tsx`. It has working local navigation, responsive layouts, and an add-order flow, but its mock data and labels are not yet a reliable representation of the approved MVP. Phase 1 established a reproducible runtime and smoke coverage; see `proposal.md` for the reason this alignment work precedes restructuring.

## Goals / Non-Goals

**Goals:**

- Produce a durable, readable requirements audit that can guide Phase 3 restructuring and later backend phases.
- Make visible prototype data and terminology consistent with the canonical product, technical, and UI/UX requirements.
- Retain the current Figma visual direction and tested interaction paths while avoiding claims that static mock behavior is live product functionality.

**Non-Goals:**

- Splitting `App.tsx`, introducing routes, state architecture, or a component system.
- Creating a database, API, authentication, persistence, scheduling engine, inventory ledger, reports, exports, or notifications.
- Implementing every requirement identified as partial or not implemented in the audit.

## Decisions

### Treat canonical requirements as the content source of truth

The PRD and technical requirements define product scope and lifecycle terms; the UI/UX brief guides the visual presentation. The Figma-generated prototype is not a competing source of truth. This avoids preserving mock content merely because it already exists. An alternative was to document current behavior without changing it, but that would leave the clickable reference misleading for future phases.

### Keep the audit in a frontend guideline document

Create `Front-end/guidelines/REQUIREMENTS_AUDIT.md` with requirement source, UI area or workflow, status, evidence, gap, and planned phase. It is intentionally near the implementation and separate from the OpenSpec delta, which remains the behavioral contract. An inline code comment or a task-only checklist would be harder to maintain and would not give the next phase a complete coverage view.

### Align mock content in place before restructuring

Update existing static data, copy, and display mappings in the current prototype rather than moving it into new modules. This contains Phase 2 to product alignment and prevents an audit from being obscured by a simultaneous structural rewrite. The alternative—performing the refactor first—would mix two kinds of change and make visual regression checks less focused.

### Separate lifecycle state from scheduling urgency

Order and payment labels will use the canonical lifecycle vocabulary. Production tasks will expose a canonical lifecycle state and use urgency only as supplementary timing information where the screen needs it. This prevents labels such as “Due Now” from being mistaken for a task lifecycle value. Replacing all urgency cues entirely was rejected because the production board needs time awareness even in a static prototype.

### Make local prototype outcomes explicit

The add-order confirmation will be described as a local preview or demo outcome. No wording will claim that a real order was persisted or that a production plan was generated. Disabling the flow altogether was rejected because retaining a working representative journey is valuable for visual review.

## Risks / Trade-offs

- [Requirement interpretation exposes gaps in the Figma prototype] → Record the gap and planned phase rather than quietly expanding Phase 2.
- [Updating mock examples can break visual assumptions or tests] → Re-run the Phase 1 quality gate and desktop/mobile smoke path after each alignment group.
- [Static prototype language may still be mistaken for live behavior] → Use concise, visible preview wording at confirmation points and document the limitation in the audit.
- [Terminology can become overly technical in a customer-facing UI] → Preserve user-friendly presentation while keeping the underlying lifecycle labels canonical and distinct from urgency.

## Migration Plan

1. Build the audit from the three canonical requirement documents and the current frontend behavior.
2. Record the deliberately deferred gaps before changing the prototype.
3. Align product examples, lifecycle labels, and prototype-only copy in the existing UI.
4. Update focused tests and run the established quality gate.
5. Perform desktop and mobile smoke checks, including the full add-order journey.

Rollback is a normal source revert of the Phase 2 frontend and documentation edits; no data migration or external deployment is involved.
