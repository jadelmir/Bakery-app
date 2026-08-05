# customer-management Specification

## Purpose

Provides customer profile directory management, customer categorization (Wholesale vs Retail), contact records, and order history integration for bakery operations.

## ADDED Requirements

### Requirement: Customer directory management and creation
The application SHALL allow users to create, update, and search customer profiles with name, contact information, customer type (Wholesale or Retail), and delivery notes.

#### Scenario: Creating a new customer
- **WHEN** a user fills out customer name, email, phone, type, and address in the customer creation modal
- **THEN** the system saves the new customer profile to the active bakery and displays it in the customer directory

#### Scenario: Editing an existing customer
- **WHEN** a user modifies contact details or notes of an existing customer
- **THEN** the updated details are saved immediately and reflected in the customer directory

### Requirement: Customer categorization and filtering
The application SHALL support filtering customer profiles by customer type (All, Wholesale, Retail) and searching by customer name or email.

#### Scenario: Filtering customers by type
- **WHEN** a user selects the Wholesale or Retail filter tab
- **THEN** the customer directory view displays only customers matching the selected type
