# Proposal: Stabilize Lint and Browser Verification

## Executive Summary

This corrective change restores the release-quality evidence for PRD Phase F12
(Settings, Reliability, and Release). The current application typechecks,
builds, and passes 129 unit/integration tests, but lint reports 63 errors and
the Playwright suite passes only 34 of 42 desktop/mobile tests. The owning
capability is `frontend-quality-polish`; the production-task checks also verify
the already-synchronized `production-task-generation` behavior.

## Program Traceability

- Roadmap phase: F12 Settings, Reliability, and Release.
- Owning capability: `frontend-quality-polish`.
- Verified dependent capability: `production-task-generation` (F8/B8).
- Prerequisites: F1-F11 and B12 remain the upstream release prerequisites.
- Corrective owner: `stabilize-lint-and-browser-tests`.

## Problem

The archived program evidence says the quality gates pass, but the current
workspace contradicts that evidence:

- ESLint reports 63 `no-explicit-any` errors in the production screen and two
  Supabase adapters plus their tests.
- Eight Playwright checks fail on both desktop and mobile. The failures involve
  store switching and production timer, delay, and prerequisite controls.
- Fixed July/August fixture dates and a July-specific assertion make date drift
  a leading hypothesis, but each failure must be diagnosed before an assertion
  or fixture is changed.

## Scope

- Replace explicit `any` usage with narrow application or generated database
  types without disabling lint rules.
- Make the 42-test Playwright suite deterministic across calendar dates while
  preserving the behavior each test is intended to prove.
- Correct genuine in-scope regressions discovered by those tests only after the
  failing behavior is distinguished from stale test data.
- Run the complete frontend verification baseline and update current program
  evidence only after every gate passes.

## Non-Goals

- New product features or UI redesign.
- Inline customer creation, deployment-provider integration, or hosted
  Supabase rollout validation.
- Database migrations, generated database schema changes, or RLS policy edits.
- Weakening assertions, skipping tests, suppressing lint rules, or reducing the
  required count below 42 browser tests.
- Rewriting any archived OpenSpec change.

## Acceptance Evidence

- `pnpm run typecheck` passes.
- `pnpm run lint` passes with zero warnings and zero errors.
- `pnpm run test` passes all 129 current tests (or the updated complete suite).
- `pnpm run build` passes.
- `pnpm run test:e2e` passes all 42 tests on desktop and mobile.
- Focused evidence explains whether each prior browser failure was test drift
  or an application defect.

