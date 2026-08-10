# Delta: Deployment Playbook

## ADDED Requirements

### Requirement: CI and staging deployment use the committed Supabase project

The system MUST treat `Front-end/supabase/` as the Supabase project used by CI and staging deployment.

#### Scenario: Pull request database validation

- **WHEN** the database CI job runs
- **THEN** Supabase start/reset/lint commands execute against the project whose config and migrations are under `Front-end/supabase/`
- **AND** a clean reset applies the committed migrations successfully.

#### Scenario: Staging backend deployment

- **WHEN** `develop` contains a change under `Front-end/supabase/**`
- **THEN** the staging deployment workflow is triggered
- **AND** it links to the staging Supabase project from the correct working directory
- **AND** it applies committed migrations before deploying Edge Functions.

### Requirement: staging deployment proves required schema exists

A staging backend deployment MUST fail if the minimum required application schema is absent after migrations are applied.

#### Scenario: Required table missing

- **WHEN** migrations complete but a required bakery/customer/order schema object is missing
- **THEN** the deployment verification step fails
- **AND** the deployment is not reported as successful.

#### Scenario: Required schema present

- **WHEN** all required schema objects exist after `supabase db push`
- **THEN** schema verification passes
- **AND** subsequent deployment steps may continue.
