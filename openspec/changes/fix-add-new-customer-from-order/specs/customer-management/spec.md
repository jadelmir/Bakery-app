# Customer Management Delta

## Requirement: Create customer during manual order entry

The manual New Order workflow SHALL allow a bakery member to create a customer without leaving the order wizard by reusing the existing customer-management persistence capability.

### Scenario: Create and select a customer

- **GIVEN** the user is on the Customer step of New Order
- **WHEN** the user chooses Add new customer and successfully saves valid customer data
- **THEN** the application SHALL persist the customer for the active bakery through the existing customer mutation path
- **AND** SHALL select the authoritative returned customer in the order wizard
- **AND** SHALL keep the New Order wizard open so the user can continue.

### Scenario: Customer creation fails

- **GIVEN** the user is creating a customer from New Order
- **WHEN** the customer mutation fails
- **THEN** the application SHALL display the failure in the customer editor
- **AND** SHALL NOT select or manufacture a customer locally
- **AND** SHALL keep the order wizard available for retry or cancel.

### Scenario: Cancel customer creation

- **GIVEN** the customer editor was opened from New Order
- **WHEN** the user cancels the editor
- **THEN** no customer mutation SHALL occur
- **AND** the user SHALL return to the Customer step of the existing New Order wizard.
