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

## Requirement: GitHub Pages development frontend deployment

The project SHALL publish the static Vite frontend from `develop` to GitHub Pages independently of Supabase database migration and Edge Function deployment.

### Scenario: Deploy frontend to development

- **GIVEN** an eligible frontend revision reaches `develop`
- **WHEN** the GitHub Pages frontend deployment workflow executes
- **THEN** it SHALL build `Front-end` with client-safe staging/development configuration
- **AND** use `/Bakery-app/` as the Vite project base path
- **AND** publish `Front-end/dist` through GitHub Pages Actions
- **AND** record the deployed URL/revision
- **AND** verify the deployed root and SPA deep-link fallback
- **AND** report deployment failure when publishing or smoke verification fails.

### Scenario: Refresh a client-side route on GitHub Pages

- **GIVEN** the development frontend is deployed below `/Bakery-app/`
- **WHEN** a browser requests a client-side route such as `/Bakery-app/orders` directly
- **THEN** the static 404 fallback SHALL preserve the requested application path
- **AND** redirect through the SPA entry point
- **AND** BrowserRouter SHALL resolve the restored route using the Vite base URL.

### Scenario: Frontend-only development change

- **GIVEN** a release changes only frontend code or frontend configuration
- **WHEN** the GitHub Pages deployment runs
- **THEN** frontend publication SHALL NOT require a database migration or database credential.

## Requirement: Production frontend deployment remains opt-in

The project SHALL NOT publish the production frontend automatically from `main` until a production hosting provider/domain is explicitly selected and a separate approved OpenSpec change enables that release path.

### Scenario: Merge frontend code to main before production hosting is configured

- **GIVEN** frontend code reaches `main`
- **AND** production frontend hosting has not been enabled
- **WHEN** GitHub Actions evaluates deployment workflows
- **THEN** no placeholder or accidental production frontend publish SHALL execute
- **AND** production Supabase backup/migration/Edge Function automation SHALL remain independently governed.

## Requirement: Protect browser build secrets

Only browser-safe values SHALL be exposed to Vite frontend builds.

### Scenario: Supply development frontend configuration

- **GIVEN** the GitHub Pages frontend build
- **WHEN** environment configuration is supplied to Vite
- **THEN** only browser-safe values SHALL use the `VITE_` prefix
- **AND** service-role keys, database passwords, Supabase management tokens, and other server-only secrets SHALL NOT be exposed to the frontend build.

## Requirement: Frontend rollback independence

The project SHALL support development frontend rollback by redeploying a last-known-good frontend revision without automatically reversing database migrations.

### Scenario: Roll back a broken development frontend release

- **GIVEN** a newly deployed GitHub Pages revision is broken
- **WHEN** an operator redeploys a known-good committed revision
- **THEN** that frontend revision SHALL be published independently
- **AND** database migrations SHALL remain governed by the forward-fix migration policy.
