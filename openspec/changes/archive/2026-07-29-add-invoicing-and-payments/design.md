# Design - Add Invoicing, Payments, and Payment Methods (Phase F11 / B6 / B11)

## Context

Bakery owners need to send invoices to wholesale and retail customers, accept payments (Zelle, PayPal, Cash, Check), track balances, and provide public invoice links for clients to view and pay.

This design specifies the database tables, integer-cents financial rules, public token access models, payment recording workflows, and React UI components.

## Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React Application                               │
│  - InvoiceList, InvoiceEditor, PaymentSettings, RecordPaymentDialog    │
│  - Public Invoice Route (/invoice/:publicToken)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Supabase Postgres & RLS                         │
│  - public.invoices (integer cents, public_token, snapshots_json)       │
│  - public.invoice_items, invoice_events, payments                      │
│  - public.bakery_payment_methods, invoice_payment_methods             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Supabase Edge Functions                          │
│  - send-invoice-email (Resend API)                                     │
│  - generate-invoice-pdf (PDFKit / HTML-to-PDF)                          │
└────────────────────────────────────────────────────────────────────────┘
```

## Decisions

### 1. Integer Cents & Server-Calculated Totals
All monetary values (`subtotal_cents`, `tax_cents`, `discount_cents`, `total_cents`, `amount_paid_cents`, `balance_cents`) are stored as integer cents to eliminate floating point rounding errors. Server triggers or functions compute final totals.

### 2. Historical Snapshots
Invoices store JSON snapshots (`customer_snapshot_json`, `bakery_snapshot_json`, `fulfillment_snapshot_json`) at creation time to preserve historical legal accuracy even if customer addresses or bakery details change later.

### 3. Public Invoice Tokens
Every invoice receives a cryptographically secure `public_token` (UUIDv4 / random string). The public route `/invoice/:publicToken` reads invoice data using RLS policy `FOR SELECT USING (public_token = ...)` without exposing internal database IDs or private notes.

### 4. Payment Methods & Manual Confirmation
Support PayPal, Zelle, Cash, Check, and Custom methods. Zelle payments require manual staff confirmation and are never marked paid automatically.
