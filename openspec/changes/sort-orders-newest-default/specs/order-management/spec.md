# Order Management Delta

## Requirement: Default order queue sorts newest first

The Orders page MUST present orders newest-created-first by default using the authoritative order creation timestamp when available.

### Scenario: Persisted orders have creation timestamps

- GIVEN multiple persisted orders with different creation timestamps
- WHEN the Orders page presents the current, completed, draft, or cancelled order set
- THEN the most recently created order MUST appear before older orders
- AND filtering MUST NOT change that relative newest-first ordering.

### Scenario: Creation timestamps are equal

- GIVEN two orders with equal creation timestamps
- WHEN the Orders page presents them
- THEN their relative input order MUST remain stable.

### Scenario: Creation timestamp is unavailable or invalid

- GIVEN an order without a valid creation timestamp
- WHEN the Orders page presents it with timestamped orders
- THEN timestamped orders MUST be ordered newest first
- AND the untimestamped order MUST use deterministic stable fallback ordering
- AND the system MUST NOT infer creation recency from pickup date, order ID, or customer name.

## Requirement: Pickup semantics remain independent

Changing the default queue sort MUST NOT alter pickup date parsing, pickup urgency labels, lifecycle transitions, payment state, production state, or order detail behavior.
