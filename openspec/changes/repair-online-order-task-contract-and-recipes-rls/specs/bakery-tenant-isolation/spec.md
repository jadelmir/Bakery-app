## ADDED Requirements

### Requirement: Recipe records are membership-isolated

Recipe rows SHALL be protected by row-level security and accessible only when
the authenticated user has a current membership in the row's owning bakery.
The policy SHALL apply the same boundary to reads and writes.

#### Scenario: A bakery member reads and edits its recipes

- **WHEN** an authenticated member selects or updates a recipe owned by a
  bakery in which they currently have membership
- **THEN** the operation succeeds for that bakery's rows

#### Scenario: A cross-bakery recipe read is attempted

- **WHEN** an authenticated user selects recipes owned by a bakery in which
  they have no current membership
- **THEN** no protected recipe row is returned

#### Scenario: A cross-bakery recipe mutation is attempted

- **WHEN** an authenticated user attempts to insert, update, or delete a
  recipe under a bakery in which they have no current membership
- **THEN** the data layer rejects the mutation regardless of the active bakery
  identifier supplied by the client

#### Scenario: Anonymous storefront access is attempted

- **WHEN** an unauthenticated caller requests recipe rows directly
- **THEN** the caller receives no recipe data and cannot use recipes RLS as a
  substitute for the published storefront boundary
