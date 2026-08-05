# Deployment Playbook Specification

## Purpose

Establishes the multi-environment deployment strategy (Local, Staging, Production), non-negotiable migration rules, CI/CD automated test pipelines, environment variable security, and production release governance for the Bakery App.

## ADDED Requirements

### Requirement: Multi-environment strategy and branch isolation
The project SHALL maintain three isolated environments (Local Docker, Staging Free Project #1, Production Free Project #2) mapped to feature branches, `develop` (staging), and `main` (production).

#### Scenario: Deploying schema changes to staging
Given a developer merging a feature branch into `develop`
When the merge pull request completes
Then the automated GitHub Action applies SQL migrations to the Staging Supabase project, deploys Edge Functions, and updates the staging preview.

#### Scenario: Production release protection
Given an approved release PR from `develop` to `main`
When the deployment workflow runs
Then the system requires explicit owner approval, executes a pre-release production database backup, and applies forward-fix migrations.

### Requirement: Migration integrity and automated CI quality pipeline
The project SHALL enforce Git as the sole source of truth for database schema, forbidding untracked dashboard edits and verifying local clean resets (`supabase db reset`), database linting, typechecks, and test suites in CI before merging PRs.

#### Scenario: Running automated CI checks on pull request
Given a contributor opening a pull request
When GitHub Actions triggers `ci.yml`
Then the runner starts a local Docker Supabase instance, applies all migrations, verifies `supabase db lint`, runs `npm run typecheck` and `npm test`, and fails the PR if any check fails.
