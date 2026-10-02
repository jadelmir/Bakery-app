## MODIFIED Requirements

### Requirement: Prototype smoke verification

The frontend SHALL be smoke-tested in a browser at mobile and desktop viewport
sizes while preserving its visual direction and accurately exercising the
configured runtime boundary: Supabase-backed authentication, workspaces, and
declared persisted capabilities in the normal runtime; explicit mock adapters
only in isolated test or opt-in mock scenarios; and the deployed GitHub Pages
base path for hosted acceptance.

#### Scenario: Mobile local workflow is reachable

- **WHEN** the frontend is opened at a supported mobile viewport with its
  intended local verification configuration
- **THEN** authentication, bakery selection, bottom navigation, and the local
  Add Order workflow are reachable without misrepresenting local bakery-domain
  data as persisted

#### Scenario: Desktop local workflow is reachable

- **WHEN** the frontend is opened at a supported desktop viewport with its
  intended local verification configuration
- **THEN** the authenticated workspace and each implemented screen are reachable
  without a browser runtime error

#### Scenario: Hosted staging workflow is reachable

- **WHEN** the deployed frontend is opened at a supported desktop or mobile
  viewport with the hosted staging verification configuration
- **THEN** the application uses real Supabase Auth and the deployed persisted
  adapters rather than mock adapters
- **AND** protected workspace routes, public storefront/invoice routes, and
  recovery callbacks resolve beneath the configured `/Bakery-app/` base path
- **AND** any capability that is still local-only is explicitly excluded from
  persisted staging acceptance evidence
