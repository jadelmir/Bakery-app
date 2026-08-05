## Why

The Figma-generated frontend is present but cannot currently be built or verified because its dependencies are not installed reproducibly and its project scripts do not provide type-checking or test coverage. Before the application is restructured or connected to a backend, the existing prototype must run reliably so its user flows can be evaluated without losing its approved visual direction.

## What Changes

- Establish a reproducible frontend dependency-installation and build workflow for `Front-end`.
- Add project scripts for production build, type checking, linting, and tests.
- Verify the existing Figma-generated navigation and interactive prototype flows at mobile and desktop widths.
- Document how to run and verify the frontend locally, including the supported package manager and any known generated-project constraints.
- Keep the current visual design and mock-data prototype behavior intact; feature restructuring and backend integration are out of scope.

## Capabilities

### New Capabilities

- `frontend-runtime-verification`: The Figma-generated frontend can be installed, built, run, and smoke-tested through documented local commands.

### Modified Capabilities

- None.

## Impact

- Affects `Front-end/package.json`, package-manager metadata, developer documentation, and any minimal project configuration required for checks.
- Affects the Figma-generated React/Vite runtime only; no backend, database, authentication, production scheduling, or user-facing feature scope is introduced.
