# ingredients-and-stock-entry Specification Delta

## ADDED Requirements

### Requirement: Inventory items support ingredients, retail supplies, and finished goods

The system SHALL support inventory items categorized as `ingredient`,
`packaging`, or `finished_good`. Every item SHALL define one canonical base
unit from the supported quantity families and SHALL be scoped to one bakery.

#### Scenario: Creating a finished-good inventory item

- **WHEN** a bakery member creates a finished-good item associated with a
  recipe
- **THEN** the item is available for stock output and allocation tracking

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
