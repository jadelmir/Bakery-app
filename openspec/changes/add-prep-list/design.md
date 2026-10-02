## Context

The bakery already persists recipes in `recipes`, recipe material lines in
`recipe_ingredients`, and inventory items in `ingredients`. Inventory items
have a `kind` of `ingredient` or `packaging`, plus an `archived` flag. The
recipe editor already allows both kinds to be attached to a recipe, although
the current UI calls the whole collection "ingredients".

Orders and order items retain fulfillment dates, recipe identifiers, and
ordered quantities. Production flows already schedule executable tasks using
day offsets, but a Prep List is a planning/materials view and must not create
duplicate production tasks. The existing `inventory_requirements` model and
reservation RPC can change reserved stock; they therefore must not be used
merely to render a Prep List.

This change belongs to the F9 Inventory and Requirements Planning capability
and the B10 Inventory Requirements capability, upstream of the existing
recipe, order, production-flow, and inventory contracts. The current
`calculateRequirements` helper is not sufficient as the Prep List source: it
only considers mix tasks and contains product-name-specific input mappings.

## Goals / Non-Goals

**Goals:**

- Add a bakery-scoped Prep List view grouped by a selected local prep date.
- Add a recipe-level preparation lead-time setting with a default of one
  calendar day before fulfillment. Support same-day, one-day, two-day, and
  arbitrary non-negative day offsets.
- Derive each eligible order item's prep date from its recipe setting and
  fulfillment date. The setting applies to upcoming eligible orders without
  storing a redundant per-order date in the MVP.
- Calculate product quantities and material quantities from persisted recipe
  lines, scaling by the current order-item quantity under the existing
  one-to-one recipe quantity convention.
- Include active ingredient and packaging inventory items, grouped into
  separate material sections, with required, available, and shortage values.
- Preserve order-item and recipe traceability for aggregated material totals.
- Surface missing, archived, or unsupported material references as actionable
  warnings instead of silently dropping them.
- Keep local/mock behavior, tenant isolation, and the existing production-task
  boundary intact.

**Non-Goals:**

- Per-order or per-order-item prep-date exceptions in this MVP. A future
  change may add an explicit exception and reset-to-recipe-default workflow.
- Parsing the existing free-text recipe yield. Numeric batch-yield modeling is
  a separate change; this change treats persisted recipe quantities as the
  quantities for one ordered product.
- Reserving or deducting inventory when the Prep List is viewed or checked
  off. Existing reservation and deduction flows remain separate actions.
- Replacing production-flow scheduling, changing order/payment status, or
  creating a second recipe/material-definition system.

## Decisions

### 1. Store the default timing on recipes

Add a non-negative integer `prep_lead_days` to `recipes`, defaulting to `1`
and protected by a database check constraint. Extend the domain recipe type,
recipe adapter, save RPC, generated Supabase types, local adapter, and recipe
editor so the value is persisted with the recipe.

The derived rule is:

```text
prep_date = fulfillment_date - recipe.prep_lead_days calendar days
```

Date arithmetic uses the bakery's existing local-date conventions rather than
UTC timestamp subtraction. Changing a recipe setting affects future eligible
orders that have not been cancelled or completed; no historical task dates or
completed work are rewritten.

Alternative considered: persist a prep date on every order item. That would
support one-off exceptions but duplicates a value that is normally derived,
requires reset/override state, and was not requested for the first version.

### 2. Derive materials from recipe lines, including packaging

Use `recipe_ingredients` joined to `ingredients` as the authoritative source.
Include only inventory kinds `ingredient` and `packaging`; exclude finished
goods. Active inventory lines appear in the main list. A missing or archived
referenced item remains represented by a warning tied to its recipe and order
item so the requirement is never silently lost.

Alternative considered: extend the existing hardcoded `recipeInputs` map in
`planning.ts`. That would continue to drift from persisted recipes and cannot
support user-created products or packaging reliably.

### 3. Use a derived read model, not a new persisted Prep List table

Create a pure calculation/read-model boundary containing:

- selected prep date;
- product rows with recipe, order item, quantity, fulfillment date, and order
  reference;
- aggregated material rows keyed by stable inventory-item ID and unit;
- contributing order-item rows for drill-down;
- required, available, shortage, material kind, and source metadata; and
- calculation warnings.

The Prep List screen reads the existing domain snapshot and recomputes this
model. The only new persisted value is the recipe lead-time setting. This
avoids duplicating `inventory_requirements` and prevents a read-only planning
view from changing reservations.

### 4. Keep the first scaling rule explicit

For this change, each `recipe_ingredients.quantity` is interpreted as the
quantity needed for one ordered product, matching the existing requirement
calculator and current tests. Required quantity is therefore:

```text
recipe-line quantity × order-item quantity
```

The existing text `recipes.yield` remains display metadata. Numeric batch yield
and unit-aware batch conversion should be proposed separately before changing
this rule.

### 5. Add the Prep List as a production-adjacent workspace view

Expose Prep List from the Production workspace or its adjacent workspace
navigation, using the existing responsive screen patterns. The view includes
a local-date selector with previous/next navigation, a product workload
section, ingredient and packaging sections, shortage indicators, and
expandable source-order details. It does not add a new bottom-navigation slot
in the MVP.

### 6. Preserve tenant and lifecycle boundaries

All persisted recipe timing reads/writes use the active bakery scope and the
existing membership/RLS boundary. Eligible orders follow the established
order rules and exclude cancelled orders. The calculation must not mutate
orders, production tasks, inventory quantities, reservations, or transaction
history.

## Risks / Trade-offs

- **[Text yield cannot represent arbitrary batches]** → Keep the current
  one-product scaling rule explicit and warn/document that numeric batch yield
  is not part of this change.
- **[Archived material is required by an upcoming order]** → Show the product
  row and a material warning with the archived item name; never silently omit
  the line.
- **[Recipe timing changes move many upcoming rows]** → Show the effective
  prep rule in the recipe editor and the derived/default indicator in the
  Prep List. Defer per-order exceptions to a separate change.
- **[UTC/local date drift around midnight or daylight-saving transitions]** →
  perform date-only arithmetic in the bakery timezone and add boundary tests.
- **[Aggregated totals hide operational sources]** → retain stable order-item
  contributors and make the material row expandable.
- **[Existing reservation functions are mistaken for read-only planning]** →
  keep reservation RPCs out of the Prep List read path and test that rendering
  does not change reserved quantities.

## Migration Plan

1. Add a forward-only migration for `recipes.prep_lead_days` with default `1`,
   non-negative validation, and the necessary authenticated grants.
2. Update the recipe save boundary and typed/domain projections so existing
   recipes hydrate as one day before fulfillment.
3. Add the pure Prep List calculation model and unit tests before wiring the
   screen.
4. Add the responsive workspace view, recipe-editor control, date navigation,
   warnings, and traceability UI, retaining local/mock adapter support.
5. Verify focused migration/RLS checks, unit/component tests, typecheck, lint,
   build, and relevant browser journeys. Record unrelated baseline failures
   separately.

Rollback is a code rollback plus leaving the additive `prep_lead_days` column
unused; no destructive migration or data rewrite is required. If the column
must be removed later, that requires a separately approved migration after
all clients no longer reference it.

## Open Questions

- Should a future version allow a one-off order-item override in addition to
  the recipe default? It is intentionally out of scope for this MVP.
- When numeric recipe batch yields are introduced, should the Prep List scale
  by product units, batches, or a selectable yield unit?
- Should users be able to mark Prep List material rows complete in a future
  version, and if so should that be a non-inventory checklist or an explicit
  reservation action?
