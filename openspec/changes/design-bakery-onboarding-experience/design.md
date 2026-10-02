# Design: Calm First-Run Bakery Onboarding

## Current Evidence

- `App.tsx` restores authentication, loads bakery memberships, and renders
  `WorkspaceSelector` when there is no active bakery.
- `WorkspaceSelector` currently collects only a bakery name for a new owner and
  enters the workspace immediately after creation.
- `LoginScreen` already provides a clear account entry point, so onboarding
  should begin after bakery creation rather than adding more steps to signup.
- The workspace already contains recipe management, order creation, and the
  Prep List. These are the shortest path to demonstrating product value.
- Home has recently been simplified by removing daily task and production
  progress content. Onboarding must respect that direction and avoid bringing a
  dense operational dashboard back into the first-run experience.

## Product Direction

Use a soft, skippable checklist with one clear action at a time:

```text
Create account
     ↓
Create bakery
     ↓
Welcome to [Bakery]
     ↓
Add product → Add materials → Create order
     ↓
You're ready to bake
```

The first-run surface is a guided starting point, not a gate. A user may leave
at any point and continue working in the normal workspace.

## Visual Direction

The onboarding screen should feel like a calm studio setup, not an enterprise
configuration wizard.

- Canvas: warm cream background consistent with `#FBF8F3`.
- Primary action: bakery brown `#7A3E24`; use the existing orange accent only
  for supporting emphasis.
- Success state: the existing muted green treatment, never a loud celebration.
- Layout: a spacious centered content column on mobile; a balanced two-panel
  composition on wide screens with the checklist on one side and a quiet bakery
  illustration/statement panel on the other.
- Typography: one strong heading, one short explanation, and plain-language
  action labels. Avoid production jargon such as “flow”, “dependency”, or
  “requirement” during onboarding.
- Progress: show `Step 1 of 3` and a small segmented progress indicator. Do not
  use a percentage, dashboard metrics, or a dense progress bar.
- Controls: one dominant CTA per step, one low-emphasis “Skip for now” action,
  and a clear back action where navigation is reversible.
- Cards: use the existing rounded corners and soft borders, but keep the number
  of cards low. The page should have visual breathing room at laptop and
  mobile widths.

## Proposed Screens

### 1. Welcome

Heading: “Let’s get your bakery ready.”

Supporting copy explains that setup takes a few minutes and can be resumed
later. Show three short checklist rows with the first available action
highlighted. Primary CTA: “Add your first product”. Secondary action: “Skip for
now”.

### 2. Product setup handoff

The onboarding step should open the existing recipe/product workflow, with a
clear return path such as “Back to setup”. If the product workflow supports a
safe starter template, offer it as the fastest route; do not fabricate a
production recipe or inventory quantity behind the user's back.

### 3. Materials setup handoff

After a product exists, explain that ingredients and packaging power the Prep
List. Open the existing recipe/material workflow. Inventory counts remain
optional; a material can show zero available without preventing onboarding.

### 4. First order handoff

Open the normal order creation flow with the product available. Preserve the
existing order defaults and validation. The onboarding copy should explain the
outcome: “Once you add an order, we’ll calculate what needs to be prepared.”

## Returning and Exceptional States

- **Skipped setup:** Home shows a small, non-intrusive “Continue setup” card or
  action. It must not compete with orders or the Today’s Prep List button.
- **Completed setup:** Do not show onboarding automatically. The owner can
  still access normal recipes, orders, and Prep List navigation.
- **Invited member:** Do not run owner setup. Show the existing bakery workspace
  with normal permissions.
- **Multiple bakeries:** Track setup independently for each bakery; switching
  bakeries must never leak completion state between tenants.
- **No eligible order yet:** Keep the user on the setup checklist and explain
  the missing next step rather than presenting an empty Prep List as a failure.
- **Failed save:** Keep the step visible, preserve recoverable form input where
  existing workflows support it, and show an inline error tied to the action.

## State and Persistence Decision

Derive checklist progress from existing bakery-scoped records:

- product step: at least one active recipe/product exists;
- materials step: at least one usable ingredient or packaging line is attached;
- order step: at least one eligible order exists.

Because “Skip for now” and completion need to survive refresh and work per
bakery, add a small owner-scoped onboarding state boundary rather than relying
only on browser storage. The boundary should store dismissal/completion markers
for the user and bakery; derived steps remain based on existing domain data.
The exact table or column shape must follow the existing Supabase migration and
RLS conventions during implementation.

## Navigation and Ownership

- The application shell owns whether onboarding should appear.
- The onboarding screen owns presentation and the current step.
- Existing recipe, order, and Prep List screens remain the owners of their
  domain mutations.
- Each handoff must use existing guarded navigation and preserve the active
  bakery scope.
- No onboarding code may query or expose records outside the active bakery
  membership.

## Risks and Return Paths

- **Onboarding becomes another dashboard:** keep the surface limited to one
  goal, three steps, and one primary action. Return to the design if more setup
  fields are added.
- **Empty or incomplete products block progress:** allow inventory quantities to
  remain zero and surface the next actionable missing relationship.
- **Persisted state becomes a second source of truth:** persist only dismissal
  and completion markers; derive business readiness from existing records.
- **Users lose their place after a handoff:** add explicit return routes and
  browser coverage for each transition.
- **Visual quality regresses on mobile:** verify at the existing mobile and
  desktop breakpoints, with keyboard focus and long bakery names included.

## Verification Strategy

1. Add unit tests for derived step completion and per-bakery state isolation.
2. Add component tests for welcome, active step, skip, resume, error, and
   completed states.
3. Add Playwright journeys for first-time owner setup, skip/resume, invited
   member entry, and switching between two bakeries.
4. Run the frontend baseline: typecheck, lint, test, and build.
5. If a new Supabase boundary is introduced, verify migration application and
   RLS locally before hosted rollout.
