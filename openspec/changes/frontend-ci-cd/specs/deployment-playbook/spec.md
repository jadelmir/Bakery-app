# Deployment Playbook Delta

## Requirement: Deterministic frontend continuous integration

The project SHALL run a deterministic frontend CI pipeline for pull requests targeting protected integration/release branches using the package manager and version declared by the frontend project.

### Scenario: Validate a frontend pull request

- **GIVEN** a pull request targets `develop` or `main`
- **WHEN** frontend CI executes
- **THEN** dependencies SHALL be installed from the committed lockfile using the declared pnpm version
- **AND** typecheck, lint, unit tests, production build, and bundle-budget checks SHALL run
- **AND** configured Playwright smoke/E2E checks SHALL run at the appropriate integration boundary
- **AND** the pull request SHALL fail its required check when any required quality gate fails.

### Scenario: Keep deployment secrets out of pull-request CI

- **GIVEN** CI is running for a pull request
- **WHEN** the frontend is built and tested
- **THEN** CI SHALL NOT require production hosting credentials, database passwords, service-role keys, or other private production secrets.

## Requirement: Independent frontend staging deployment

The project SHALL publish the static Vite frontend to a real staging hosting target independently of Supabase database migration and Edge Function deployment.

### Scenario: Deploy frontend to staging

- **GIVEN** an eligible revision reaches `develop`
- **WHEN** the staging frontend deployment workflow executes
- **THEN** it SHALL build `Front-end` with staging client-safe configuration
- **AND** publish `Front-end/dist` to the configured staging frontend host
- **AND** record the deployed URL/revision
- **AND** run a post-deploy smoke check
- **AND** report deployment failure when publishing or smoke verification fails.

### Scenario: Frontend-only staging change

- **GIVEN** a release changes only frontend code or frontend configuration
- **WHEN** the staging frontend deployment runs
- **THEN** the frontend publication SHALL NOT require a database migration to execute.

## Requirement: Protected production frontend deployment

The project SHALL deploy the production frontend from `main` through the protected production GitHub Environment and verify the live deployment.

### Scenario: Deploy approved frontend to production

- **GIVEN** the intended revision is present on `main`
- **AND** required production environment approval has been granted where configured
- **WHEN** the production frontend deployment executes
- **THEN** it SHALL build with production client-safe `VITE_*` configuration
- **AND** publish the static frontend to the configured production host
- **AND** identify the deployed commit SHA and URL
- **AND** run post-deploy smoke verification.

### Scenario: Protect browser build secrets

- **GIVEN** a staging or production frontend build
- **WHEN** environment configuration is supplied to Vite
- **THEN** only browser-safe values SHALL use the `VITE_` prefix
- **AND** service-role keys, database passwords, and other server-only secrets SHALL NOT be exposed to the frontend build.

## Requirement: Frontend rollback independence

The project SHALL support frontend rollback by redeploying a last-known-good frontend revision without automatically reversing database migrations.

### Scenario: Roll back a broken frontend release

- **GIVEN** a newly deployed frontend revision is broken
- **WHEN** an operator performs a frontend rollback
- **THEN** a prior known-good frontend revision SHALL be redeployed
- **AND** database migrations SHALL remain governed by the forward-fix migration policy.
