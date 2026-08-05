export const AGENT_ROLES = Object.freeze({
  orchestrator: Object.freeze({
    owns: Object.freeze([
      "OpenSpec change selection and coherence",
      "task partitioning and model selection",
      "exclusive file ownership",
      "integration and conflict resolution",
      "whole-change verification",
      "sync and archive readiness",
    ]),
    mayArchive: true,
    defaultWriteAccess: "integration-owned files only",
  }),
  implementer: Object.freeze({
    owns: Object.freeze([
      "assigned OpenSpec task IDs",
      "assigned writable files",
      "focused verification",
      "implementation report",
    ]),
    mayArchive: false,
    defaultWriteAccess: "explicit assignment only",
  }),
  reviewer: Object.freeze({
    owns: Object.freeze([
      "independent findings",
      "risk classification",
      "verification evidence",
    ]),
    mayArchive: false,
    defaultWriteAccess: "read-only unless explicitly assigned review fixes",
  }),
  researcher: Object.freeze({
    owns: Object.freeze([
      "bounded investigation",
      "evidence and source reporting",
    ]),
    mayArchive: false,
    defaultWriteAccess: "read-only",
  }),
});

