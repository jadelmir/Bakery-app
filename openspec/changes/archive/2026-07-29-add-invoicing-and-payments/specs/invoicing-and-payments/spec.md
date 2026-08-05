# Invoicing and Payments Specification

## Purpose

Provides invoice creation, server-side monetary calculations, payment method configuration (Zelle, PayPal, Cash, Check), partial payment recording, public invoice access via secure token, email delivery, and PDF generation for bakery operations.

## ADDED Requirements

### Requirement: Invoice creation, server-side calculation, and lifecycle management
The application SHALL allow users to create invoices from orders or custom line items, calculate totals server-side in integer cents, store historical customer/bakery snapshots, and track status (Draft, Sent, Viewed, Partially paid, Paid, Overdue, Cancelled).

#### Scenario: Creating a new invoice from an order
Given a bakery manager viewing a confirmed customer order
When they click "Create Invoice"
Then the system generates a unique invoice number for the bakery, populates items and prices in integer cents, creates a public token, and saves the invoice in Draft status.

#### Scenario: Server-side total and balance calculation
Given an invoice with subtotal $100.00 (10000 cents), tax $8.00 (800 cents), and discount $5.00 (500 cents)
When the invoice is saved
Then the server calculates total_cents as 10300 cents ($103.00) and balance_cents as 10300 cents.

### Requirement: Payment methods configuration and payment recording
The application SHALL support configuring bakery payment methods (Zelle, PayPal, Cash, Check, Custom), requiring manual confirmation for Zelle, and recording partial or full payments that transactionally update invoice balances and order payment status.

#### Scenario: Recording a partial payment
Given an invoice with total balance $100.00
When the user records a payment of $40.00 via Zelle
Then the invoice amount_paid increases to $40.00, balance decreases to $60.00, status becomes "Partially paid", and an invoice event is logged.

### Requirement: Public invoice viewing and email/PDF delivery
The application SHALL provide a public URL route (`/invoice/:publicToken`) accessible without login, exposing bakery details, items, totals, payment instructions, and status without exposing internal database IDs.

#### Scenario: Viewing a public invoice
Given a customer with a valid public invoice link `/invoice/tok_abc123`
When they open the URL in a browser
Then the system displays the invoice items, totals, payment instructions, and due date, and logs a "Viewed" invoice event.
