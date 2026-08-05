# Multi-Agent Delivery

A dependency-free ESM package containing generic orchestration definitions for
OpenSpec-governed software delivery.

The package intentionally contains no consuming-project phase names, domain
rules, paths, or verification commands. A consuming repository supplies those
through its own project profile.

## Current status

Publication is disabled with `"private": true`, and the package is marked
`UNLICENSED`. It can be used locally while its API evolves.

Before publishing:

1. Choose a globally available npm package name and scope.
2. Choose and add an open-source or commercial license.
3. Review named exports as a public compatibility contract.
4. Adopt semantic versioning and a changelog/release process.
5. Remove `"private": true`.
6. Run tests and inspect `npm pack --dry-run`.
7. Publish through an approved npm account with provenance and least-privilege
   credentials.

## Exports

```js
import {
  AGENT_ROLES,
  LIFECYCLE_GATES,
  MODEL_POLICY,
  createAgentAssignment,
  findOwnershipConflicts,
  selectRecommendedModel,
} from "@multi-agent-delivery/core";
```

## Example

```js
const assignment = createAgentAssignment({
  change: "add-customer-management",
  taskIds: ["2.1", "2.2"],
  readFirst: [
    "proposal.md",
    "design.md",
    "specs/customer-management/spec.md",
    "tasks.md",
  ],
  deliverable: "Implement the customer editor and focused tests.",
  writableOwnership: ["src/features/customers"],
  doNotChange: ["src/app/router.tsx"],
  verification: ["pnpm run test -- customers"],
  stopWhen: ["The data contract must change", "An owned file overlaps"],
  model: "gpt-5.6-terra",
  reasoningEffort: "medium",
});
```

`findOwnershipConflicts()` accepts multiple assignments and reports exact or
parent/child path overlaps before agents are spawned.
