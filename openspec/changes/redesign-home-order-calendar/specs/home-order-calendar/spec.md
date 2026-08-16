## ADDED Requirements

### Requirement: Home shows persisted active orders by day

The Home screen SHALL derive its primary order calendar from the active bakery's shared persisted order snapshot and SHALL group orders by fulfillment date from today through the sixth following calendar day, using the bakery's configured date boundary. Orders with `completed` or `cancelled` status SHALL be excluded.

Roadmap trace: Frontend Phase 10 Dashboard and Notifications; depends on F1 shared application foundation and F6 persisted order/lifecycle capabilities; owner: `redesign-home-order-calendar`.

#### Scenario: Active orders are grouped in the today-first horizon

- **WHEN** the active bakery has persisted orders for today and future dates within the six-day horizon
- **THEN** Home shows one day group per date with the day label, date, and count of qualifying orders, ordered chronologically from today

#### Scenario: Completed and cancelled orders are excluded

- **WHEN** the persisted snapshot contains completed, cancelled, and active orders in the same date range
- **THEN** Home includes only the active orders and their counts do not include completed or cancelled orders

#### Scenario: Orders outside the horizon are excluded

- **WHEN** the persisted snapshot contains active orders before today or after the sixth following calendar day
- **THEN** those orders do not appear in the Home calendar

### Requirement: Home order cards summarize products

Each Home order card SHALL show a stable order identifier, customer name, fulfillment time, and aggregated product quantities in a compact summary, such as `5 Focaccia · 3 Loaves`. The card SHALL expose status and payment indicators without requiring the detail panel to understand the day count.

#### Scenario: Repeated products are aggregated

- **WHEN** an order contains multiple line items for the same product
- **THEN** the order card displays one product label with the combined quantity for that product

#### Scenario: Multiple products remain readable

- **WHEN** an order contains more than one product
- **THEN** the card displays each product and quantity in a compact, readable summary and preserves the full line-item list for the detail panel

### Requirement: Home opens an order detail side panel

Selecting an order card SHALL open an accessible side panel containing the complete order context available in the persisted snapshot: customer name, contact information, address when present, fulfillment date/time, products and quantities, order status, payment status, balance when applicable, and notes when present.

#### Scenario: Baker inspects an order from Home

- **WHEN** the baker selects an order card
- **THEN** a side panel opens without navigating away from Home and shows the selected order's customer and fulfillment details

#### Scenario: Baker closes the detail panel

- **WHEN** the baker activates the panel close action or presses the Escape key
- **THEN** the panel closes, Home remains at the same scroll position, and no order data changes

#### Scenario: Customer contact details are incomplete

- **WHEN** the selected customer's phone, email, or address is absent
- **THEN** the panel shows the available details and a clear unavailable state for missing fields without displaying another customer's data

### Requirement: Home handles empty and loading order states

Home SHALL distinguish persisted snapshot loading from a ready snapshot with no qualifying orders. It SHALL show a helpful empty state when no active orders fall within the horizon and SHALL NOT render static fixture orders as a fallback after the persisted snapshot path is available.

#### Scenario: No active orders are scheduled

- **WHEN** the active bakery snapshot is ready and contains no qualifying orders in the horizon
- **THEN** Home shows an empty state for upcoming orders and keeps the New Order action available

#### Scenario: Orders are still loading

- **WHEN** the active bakery snapshot has not finished loading
- **THEN** Home shows a loading treatment for the order calendar and does not show stale or global bakery orders

### Requirement: Home preserves secondary operational features

The Home redesign SHALL keep the existing task, alert, balance, starter, summary metric, storefront, and New Order features available, while placing the order calendar before those secondary sections in the primary content flow.

#### Scenario: Existing operational features remain available

- **WHEN** a baker opens Home with persisted order data
- **THEN** the order calendar is the primary section and the existing secondary features remain reachable without changing their underlying behavior

#### Scenario: Secondary widgets use active bakery data

- **WHEN** Home renders metrics, alerts, task progress, starter information, storefront status, or preparation items
- **THEN** each displayed value comes from the active bakery snapshot, and unavailable data produces a loading or empty state instead of a prototype value

### Requirement: Home reflects shared order mutations

The Home order calendar SHALL recompute from the committed shared snapshot after a persisted order is created, updated, transitioned, or cancelled during the mounted session.

#### Scenario: A new persisted order is created

- **WHEN** a supported order creation commits a persisted order for a date in the Home horizon
- **THEN** Home shows the order in the correct day group without requiring a full-page refresh

#### Scenario: An order becomes completed or cancelled

- **WHEN** an order in the Home calendar is transitioned to completed or cancelled
- **THEN** the order is removed from the active calendar projection and the affected day group disappears if no qualifying orders remain
