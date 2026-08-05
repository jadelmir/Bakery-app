const solModel = Object.freeze({
  id: "gpt-5.6-sol",
  defaultReasoningEffort: "high",
  provider: "openai",
  useFor: Object.freeze([
    "architecture",
    "security and authorization",
    "high-risk database migrations",
    "cross-layer debugging",
    "transactional invariants",
    "final integration review",
  ]),
});

const terraModel = Object.freeze({
  id: "gpt-5.6-terra",
  defaultReasoningEffort: "medium",
  provider: "openai",
  useFor: Object.freeze([
    "bounded implementation",
    "routine CRUD",
    "tests",
    "documentation",
    "repository exploration",
    "mechanical refactoring",
  ]),
});

const geminiHighReasoningModel = Object.freeze({
  id: "gemini-3.6-flash",
  defaultReasoningEffort: "high",
  provider: "gemini",
  useFor: Object.freeze([
    "architecture and design",
    "deep reasoning and security audits",
    "complex migrations and schema design",
    "multi-agent orchestration",
  ]),
});

const geminiBoundedModel = Object.freeze({
  id: "gemini-3.6-flash",
  defaultReasoningEffort: "medium",
  provider: "gemini",
  useFor: Object.freeze([
    "fast bounded task execution",
    "routine implementation and refactoring",
    "unit and integration test writing",
    "documentation updates",
  ]),
});

const claudeSonnetModel = Object.freeze({
  id: "claude-3.7-sonnet",
  defaultReasoningEffort: "high",
  provider: "claude",
  useFor: Object.freeze([
    "complex code generation and architecture",
    "refactoring and system integration",
    "security review and invariant checking",
  ]),
});

const claudeHaikuModel = Object.freeze({
  id: "claude-3.5-haiku",
  defaultReasoningEffort: "medium",
  provider: "claude",
  useFor: Object.freeze([
    "fast mechanical refactoring",
    "bounded unit tests",
    "documentation and basic exploration",
  ]),
});

export const MODEL_POLICY = Object.freeze({
  // Backward-compatible OpenAI shortcuts
  sol: solModel,
  terra: terraModel,

  // Provider namespace mappings
  openai: Object.freeze({
    highReasoning: solModel,
    bounded: terraModel,
  }),
  gemini: Object.freeze({
    highReasoning: geminiHighReasoningModel,
    bounded: geminiBoundedModel,
    pro: geminiHighReasoningModel,
    flash: geminiBoundedModel,
  }),
  claude: Object.freeze({
    highReasoning: claudeSonnetModel,
    bounded: claudeHaikuModel,
    sonnet: claudeSonnetModel,
    haiku: claudeHaikuModel,
  }),
});

const highRiskKinds = new Set([
  "architecture",
  "authorization",
  "database-migration",
  "financial-invariant",
  "integration-review",
  "security",
  "transactional-invariant",
]);

export function selectRecommendedModel({
  kind = "bounded-implementation",
  risk = "normal",
  provider = "openai",
} = {}) {
  const isHighRisk = risk === "high" || highRiskKinds.has(kind);
  const normalizedProvider = (provider || "openai").toLowerCase();

  if (normalizedProvider === "gemini") {
    return isHighRisk ? MODEL_POLICY.gemini.highReasoning : MODEL_POLICY.gemini.bounded;
  }
  if (normalizedProvider === "claude") {
    return isHighRisk ? MODEL_POLICY.claude.highReasoning : MODEL_POLICY.claude.bounded;
  }

  return isHighRisk ? MODEL_POLICY.sol : MODEL_POLICY.terra;
}


