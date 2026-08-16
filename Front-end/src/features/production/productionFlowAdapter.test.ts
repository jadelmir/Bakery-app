import { describe, expect, it, vi } from "vitest";
import { createSupabaseProductionFlowAdapter } from "./productionFlowAdapter";

const flowRow = {
  id: "flow-custom",
  bakery_id: "bakery-1",
  name: "Custom flow",
  recipe: "Sourdough",
  is_default: false,
};

const stepRows = [
  {
    id: "proof",
    bakery_id: "bakery-1",
    flow_id: "flow-custom",
    name: "Proof",
    instructions: "Rest until doubled.",
    category: "fermentation",
    day_offset: 0,
    step_time: "08:30",
    duration_minutes: 90,
    enabled: true,
    groupable: true,
    depends_on: "mix",
    sort_order: 1,
  },
  {
    id: "mix",
    bakery_id: "bakery-1",
    flow_id: "flow-custom",
    name: "Mix",
    instructions: "Combine ingredients.",
    category: "prep",
    day_offset: 0,
    step_time: "08:00",
    duration_minutes: 20,
    enabled: true,
    groupable: false,
    depends_on: null,
    sort_order: 0,
  },
];

function queryResult<T>(result: { data: T; error: null } | { data: null; error: { code?: string; message: string; status?: number } }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    then: (onFulfilled: (value: typeof result) => unknown, onRejected?: (reason: unknown) => unknown) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return query;
}

describe("Supabase production-flow adapter", () => {
  it("maps hosted flow and steps into the ordered domain snapshot", async () => {
    const flowQuery = queryResult({ data: [flowRow], error: null });
    const stepQuery = queryResult({ data: stepRows, error: null });
    const client = {
      from: vi.fn((table: string) => table === "production_flows" ? flowQuery : stepQuery),
      rpc: vi.fn(),
    } as unknown as Parameters<typeof createSupabaseProductionFlowAdapter>[0];
    const adapter = createSupabaseProductionFlowAdapter(client);

    const result = await adapter.loadFlows({ bakeryId: "bakery-1" });

    expect(result).toEqual({
      ok: true,
      data: [{
        id: "flow-custom",
        name: "Custom flow",
        recipe: "Sourdough",
        isDefault: false,
        steps: [
          {
            id: "mix",
            name: "Mix",
            instructions: "Combine ingredients.",
            dayOffset: 0,
            time: "08:00",
            duration: 20,
            category: "prep",
            enabled: true,
            groupable: false,
          },
          {
            id: "proof",
            name: "Proof",
            instructions: "Rest until doubled.",
            dayOffset: 0,
            time: "08:30",
            duration: 90,
            category: "fermentation",
            enabled: true,
            groupable: true,
            dependsOn: "mix",
          },
        ],
      }],
    });
    expect(flowQuery.eq).toHaveBeenCalledWith("bakery_id", "bakery-1");
    expect(stepQuery.eq).toHaveBeenCalledWith("bakery_id", "bakery-1");
  });

  it("saves through the atomic RPC and maps its authoritative JSON response", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        ...flowRow,
        id: "flow-custom",
        isDefault: false,
        steps: [{
          id: "mix",
          name: "Mix",
          instructions: "Combine ingredients.",
          dayOffset: 0,
          time: "08:00",
          duration: 20,
          category: "prep",
          enabled: true,
          groupable: false,
        }],
      },
      error: null,
    });
    const client = {
      from: vi.fn(),
      rpc,
    } as unknown as Parameters<typeof createSupabaseProductionFlowAdapter>[0];
    const adapter = createSupabaseProductionFlowAdapter(client);
    const flow = {
      id: "flow-custom",
      name: "Custom flow",
      recipe: "Sourdough",
      isDefault: false,
      steps: [{
        id: "mix",
        name: "Mix",
        instructions: "Combine ingredients.",
        dayOffset: 0,
        time: "08:00",
        duration: 20,
        category: "prep",
        enabled: true,
        groupable: false,
      }],
    };

    const result = await adapter.saveProductionFlow({ bakeryId: "bakery-1", operationId: "op-1", flow });

    expect(rpc).toHaveBeenCalledWith("save_production_flow", { p_bakery_id: "bakery-1", p_flow: flow });
    expect(result).toMatchObject({ ok: true, data: { kind: "production-flow-mutated", operationId: "op-1", changes: { flows: [flow] } } });
  });

  it("returns readable failures for RPC errors and delete responses", async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce({ data: null, error: { code: "42501", message: "not a member" } })
      .mockResolvedValueOnce({ data: false, error: null });
    const client = { from: vi.fn(), rpc } as unknown as Parameters<typeof createSupabaseProductionFlowAdapter>[0];
    const adapter = createSupabaseProductionFlowAdapter(client);
    const flow = { id: "flow-custom", name: "Custom flow", recipe: "", isDefault: false, steps: [] };

    await expect(adapter.saveProductionFlow({ bakeryId: "bakery-1", operationId: "op-1", flow })).resolves.toMatchObject({
      ok: false,
      error: { kind: "authorization", retryable: false },
    });
    await expect(adapter.deleteProductionFlow({ bakeryId: "bakery-1", operationId: "op-2", flowId: "missing" })).resolves.toMatchObject({
      ok: false,
      error: { kind: "validation", field: "flowId" },
    });
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed hosted rows without exposing partial data", async () => {
    const client = {
      from: vi.fn((table: string) => table === "production_flows"
        ? queryResult({ data: [{ ...flowRow, name: null }], error: null })
        : queryResult({ data: [], error: null })),
      rpc: vi.fn(),
    } as unknown as Parameters<typeof createSupabaseProductionFlowAdapter>[0];
    const adapter = createSupabaseProductionFlowAdapter(client);

    await expect(adapter.loadFlows({ bakeryId: "bakery-1" })).resolves.toMatchObject({
      ok: false,
      error: { kind: "unknown", message: expect.stringContaining("missing flow name") },
    });
  });
});
