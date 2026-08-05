# Proposal: App Optimization

## Executive Summary

This change optimizes the Bakery App's initial JavaScript delivery and runtime
rendering without changing product behavior. The current production build emits
one 819,826-byte JavaScript entry chunk (211.29 KB gzip), the authenticated
workspace eagerly imports every feature screen, the domain selector consumes
the whole workspace snapshot, and each running production task card creates its
own one-second interval.

## Program Traceability

- Roadmap phase: F12 Settings, Reliability, and Release.
- New owning capability: `frontend-performance-optimization`.
- Prerequisites: the F1-F12 frontend baseline and the verified corrective
  `stabilize-lint-and-browser-tests` quality gates.
- Owning change: `app-optimization`.

## Scope

- Record reproducible entry-bundle and gzip baselines.
- Lazy-load public views and authenticated feature screens while keeping the
  authentication/workspace shell responsive and accessible.
- Preserve direct public invoice and storefront URLs and named compatibility
  exports used by tests or external callers.
- Reduce broad domain-state subscription work where profiling and tests prove a
  safe selector boundary.
- Replace per-card production timer intervals with one shared ticking source.
- Add an automated bundle budget and regression coverage for async screen
  navigation and production timers.

## Non-Goals

- Product redesign, feature removal, or route semantics changes.
- Database, RLS, migration, hosted Supabase, or network-query optimization.
- Image conversion or new CDN/hosting infrastructure.
- Arbitrary dependency removal or manual chunk configuration without measured
  bundle evidence.
- A guaranteed Lighthouse score, which is environment-dependent.

## Acceptance Evidence

- The production entry chunk is no larger than 500 KB minified and 150 KB gzip.
- Feature screens and public invoice/storefront views load through separate
  asynchronous chunks with accessible loading feedback.
- Multiple active production timers use one shared ticking source.
- Typecheck, zero-error lint, the complete unit suite, production build, and all
  42 desktop/mobile Playwright tests pass.
- A repository-owned bundle-budget check passes and reports measured entry and
  gzip sizes.

