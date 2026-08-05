# Frontend Quality Polish Specification

## Purpose

Ensures all application screens, navigation submenus, header dates, metrics cards, customer alerts, and starter notifications calculate their values and entity names dynamically from database domain snapshot records rather than displaying static hardcoded placeholders, mock names, or fixed array constants.

## ADDED Requirements

### Requirement: Dynamic Date, Bakery, and User Header Rendering
The application header and home screen MUST render live localized calendar dates, active database bakery names, and current user profile details derived from the active domain snapshot and Supabase Auth session.

#### Scenario: User opens home screen on any day
- **Given** an authenticated user in an active bakery workspace
- **When** the home screen renders
- **Then** the header displays the current localized weekday and date
- **And** the bakery title reflects the active database bakery name
- **And** the active order count and production tasks reflect live database records.

### Requirement: Dynamic Customer and Starter Entity Name Binding
Customer payment alerts, unpaid balance lists, starter feeding warnings, and storefront links MUST bind directly to database entity records.

#### Scenario: User views unpaid balance alert
- **Given** active unpaid invoices or orders in the database snapshot
- **When** the user views the home screen or finances screen
- **Then** the alert displays the actual database customer names and exact unpaid balances
- **And** storefront links point to the active database storefront slug (`/store/:slug`).

### Requirement: Dynamic Navigation Badges in Submenus
Submenu navigation items in `MoreScreen` and sidebar MUST display real-time counters for low stock inventory items, customer counts, unpaid balance totals, and active starter names.

#### Scenario: User navigates to the More menu
- **Given** an active bakery workspace with domain inventory and invoices
- **When** the user views `MoreScreen`
- **Then** "Inventory" displays the exact count of low stock items requiring attention
- **And** "Customers" displays the active database customer count
- **And** "Finances" displays the exact total unpaid balance formatted in local currency
- **And** "Starter Manager" displays the actual database starter name and feeding schedule.
