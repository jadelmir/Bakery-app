# frontend-runtime-verification Specification

## Purpose

Ensure the existing Figma-generated frontend can be installed, built, run, and verified consistently before feature restructuring or backend integration begins.

## Requirements

### Requirement: Reproducible frontend setup
The system SHALL provide one documented package-manager workflow that installs all dependencies declared by the frontend project and produces a committed lockfile for that workflow.

#### Scenario: Clean local installation
- **WHEN** a developer follows the documented setup instructions from a clean checkout
- **THEN** all frontend dependencies are installed without requiring undocumented local files

### Requirement: Verifiable frontend quality gates
The frontend project SHALL expose documented commands for a production build, TypeScript type checking, linting, and automated tests.

#### Scenario: Quality verification
- **WHEN** a developer runs the documented verification commands
- **THEN** each command reports success or a failure with actionable output

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
