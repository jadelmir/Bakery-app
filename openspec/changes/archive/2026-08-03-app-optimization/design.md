# Design: App Optimization

## Baseline

- Vite production entry: 819,826 bytes minified.
- Vite production entry gzip: 211.29 KB.
- `BakeryWorkspace.tsx` statically imports all feature screens and managers.
- `App.tsx` statically imports the public invoice and storefront views.
- `useBakeryDomainSelector(selectSnapshot)` observes the complete domain state.
- Each active `TaskExecutionCard` owns a one-second interval.

## Decisions

### Shell-First Code Splitting

Authentication, workspace selection, primary navigation, and an accessible
loading fallback remain in the initial shell. Public invoice/storefront views
and authenticated feature screens use `React.lazy` plus `Suspense`. The
orchestrator owns `App.tsx` and `BakeryWorkspace.tsx` because these are central,
high-conflict integration surfaces.

Chunk boundaries SHALL follow user navigation boundaries. `manualChunks` SHALL
not be introduced unless the post-split bundle report shows a specific vendor
problem that lazy imports cannot address.

### Measured Bundle Budget

Vite emits a manifest. A dependency-free Node script identifies the entry asset,
measures raw and gzip bytes, prints the result, and fails when the agreed budget
is exceeded. The initial target is 500 KB minified and 150 KB gzip, matching the
existing Vite warning boundary while requiring a material improvement over the
current baseline.

### Selector Isolation

The domain provider retains bakery-switch isolation and mutation behavior.
Selector work may introduce subscription/equality support only with tests that
prove unrelated state updates do not notify an unchanged selected value.
`BakeryWorkspace` integration remains orchestrator-owned.

### Shared Production Clock

One production-workspace ticker publishes the current time once per second when
at least one timer is active. Task cards derive elapsed time from that shared
value and no longer create independent intervals. Timer start, pause, resume,
delay, prerequisite, and completion semantics remain unchanged.

## Workstream Layout

```text
Bundle measurement       Selector isolation       Shared production clock
package/vite/script      provider/selectors       ProductionScreen/card
          \                    |                    /
           \------------- orchestrator ------------/
                 App/BakeryWorkspace integration
                   complete regression suite
```

## Risks

- **Lazy-load test timing:** update tests to await meaningful screen content,
  not arbitrary sleeps.
- **Compatibility exports defeating splitting:** preserve the API while
  checking the actual manifest rather than assuming tree-shaking behavior.
- **Selector staleness:** test bakery switching, mutation states, and reloads.
- **Timer drift:** derive elapsed seconds from timestamps, not tick counts.
- **Over-fragmentation:** keep shell/navigation together and split at screen
  boundaries only.

## Verification

Focused workstream checks are followed by:

```text
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run check:bundle
pnpm run test:e2e
```

