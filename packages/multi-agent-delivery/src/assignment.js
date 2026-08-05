const requiredStringFields = ["change", "deliverable", "model", "reasoningEffort"];
const requiredArrayFields = [
  "taskIds",
  "readFirst",
  "writableOwnership",
  "verification",
  "stopWhen",
];

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
}

function requireNonEmptyStringArray(value, field) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    throw new TypeError(`${field} must be a non-empty array of strings.`);
  }
}

function freezeStringArray(value = []) {
  return Object.freeze(value.map((item) => item.trim()));
}

export function createAgentAssignment(input) {
  if (!input || typeof input !== "object") {
    throw new TypeError("assignment input must be an object.");
  }

  for (const field of requiredStringFields) {
    requireNonEmptyString(input[field], field);
  }

  for (const field of requiredArrayFields) {
    requireNonEmptyStringArray(input[field], field);
  }

  if (input.doNotChange !== undefined && !Array.isArray(input.doNotChange)) {
    throw new TypeError("doNotChange must be an array of strings when provided.");
  }

  return Object.freeze({
    change: input.change.trim(),
    taskIds: freezeStringArray(input.taskIds),
    readFirst: freezeStringArray(input.readFirst),
    deliverable: input.deliverable.trim(),
    writableOwnership: freezeStringArray(input.writableOwnership),
    doNotChange: freezeStringArray(input.doNotChange),
    verification: freezeStringArray(input.verification),
    stopWhen: freezeStringArray(input.stopWhen),
    model: input.model.trim(),
    reasoningEffort: input.reasoningEffort.trim(),
  });
}

function normalizeOwnedPath(value, caseSensitive) {
  const normalized = value.trim().replaceAll("\\", "/").replace(/\/+$/, "");
  return caseSensitive ? normalized : normalized.toLowerCase();
}

function pathsOverlap(left, right) {
  return (
    left === right ||
    left.startsWith(`${right}/`) ||
    right.startsWith(`${left}/`)
  );
}

export function findOwnershipConflicts(assignments, { caseSensitive = false } = {}) {
  if (!Array.isArray(assignments)) {
    throw new TypeError("assignments must be an array.");
  }

  const conflicts = [];

  for (let leftIndex = 0; leftIndex < assignments.length; leftIndex += 1) {
    const left = assignments[leftIndex];
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < assignments.length;
      rightIndex += 1
    ) {
      const right = assignments[rightIndex];
      for (const leftPath of left.writableOwnership ?? []) {
        for (const rightPath of right.writableOwnership ?? []) {
          if (
            pathsOverlap(
              normalizeOwnedPath(leftPath, caseSensitive),
              normalizeOwnedPath(rightPath, caseSensitive),
            )
          ) {
            conflicts.push(
              Object.freeze({
                leftIndex,
                rightIndex,
                leftPath,
                rightPath,
              }),
            );
          }
        }
      }
    }
  }

  return Object.freeze(conflicts);
}

