# inventory-requirements-management Specification

## Purpose

Gives bakers a complete, time-bound view of ingredient and packaging demand so shortages can be resolved before scheduled production starts.
## Requirements
### Requirement: Shortages create notifications
The system SHALL create an in-app notification for each current inventory shortage.

#### Scenario: Notifying a baker of a shortage
- **WHEN** a requirement becomes short
- **THEN** the baker can identify the shortage from an in-app notification

### Requirement: Inventory availability is tracked
The system SHALL track an on-hand quantity for each ingredient and packaging item used by supported recipes. It SHALL present each item's available quantity in the Inventory view.

#### Scenario: Viewing on-hand inventory
- **WHEN** a baker opens Inventory
- **THEN** each tracked ingredient and packaging item displays its current available quantity and unit

### Requirement: Requirements include recipe and starter-build inputs
The system SHALL calculate required quantities by selected day and by order from scheduled recipe ingredients, packaging, and the flour and water used by associated starter builds. The system SHALL show Available, Required, and Shortage quantities for each item.

#### Scenario: Viewing a daily requirement
- **WHEN** a baker selects a day containing scheduled sourdough production
- **THEN** the requirement includes dough ingredients and the flour and water required by that day's related starter build

#### Scenario: Inspecting an order requirement
- **WHEN** a baker views inventory requirements for a specific order
- **THEN** the system shows the ingredients and packaging required for that order and its attributable starter-build inputs

### Requirement: Shortages produce a shopping list
The system SHALL identify an item as short when its required quantity exceeds its available quantity and SHALL provide a shopping-list view containing each short item and the quantity needed to cover the shortfall.

#### Scenario: Generating a shopping list
- **WHEN** flour availability is lower than the selected period's calculated flour requirement
- **THEN** the shopping list includes flour and the difference between required and available quantities

#### Scenario: No shortage for sufficient stock
- **WHEN** an item's available quantity meets or exceeds its requirement
- **THEN** the item is not included in the shopping list

### Requirement: Inventory deductions are applied once
The system SHALL use one configured deduction point: either associated production-task completion or order completion. It SHALL record the source of each deduction and SHALL prevent the same order item or production work from reducing inventory more than once.

#### Scenario: Deducting at task completion
- **WHEN** task-completion deduction is configured and a qualifying production task is completed
- **THEN** the associated inventory quantities are reduced once and the deduction is recorded against that task

#### Scenario: Preventing duplicate deduction
- **WHEN** an order already has inventory deducted through the configured deduction point
- **THEN** completing a related event does not deduct its inventory a second time

### Requirement: Automatic Task Completion Inventory Deductions
The application SHALL automatically deduct recipe ingredient quantities from inventory on-hand balances when production tasks are marked as completed.

#### Scenario: Completing a mixing task deducts flour and salt from inventory
- **GIVEN** an active bakery workspace with available flour and salt inventory
- **WHEN** a baker marks a dough mixing task as completed
- **THEN** the application SHALL record negative inventory transactions for the required flour and salt quantities
- **AND** the ingredient on-hand balances SHALL update in real time

#### Scenario: Preventing duplicate task completion deductions
- **GIVEN** a task that has already triggered an inventory deduction transaction
- **WHEN** the task is updated or re-saved as completed
- **THEN** no additional duplicate deduction transaction SHALL be recorded

### Requirement: Manual Inventory Restock and Adjustment
The application SHALL allow users to log manual inventory restocks and adjustments with transaction history.

#### Scenario: User logs an ingredient restock shipment
- **GIVEN** an inventory item with an on-hand balance
- **WHEN** a user opens the Restock modal, enters a positive quantity added, and confirms
- **THEN** the application SHALL record a positive inventory transaction
- **AND** the item's on-hand balance SHALL increase by the added amount

### Requirement: Smart Shopping & Supplies List
The application font-bold SHALL generate an actionable shopping list for ingredients below minimum reorder levels or with upcoming order shortages.

#### Scenario: Viewing and exporting shopping list
- **GIVEN** inventory items where on-hand stock is below minimum reorder levels
- **WHEN** the user opens the Shopping List drawer
- **THEN** all shortage items SHALL be listed with recommended reorder quantities
- **AND** the user SHALL be able to export the list as a CSV document

### Requirement: Database Persistence for Inventory Movements & Deductions
The backend database MUST store all inventory transactions (deductions, restocks, count adjustments) in `inventory_transactions` with RLS policies restricting operations to active bakery members.

#### Scenario: Inserting an inventory transaction in Supabase
- **GIVEN** an authenticated bakery staff member
- **WHEN** an ingredient restock or task deduction transaction is logged
- **THEN** a record is created in `inventory_transactions` with `bakery_id`, `item_id`, `quantity_change`, and `source_key`

### Requirement: Database Persistence for Starter Profiles and Daily Builds
The backend database MUST store starter build profiles and daily build records in `starter_profiles` and `starter_builds` scoped to the active bakery workspace.

#### Scenario: Saving a starter profile and calculating daily build
- **GIVEN** a bakery sourdough starter configuration
- **WHEN** a starter build is computed for an upcoming production day
- **THEN** `starter_builds` stores `seed_amount_g`, `flour_amount_g`, `water_amount_g`, and `usable_amount_g` with RLS protection

