# Specification: Inventory Requirements Management & Real-Time Deductions

## ADDED Requirements

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
