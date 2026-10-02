# ingredients-and-stock-entry Specification Delta

## ADDED Requirements

### Requirement: Inventory items support ingredients and retail supplies

The system SHALL support user-created inventory items categorized as
`ingredient` or `packaging`, with `packaging` presented as “Retail supplies” in
the user interface. Every item SHALL define one canonical base unit from the
 supported quantity families, a typical package quantity, and a typical package
 price from which a default base-unit cost can be calculated, and SHALL be
 scoped to one bakery. Finished goods
MAY exist as production-created output, but SHALL NOT be required as a manual
add-item category.

#### Scenario: Creating an ingredient

- **WHEN** a bakery member creates an ingredient named “Bread flour” with base
  unit `g`
- **THEN** the item appears in the Ingredients section with zero on-hand stock

#### Scenario: Creating a retail supply

- **WHEN** a bakery member creates a retail supply named “Bread bag” with base
  unit `unit`
- **THEN** the item appears in the Retail supplies section with zero on-hand
  stock

### Scenario: Adding a priced package definition

- **WHEN** a bakery member creates flour with base unit `g`, package quantity
  `10000`, and package price `$17`
- **THEN** the item stores a default unit cost of `$0.0017` per gram while
  on-hand stock remains zero

### Requirement: New items support an opening on-hand balance

The system SHALL allow a bakery member to provide an optional non-negative
initial on-hand quantity in the item's canonical base unit while creating an
ingredient or retail supply. The default SHALL be zero. A positive value SHALL
create exactly one idempotent `opening_balance` ledger event, SHALL update the
item's cached on-hand balance atomically, and SHALL NOT count as purchase spend
or consumed product cost.

#### Scenario: Creating an item with opening stock

- **WHEN** a member creates flour with base unit `g` and initial quantity
  `5000`
- **THEN** the item appears with `5000 g` on hand and one opening-balance event
  in its inventory history
- **AND** Finance does not include the opening balance as a purchase

#### Scenario: Creating an item with the default opening stock

- **WHEN** a member creates a retail supply without entering an initial
  quantity
- **THEN** the item appears with zero on hand and no opening-balance event is
  required

### Requirement: Inventory item creation is progressive and responsive

The system SHALL present item creation as two clearly labeled steps: item
identity and stock/pricing. The member SHALL be able to move back without
losing entered values, and the primary action SHALL remain usable on narrow
screens.

#### Scenario: Moving back during item creation

- **WHEN** a member advances to stock/pricing and returns to item identity
- **THEN** previously entered values remain available for editing

### Requirement: Existing inventory items are editable from their item view

The system SHALL allow a bakery member to open an existing ingredient or
retail supply from its inventory card, edit its name, category, base unit,
package quantity, package price, and minimum level, and record stock actions
for that same selected item without a second item search.

#### Scenario: Editing an existing ingredient

- **GIVEN** the bakery has a flour inventory item
- **WHEN** a member opens the flour item and saves a new package price
- **THEN** the item details are updated in the active bakery and the modal
  remains scoped to that item

#### Scenario: Receiving stock from an item view

- **GIVEN** the bakery has a flour inventory item with a saved package
  definition
- **WHEN** a member opens the flour item and records one purchase package
- **THEN** the purchase is recorded for flour and the flour on-hand quantity
  increases without searching for flour again

### Requirement: Active inventory items can be removed without deleting history

The system SHALL allow a bakery member to remove an ingredient or retail
supply from active inventory from its item view after explicit confirmation.
Removal SHALL archive the item from active lists and pickers without deleting
its stock, purchase, or ledger history.

#### Scenario: Removing an active inventory item

- **GIVEN** the bakery has an inventory item with recorded stock history
- **WHEN** a member opens the item, confirms Delete item, and completes the
  action
- **THEN** the item no longer appears in active inventory or new-item pickers
  and its historical records remain preserved

### Requirement: Recipe ingredients reference active inventory items

The system SHALL initialize a new recipe with no ingredient rows selected. Each
recipe ingredient row SHALL reference an item from the active bakery inventory;
the recipe editor SHALL NOT insert hardcoded sample items when inventory is
empty or unavailable.

#### Scenario: Selecting an existing inventory item

- **GIVEN** the active bakery has “Bread flour” and “Bread bag” inventory items
- **WHEN** a member adds a recipe ingredient row
- **THEN** the item picker offers those records grouped as Ingredients and
  Retail supplies, and the saved row stores the selected inventory item id

#### Scenario: Creating a missing recipe item

- **GIVEN** the recipe needs an item that is not in inventory
- **WHEN** the member chooses “Create inventory item” and saves its name,
  category, and base unit
- **THEN** the item is created in the active bakery and selected in the recipe
  ingredient row

### Requirement: Package receiving converts to base units

The system SHALL allow a bakery member to receive stock by package count,
package quantity, base unit, and package price. It SHALL record the converted
base quantity and derive the purchase unit cost.

#### Scenario: Receiving flour by bags

- **WHEN** a member receives three bags of flour at 25 kg per bag
- **THEN** the inventory ledger records a positive 75,000 g purchase quantity
  and the item on-hand balance increases by 75,000 g

### Requirement: Physical counts create adjustment events

The system SHALL support both a direct physical-count target and a relative
quantity adjustment. Neither action SHALL overwrite history; each SHALL append a
manual-adjustment event containing the resulting signed difference.

#### Scenario: Recording a physical count

- **GIVEN** an item has 8,000 g on hand
- **WHEN** a member records a physical count of 7,400 g
- **THEN** the system records a -600 g adjustment and the cached balance becomes
  7,400 g

#### Scenario: Recording a relative adjustment

- **GIVEN** an item has 8,000 g on hand
- **WHEN** a member records an adjustment of +500 g
- **THEN** the system records a +500 g adjustment and the cached balance becomes
  8,500 g

### Requirement: Inventory ledger events are append-only and bakery-scoped

The system SHALL record the actor, event type, source reference, idempotency
key, signed base quantity, and timestamp for each inventory event. Active
members may record events, but application flows SHALL not delete ledger rows.

#### Scenario: Member records an inventory event

- **WHEN** an active member records a purchase or adjustment
- **THEN** the event is visible only within the active bakery and includes the
  member identity and reason
