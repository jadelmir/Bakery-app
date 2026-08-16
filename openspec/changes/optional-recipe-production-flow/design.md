## Context

Recipe Management currently exposes a Production Flow selector in
`RecipeEditorDialog`, but the UI and local recipe contracts treat the value as
required and default a new recipe to the first available flow. The persisted
`public.recipes.flow_id` column is already nullable, and `RecipeManager` already
has a flow-builder path that can create or recover a flow for an existing
recipe. The change therefore belongs at the frontend/domain contract boundary;
no database migration or hosted rollout is needed.

## Goals / Non-Goals

**Goals:**

- Let a baker choose a flow during recipe creation when one is ready.
- Let a baker save a recipe with no flow and assign it later.
- Preserve selected flow assignments during edit and keep the existing flow
  builder available for later assignment.
- Keep the unassigned state explicit in the recipe list and accessible to
  assistive technology.
- Preserve bakery-scoped persistence and existing task-generation behavior for
  recipes that have an assigned flow.

**Non-Goals:**

- No schema, migration, RLS, or hosted Supabase changes.
- No redesign of the Production Flow Builder.
- No automatic flow selection or automatic flow generation for a new recipe.
- No change to how already assigned flows generate production tasks.

## Decisions

1. **Represent no assignment as `null` at persistence boundaries.** The
   database already accepts `recipes.flow_id = null`; frontend/domain recipe
   types and recipe editor payloads will use `string | null` instead of
   manufacturing a default flow ID. This preserves the distinction between a
   deliberate assignment and a recipe awaiting setup.

2. **Keep one optional selector in the editor.** The Production Flow control
   remains visible while adding or editing a recipe, loses its required marker,
   and includes an explicit `Assign later` option. New recipes default to that
   option; editing preserves the existing assignment or shows `Assign later`
   when none exists.

3. **Use the existing flow-builder path for later assignment.** An unassigned
   recipe displays `No production flow assigned` and its existing flow action
   opens the builder. Saving the builder creates or assigns the flow through
   the current recipe/flow ownership path rather than adding a second
   assignment mechanism.

4. **Test both persistence states.** Focused component tests will cover create
   with no flow, create with a selected flow, edit with no flow, and the
   unassigned list state. Existing assigned-flow tests remain unchanged.

## Risks / Trade-offs

- [Some code assumes `flowId` is always a string] → Update shared recipe
  contracts and mapping boundaries together, then run typecheck and focused
  recipe/flow tests.
- [Orders or task planning encounter a recipe without a flow] → Preserve the
  current assigned-flow path, make the missing-flow state visible, and add a
  clear later-assignment path rather than silently selecting a template.
- [A later builder assignment is not persisted] → Verify the existing save
  callback and persisted/local adapter result in the focused assignment test.

## Migration Plan

No database migration is required. Deploy the frontend contract and UI change;
existing rows with a flow remain unchanged, while new unassigned rows use the
existing nullable `flow_id` column. Rollback is a frontend revert with no
database rollback step.

## Open Questions

- None for this scope. The existing flow builder is the later-assignment
  surface; a separate standalone assignment screen is not needed.
