export type ModelProvider = "openai" | "gemini" | "claude";

export type SupportedModel =
  | "gpt-5.6-sol"
  | "gpt-5.6-terra"
  | "gemini-3.6-pro"
  | "gemini-3.6-flash"
  | "gemini-3.5-pro"
  | "gemini-3.5-flash"
  | "claude-3.7-sonnet"
  | "claude-4.6-sonnet"
  | "claude-3.5-haiku"
  | (string & {});

export type ReasoningEffort =
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max"
  | "ultra";

export interface ModelDefinition {
  readonly id: SupportedModel;
  readonly defaultReasoningEffort: ReasoningEffort;
  readonly provider?: ModelProvider | string;
  readonly useFor: readonly string[];
}

export interface AgentAssignmentInput {
  change: string;
  taskIds: string[];
  readFirst: string[];
  deliverable: string;
  writableOwnership: string[];
  doNotChange?: string[];
  verification: string[];
  stopWhen: string[];
  model: SupportedModel;
  reasoningEffort: ReasoningEffort;
}

export interface AgentAssignment {
  readonly change: string;
  readonly taskIds: readonly string[];
  readonly readFirst: readonly string[];
  readonly deliverable: string;
  readonly writableOwnership: readonly string[];
  readonly doNotChange: readonly string[];
  readonly verification: readonly string[];
  readonly stopWhen: readonly string[];
  readonly model: SupportedModel;
  readonly reasoningEffort: ReasoningEffort;
}

export interface OwnershipConflict {
  readonly leftIndex: number;
  readonly rightIndex: number;
  readonly leftPath: string;
  readonly rightPath: string;
}

export interface ProviderModelSet {
  readonly highReasoning: ModelDefinition;
  readonly bounded: ModelDefinition;
  readonly [key: string]: ModelDefinition;
}

export const MODEL_POLICY: Readonly<{
  sol: ModelDefinition;
  terra: ModelDefinition;
  openai: ProviderModelSet;
  gemini: ProviderModelSet;
  claude: ProviderModelSet;
}>;

export const AGENT_ROLES: Readonly<
  Record<
    "orchestrator" | "implementer" | "reviewer" | "researcher",
    Readonly<{
      owns: readonly string[];
      mayArchive: boolean;
      defaultWriteAccess: string;
    }>
  >
>;

export const LIFECYCLE_GATES: readonly Readonly<{
  id: "plan" | "partition" | "implement" | "integrate" | "verify";
  requires: readonly string[];
}>[];

export function selectRecommendedModel(options?: {
  kind?: string;
  risk?: "normal" | "high";
  provider?: ModelProvider | string;
}): ModelDefinition;

export function createAgentAssignment(
  input: AgentAssignmentInput,
): AgentAssignment;

export function findOwnershipConflicts(
  assignments: readonly Pick<AgentAssignment, "writableOwnership">[],
  options?: { caseSensitive?: boolean },
): readonly OwnershipConflict[];


