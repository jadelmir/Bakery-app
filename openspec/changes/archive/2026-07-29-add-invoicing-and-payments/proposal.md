# Proposal - Add Invoicing, Payments, and Payment Methods (Phase F11 / B6 / B11)

## Why

Bakery operations require issuing formal invoices, managing payment settings (Zelle, PayPal, Cash, Check, Custom), tracking partial and full payments, sending public invoice links (`/invoice/:publicToken`), generating PDFs, and sending email notifications via Resend.

Currently, invoice management and payment method configuration are missing from backend storage and React UI navigation.

This change establishes the Supabase database tables, RLS security policies, server functions, domain contracts, and React UI components for Invoicing, Payments, and Payment Methods.

## What Changes

- **Backend (B6 / B11)**:
  - Add Supabase migration creating `invoices`, `invoice_items`, `invoice_events`, `bakery_payment_methods`, `invoice_payment_methods`, and `payments` tables.
  - Money stored as integer cents (`subtotal_cents`, `total_cents`, `amount_paid_cents`, `balance_cents`).
  - Server-calculated invoice totals, unique invoice numbers per bakery, and secure public tokens (`public_token`).
  - Historical snapshots (`customer_snapshot_json`, `bakery_snapshot_json`, `fulfillment_snapshot_json`).
  - Enable RLS policies scoped to `bakery_memberships` for private tables and token-gated public access.
  - Server function/Edge Function for Resend email delivery and PDF generation.
- **Frontend (F11)**:
  - Navigation entries for Invoices and Invoice & Payment Settings.
  - `InvoiceList` view with search, filter tabs (Draft, Sent, Viewed, Partially paid, Paid, Overdue, Cancelled), and action menus.
  - `InvoiceEditor` modal for creating invoices from orders, customer profiles, or custom line items.
  - `PublicInvoiceView` route (`/invoice/:publicToken`) exposing bakery identity, items, totals, payment instructions, and status without exposing internal database IDs.
  - `PaymentSettings` screen for configuring payment methods (Zelle, PayPal, Cash, Check, Custom) with manual confirmation flags and instructions.
  - `RecordPaymentDialog` for recording partial or full payments and updating invoice/order balances atomically.

## Capabilities

### New Capabilities
- `invoicing-and-payments`: Defines invoice lifecycle, server-calculated totals, public invoice pages, payment method settings, payment recording, email delivery, and PDF generation.

## Impact
- **Database Schema**: Adds 6 tables (`invoices`, `invoice_items`, `invoice_events`, `bakery_payment_methods`, `invoice_payment_methods`, `payments`) with RLS policies and indexes.
- **Frontend Navigation**: Adds `/app/invoices`, `/app/settings/payments`, and public `/invoice/:publicToken` routes.
- **Dependencies**: Depends on Phase B2 (`add-multi-store-workspaces`) for tenant isolation and Phase F1 (`establish-shared-application-foundation`) for workspace routing.
