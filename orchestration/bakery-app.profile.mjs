import {
  MODEL_POLICY,
  createAgentAssignment,
  findOwnershipConflicts,
} from "../packages/multi-agent-delivery/src/index.js";

export const bakeryAppProfile = Object.freeze({
  name: "bakery-app",
  planningSystem: "OpenSpec",
  orchestrator: Object.freeze({
    model: MODEL_POLICY.sol.id,
    reasoningEffort: MODEL_POLICY.sol.defaultReasoningEffort,
  }),
  boundedImplementation: Object.freeze({
    model: MODEL_POLICY.terra.id,
    reasoningEffort: MODEL_POLICY.terra.defaultReasoningEffort,
  }),
  modelPolicies: Object.freeze({
    openai: Object.freeze({
      orchestrator: MODEL_POLICY.openai.highReasoning.id,
      bounded: MODEL_POLICY.openai.bounded.id,
    }),
    gemini: Object.freeze({
      orchestrator: MODEL_POLICY.gemini.highReasoning.id,
      bounded: MODEL_POLICY.gemini.bounded.id,
    }),
    claude: Object.freeze({
      orchestrator: MODEL_POLICY.claude.highReasoning.id,
      bounded: MODEL_POLICY.claude.bounded.id,
    }),
  }),
  frontendPhases: Object.freeze([
    "shared-application-foundation",
    "authentication-and-account-experience",
    "ingredients-and-stock-entry",
    "recipe-management",
    "customer-management",
    "orders-and-payments",
    "production-flow-builder",
    "production-task-workspace",
    "starter-and-inventory-planning",
    "dashboard-and-notifications",
    "finances-and-invoices",
    "settings-reliability-and-release",
  ]),
  backendPhases: Object.freeze([
    "backend-foundation",
    "authentication-and-bakery-workspaces",
    "ingredients-and-costing",
    "recipes-and-production-flows",
    "customers-and-orders",
    "payments-invoices-and-historical-snapshots",
    "production-scheduling-engine",
    "task-lifecycle-and-regeneration",
    "starter-planning",
    "inventory-requirements",
    "reporting-invoice-delivery-and-notifications",
    "security-testing-and-release",
  ]),
  integratedVerification: Object.freeze([
    "pnpm run typecheck",
    "pnpm run lint",
    "pnpm run test",
    "pnpm run build",
  ]),
});

export { createAgentAssignment, findOwnershipConflicts };

