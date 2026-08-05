## Purpose

Ensure the existing Figma-generated frontend can be installed, built, run, and verified consistently before feature restructuring or backend integration begins.

## ADDED Requirements

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
The frontend SHALL be smoke-tested in a browser at mobile and desktop viewport sizes while preserving its Figma-generated visual direction and existing mock-data prototype behavior.

#### Scenario: Mobile workflow is reachable
- **WHEN** the frontend is opened at a mobile viewport
- **THEN** the bottom navigation and Add Order workflow can be opened and completed through its existing prototype steps

#### Scenario: Desktop workflow is reachable
- **WHEN** the frontend is opened at a desktop viewport
- **THEN** the sidebar navigation reaches each currently implemented prototype screen without a browser runtime error

### Requirement: Local verification guidance
The repository SHALL document the supported commands for installation, local development, build verification, and known Figma-generated project constraints.

#### Scenario: New contributor onboarding
- **WHEN** a developer reads the frontend documentation
- **THEN** they can identify the supported package manager, required commands, and the current mock-data-only limitation
