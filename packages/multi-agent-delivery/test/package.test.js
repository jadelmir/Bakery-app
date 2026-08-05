import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_ROLES,
  LIFECYCLE_GATES,
  MODEL_POLICY,
  createAgentAssignment,
  findOwnershipConflicts,
  selectRecommendedModel,
} from "../src/index.js";

const baseAssignment = {
  change: "example-change",
  taskIds: ["1.1"],
  readFirst: ["proposal.md", "tasks.md"],
  deliverable: "Implement the bounded change.",
  writableOwnership: ["src/example"],
  verification: ["npm test"],
  stopWhen: ["The approved contract must change"],
  model: "gpt-5.6-terra",
  reasoningEffort: "medium",
};

test("exports generic roles, models, and lifecycle gates", () => {
  assert.equal(AGENT_ROLES.orchestrator.mayArchive, true);
  assert.equal(AGENT_ROLES.implementer.mayArchive, false);
  assert.equal(MODEL_POLICY.sol.id, "gpt-5.6-sol");
  assert.equal(MODEL_POLICY.gemini.highReasoning.id, "gemini-3.6-flash");
  assert.equal(MODEL_POLICY.gemini.highReasoning.defaultReasoningEffort, "high");
  assert.equal(MODEL_POLICY.gemini.bounded.defaultReasoningEffort, "medium");
  assert.equal(MODEL_POLICY.claude.sonnet.id, "claude-3.7-sonnet");
  assert.deepEqual(
    LIFECYCLE_GATES.map((gate) => gate.id),
    ["plan", "partition", "implement", "integrate", "verify"],
  );
});

test("selects Sol for high-risk work and Terra for bounded work", () => {
  assert.equal(
    selectRecommendedModel({ kind: "security" }).id,
    "gpt-5.6-sol",
  );
  assert.equal(selectRecommendedModel().id, "gpt-5.6-terra");
});

test("selects provider-specific models for Gemini and Claude", () => {
  const geminiHigh = selectRecommendedModel({ kind: "security", provider: "gemini" });
  assert.equal(geminiHigh.id, "gemini-3.6-flash");
  assert.equal(geminiHigh.defaultReasoningEffort, "high");

  const geminiBounded = selectRecommendedModel({ kind: "bounded-implementation", provider: "gemini" });
  assert.equal(geminiBounded.id, "gemini-3.6-flash");
  assert.equal(geminiBounded.defaultReasoningEffort, "medium");

  assert.equal(
    selectRecommendedModel({ kind: "architecture", provider: "claude" }).id,
    "claude-3.7-sonnet",
  );
  assert.equal(
    selectRecommendedModel({ kind: "bounded-implementation", provider: "claude" }).id,
    "claude-3.5-haiku",
  );
});


test("creates an immutable, normalized assignment", () => {
  const assignment = createAgentAssignment({
    ...baseAssignment,
    change: " example-change ",
  });

  assert.equal(assignment.change, "example-change");
  assert.deepEqual(assignment.doNotChange, []);
  assert.equal(Object.isFrozen(assignment), true);
  assert.equal(Object.isFrozen(assignment.taskIds), true);
});

test("rejects incomplete assignments", () => {
  assert.throws(
    () => createAgentAssignment({ ...baseAssignment, taskIds: [] }),
    /taskIds/,
  );
});

test("detects exact and parent-child ownership conflicts", () => {
  const first = createAgentAssignment(baseAssignment);
  const second = createAgentAssignment({
    ...baseAssignment,
    taskIds: ["2.1"],
    writableOwnership: ["src/example/components"],
  });

  assert.deepEqual(findOwnershipConflicts([first, second]), [
    {
      leftIndex: 0,
      rightIndex: 1,
      leftPath: "src/example",
      rightPath: "src/example/components",
    },
  ]);
});

