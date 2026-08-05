export const LIFECYCLE_GATES = Object.freeze([
  Object.freeze({
    id: "plan",
    requires: Object.freeze([
      "selected OpenSpec change",
      "coherent artifacts",
      "testable acceptance criteria",
    ]),
  }),
  Object.freeze({
    id: "partition",
    requires: Object.freeze([
      "independent workstreams",
      "exclusive writable ownership",
      "model and reasoning selection",
      "stopping conditions",
    ]),
  }),
  Object.freeze({
    id: "implement",
    requires: Object.freeze([
      "artifact review",
      "bounded edits",
      "focused verification",
      "agent completion report",
    ]),
  }),
  Object.freeze({
    id: "integrate",
    requires: Object.freeze([
      "orchestrator review",
      "shared-contract reconciliation",
      "conflict resolution",
      "task status update",
    ]),
  }),
  Object.freeze({
    id: "verify",
    requires: Object.freeze([
      "integrated quality checks",
      "phase completion gate",
      "remaining-risk report",
      "sync and archive decision",
    ]),
  }),
]);

