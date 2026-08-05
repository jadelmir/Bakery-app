## MODIFIED Requirements

### Requirement: Prototype scope transparency
The frontend prototype SHALL make local-only data and generated production-plan behavior clear and SHALL NOT represent persistence, backend processing, inventory deduction, or automatic schedule optimization as completed functionality.

#### Scenario: Confirming an example order
- **WHEN** a user completes the add-order flow for a supported product
- **THEN** the confirmation language identifies the result as a local prototype preview and accurately states whether a local production plan was generated

