## Purpose

Ensures the frontend can be installed, built, run, and verified consistently across its current mix of Supabase-backed account/workspace boundaries and local bakery-domain prototype workflows.

## MODIFIED Requirements

### Requirement: Prototype smoke verification
The frontend SHALL be smoke-tested in a browser at mobile and desktop viewport sizes while preserving its visual direction and accurately exercising the configured runtime boundary: Supabase-backed authentication and workspaces in the normal runtime, and explicit mock adapters only in isolated test or opt-in mock scenarios.

#### Scenario: Mobile workflow is reachable
- **WHEN** the frontend is opened at a supported mobile viewport with its intended verification configuration
- **THEN** authentication, bakery selection, bottom navigation, and the local Add Order workflow are reachable without misrepresenting local bakery-domain data as persisted

#### Scenario: Desktop workflow is reachable
- **WHEN** the frontend is opened at a supported desktop viewport with its intended verification configuration
- **THEN** the authenticated workspace and each implemented screen are reachable without a browser runtime error

### Requirement: Local verification guidance
The repository SHALL document supported installation, local development, build, test, Supabase, and mock-scenario commands and SHALL identify which capabilities are persisted versus local prototype behavior.

#### Scenario: New contributor onboarding
- **WHEN** a developer reads the frontend documentation
- **THEN** they can identify the supported package manager, required commands, Supabase prerequisites, opt-in mock path, and current persisted/local capability boundary
