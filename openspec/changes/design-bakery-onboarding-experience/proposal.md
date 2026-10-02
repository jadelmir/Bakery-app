# Proposal: Design a Calm Bakery Onboarding Experience

## Executive Summary

Replace the current handoff from account creation directly into the bakery
workspace with a focused, dismissible first-run onboarding experience. The
experience should help a new bakery owner reach the product's first meaningful
outcome: create a product, create an order, and understand the resulting Prep
List.

The experience will use a lightweight setup checklist rather than a blocking
multi-page wizard. It should feel warm, polished, and approachable on mobile
and desktop while remaining consistent with the existing bakery visual system.

## Program Traceability

- Roadmap phase: Frontend Phase 2 — Authentication and Account Experience.
- Related capability: B2 Authentication and Bakery Workspaces.
- Upstream dependencies: authenticated session restoration, bakery membership
  creation and selection, recipe management, order creation, and Prep List.
- Owning change: `design-bakery-onboarding-experience`.

## Scope

- Add a first-run welcome/setup surface after an owner creates or enters a
  bakery that has not completed onboarding.
- Guide the owner through three small, actionable setup steps:
  1. add the first product;
  2. add ingredients and packaging;
  3. create the first order.
- Derive step completion from existing bakery-scoped records wherever possible
  instead of creating duplicate onboarding data.
- Allow the owner to skip onboarding and return to it from Home through a
  compact “Continue setup” entry point.
- Treat the final visual experience as a first-class acceptance concern:
  responsive composition, generous spacing, clear hierarchy, strong focus
  states, and restrained use of color.
- Preserve the existing auth, membership, tenant-isolation, and workspace
  selection boundaries.

## Non-Goals

- Do not redesign login, signup, password recovery, or invitation acceptance.
- Do not block access to the normal workspace after the owner chooses “Skip for
  now”.
- Do not add a sample-data import path to production bakeries in this change.
- Do not require full inventory counts, team invitations, financial settings,
  production-flow customization, or storefront setup before activation.
- Do not create a second recipe, order, inventory, or Prep List data model.

## Acceptance Evidence

- A first-time owner can reach a useful bakery workspace without completing a
  long form.
- The owner can complete the core path from bakery creation to a visible Prep
  List without guessing which feature to open next.
- Returning owners are not repeatedly interrupted after onboarding is complete
  or explicitly dismissed.
- The onboarding surface is usable on the current responsive breakpoints,
  keyboard accessible, and visually consistent with the existing bakery UI.
- Focused component, application-shell, and browser journey tests cover new,
  skipped, resumed, completed, invited-member, and multi-bakery states.

## Documentation Impact

- Update `openspec/PROGRAM_MAP.md` when implementation is approved and the
  capability state changes.
- Update the current authentication/workspace architecture reference only if
  the final design introduces a new persisted onboarding boundary.
- No product-reference document needs editing during planning.
