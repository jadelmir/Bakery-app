import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import type {
  AdapterFailure,
  AdapterResult,
  BakeryScope,
  DeleteProductionFlowInput,
  DomainProductionFlow,
  ProductionFlowResult,
  ProductionPort,
  SaveProductionFlowInput,
} from "../../app/domain/types";

const FLOW_COLUMNS = "id,bakery_id,name,recipe,is_default";
const STEP_COLUMNS = "id,bakery_id,flow_id,name,instructions,category,day_offset,step_time,duration_minutes,enabled,groupable,depends_on,sort_order";

type QueryError = { code?: string; message: string; status?: number };
type QueryResult<T> = { data: T | null; error: QueryError | null };

interface ProductionFlowQuery<T> extends PromiseLike<QueryResult<T>> {
  select<TResult = T>(columns: string): ProductionFlowQuery<TResult>;
  eq(column: "bakery_id" | "flow_id", value: string): ProductionFlowQuery<T>;
  order(column: string, options: { ascending: boolean }): ProductionFlowQuery<T>;
}

interface ProductionFlowClient {
  from(table: "production_flows" | "production_flow_steps"): ProductionFlowQuery<unknown>;
  rpc(functionName: "save_production_flow" | "delete_production_flow", args: Record<string, unknown>): Promise<QueryResult<unknown>>;
}

export interface ProductionFlowRow {
  id: string | null;
  bakery_id: string | null;
  name: string | null;
  recipe: string | null;
  is_default: boolean | null;
}

export interface ProductionFlowStepRow {
  id: string | null;
  bakery_id: string | null;
  flow_id: string | null;
  name: string | null;
  instructions: string | null;
  category: string | null;
  day_offset: number | string | null;
  step_time: string | null;
  duration_minutes: number | string | null;
  enabled: boolean | null;
  groupable: boolean | null;
  depends_on: string | null;
  sort_order: number | string | null;
}

export interface SupabaseProductionFlowAdapter extends Pick<ProductionPort, "saveProductionFlow" | "deleteProductionFlow"> {
  loadFlows(scope: BakeryScope): Promise<AdapterResult<readonly DomainProductionFlow[]>>;
}

const failure = (error: AdapterFailure): AdapterResult<never> => ({ ok: false, error });

const validation = (message: string, field?: string): AdapterResult<never> => failure({
  kind: "validation",
  message,
  retryable: false,
  ...(field ? { field } : {}),
});

const requiredText = (value: string | null, field: string): string => {
  if (!value || !value.trim()) throw new Error(`Production flow row is missing ${field}.`);
  return value;
};

const numberValue = (value: number | string | null, field: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Production flow row has an invalid ${field}.`);
  return parsed;
};

function mapError(error: QueryError, operation: string): AdapterFailure {
  const code = error.code?.toUpperCase();
  const message = `${operation}: ${error.message}`;
  if (error.status === 401 || error.status === 403 || code === "42501" || code === "PGRST301") return { kind: "authorization", message, retryable: false };
  if (code?.startsWith("22") || code?.startsWith("23") || error.status === 400) return { kind: "validation", message, retryable: false };
  if (code?.startsWith("08") || code === "PGRST000" || /failed to fetch|network|timeout|connection/i.test(error.message)) return { kind: "connection", message, retryable: true };
  return { kind: "unknown", message, retryable: false };
}

function mapStepRow(row: ProductionFlowStepRow, bakeryId: string): DomainProductionFlow["steps"][number] {
  if (row.bakery_id !== bakeryId) throw new Error("Supabase returned a flow step outside the active bakery.");
  return {
    id: requiredText(row.id, "step id"),
    name: requiredText(row.name, "step name"),
    instructions: row.instructions ?? "",
    dayOffset: numberValue(row.day_offset, "day_offset"),
    time: requiredText(row.step_time, "step_time"),
    duration: numberValue(row.duration_minutes, "duration_minutes"),
    category: requiredText(row.category, "category"),
    enabled: row.enabled ?? true,
    groupable: row.groupable ?? false,
    ...(row.depends_on ? { dependsOn: row.depends_on } : {}),
  };
}

function mapFlowRow(row: ProductionFlowRow, steps: readonly ProductionFlowStepRow[], bakeryId: string): DomainProductionFlow {
  if (row.bakery_id !== bakeryId) throw new Error("Supabase returned a production flow outside the active bakery.");
  const flowId = requiredText(row.id, "flow id");
  return {
    id: flowId,
    name: requiredText(row.name, "flow name"),
    recipe: row.recipe ?? "",
    isDefault: row.is_default ?? false,
    steps: steps
      .filter((step) => step.flow_id === flowId)
      .sort((left, right) => numberValue(left.sort_order, "sort_order") - numberValue(right.sort_order, "sort_order"))
      .map((step) => mapStepRow(step, bakeryId)),
  };
}

function mapJsonFlow(value: unknown): DomainProductionFlow {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Supabase returned an invalid production flow payload.");
  const flow = value as Record<string, unknown>;
  const steps = Array.isArray(flow.steps) ? flow.steps : [];
  return {
    id: requiredText(typeof flow.id === "string" ? flow.id : null, "flow id"),
    name: requiredText(typeof flow.name === "string" ? flow.name : null, "flow name"),
    recipe: typeof flow.recipe === "string" ? flow.recipe : "",
    isDefault: flow.isDefault === true,
    steps: steps.map((step, index) => {
      if (!step || typeof step !== "object" || Array.isArray(step)) throw new Error(`Supabase returned an invalid step at position ${index + 1}.`);
      const value = step as Record<string, unknown>;
      return {
        id: requiredText(typeof value.id === "string" ? value.id : null, `step ${index + 1} id`),
        name: requiredText(typeof value.name === "string" ? value.name : null, `step ${index + 1} name`),
        instructions: typeof value.instructions === "string" ? value.instructions : "",
        dayOffset: typeof value.dayOffset === "number" ? value.dayOffset : 0,
        time: requiredText(typeof value.time === "string" ? value.time : null, `step ${index + 1} time`),
        duration: typeof value.duration === "number" ? value.duration : 0,
        category: requiredText(typeof value.category === "string" ? value.category : null, `step ${index + 1} category`),
        enabled: value.enabled !== false,
        groupable: value.groupable !== false,
        ...(typeof value.dependsOn === "string" && value.dependsOn ? { dependsOn: value.dependsOn } : {}),
      };
    }),
  };
}

function mappedError(operation: string, cause: unknown): AdapterResult<never> {
  return failure({ kind: "unknown", message: `${operation}: ${cause instanceof Error ? cause.message : "Supabase returned invalid production flow data."}`, retryable: false });
}

function mutationResult(operationId: string, flow: DomainProductionFlow): AdapterResult<ProductionFlowResult> {
  return {
    ok: true,
    data: { kind: "production-flow-mutated", operationId, changes: { flows: [flow] } },
  };
}

export function createSupabaseProductionFlowAdapter(
  client: ProductionFlowClient = getSupabaseBrowserClient() as unknown as ProductionFlowClient,
): SupabaseProductionFlowAdapter {
  return {
    async loadFlows(scope) {
      if (!scope.bakeryId.trim()) return validation("A bakery ID is required.", "bakeryId");
      const [flowsResult, stepsResult] = await Promise.all([
        client.from("production_flows").select<ProductionFlowRow[]>(FLOW_COLUMNS).eq("bakery_id", scope.bakeryId).order("updated_at", { ascending: false }),
        client.from("production_flow_steps").select<ProductionFlowStepRow[]>(STEP_COLUMNS).eq("bakery_id", scope.bakeryId).order("sort_order", { ascending: true }),
      ]);
      if (flowsResult.error) return failure(mapError(flowsResult.error, "Failed to load production flows"));
      if (stepsResult.error) return failure(mapError(stepsResult.error, "Failed to load production flow steps"));
      try {
        const rows = flowsResult.data ?? [];
        const steps = stepsResult.data ?? [];
        return { ok: true, data: rows.map((row) => mapFlowRow(row, steps, scope.bakeryId)) };
      } catch (cause) {
        return mappedError("Failed to load production flows", cause);
      }
    },

    async saveProductionFlow(input: SaveProductionFlowInput) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      if (!input.bakeryId.trim()) return validation("A bakery ID is required.", "bakeryId");
      if (!input.flow.id.trim()) return validation("A flow ID is required.", "flow");
      const { data, error } = await client.rpc("save_production_flow", {
        p_bakery_id: input.bakeryId,
        p_flow: input.flow,
      });
      if (error) return failure(mapError(error, "Failed to save production flow"));
      try {
        return mutationResult(input.operationId, mapJsonFlow(data));
      } catch (cause) {
        return mappedError("Failed to save production flow", cause);
      }
    },

    async deleteProductionFlow(input: DeleteProductionFlowInput) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      if (!input.bakeryId.trim()) return validation("A bakery ID is required.", "bakeryId");
      if (!input.flowId.trim()) return validation("A flow ID is required.", "flowId");
      const { data, error } = await client.rpc("delete_production_flow", {
        p_bakery_id: input.bakeryId,
        p_flow_id: input.flowId,
      });
      if (error) return failure(mapError(error, "Failed to delete production flow"));
      if (data !== true) return validation("The production flow was not found in the active bakery.", "flowId");
      return {
        ok: true,
        data: {
          kind: "production-flow-mutated",
          operationId: input.operationId,
          changes: { deletedFlowIds: [input.flowId] },
        },
      };
    },
  };
}

export const createSupabaseProductionFlowPort = createSupabaseProductionFlowAdapter;
