import { describe, expect, it, vi } from "vitest";
import {
  deleteProductionTask,
  fetchProductionTaskById,
  fetchProductionTasks,
  insertProductionTask,
  regenerateOrderTasks,
  transformProductionTaskRow,
  updateProductionTask,
  type TaskRegenerationClient,
} from "./taskRegenerationAdapter";

describe("taskRegenerationAdapter data transformers", () => {
  it("transforms raw database row into DbProductionTask with default fallbacks", () => {
    const rawRow = {
      id: "task-123",
      bakery_id: "bakery-456",
      order_id: "order-789",
      recipe_id: "recipe-001",
      flow_id: "flow-002",
      flow_step_id: "step-003",
      title: "Mix Sourdough Dough",
      category: "mixing",
      status: "pending",
      scheduled_at: "2026-08-01T06:00:00Z",
      duration_minutes: 45,
      urgency: "normal",
      delay_minutes: 0,
      skip_reason: null,
      created_at: "2026-07-30T19:00:00Z",
      updated_at: "2026-07-30T19:00:00Z",
    };

    const transformed = transformProductionTaskRow(rawRow);

    expect(transformed).toEqual({
      id: "task-123",
      bakery_id: "bakery-456",
      order_id: "order-789",
      recipe_id: "recipe-001",
      flow_id: "flow-002",
      flow_step_id: "step-003",
      title: "Mix Sourdough Dough",
      category: "mixing",
      status: "pending",
      scheduled_at: "2026-08-01T06:00:00Z",
      duration_minutes: 45,
      urgency: "normal",
      delay_minutes: 0,
      skip_reason: null,
      created_at: "2026-07-30T19:00:00Z",
      updated_at: "2026-07-30T19:00:00Z",
    });
  });

  it("handles null and omitted optional fields gracefully", () => {
    const rawRow = {
      id: "task-999",
      bakery_id: "bakery-456",
      order_id: "order-789",
      recipe_id: null,
      flow_id: null,
      flow_step_id: null,
      title: "Shape Loaves",
      category: "shaping",
      status: null,
      scheduled_at: "2026-08-01T08:00:00Z",
      duration_minutes: null,
      urgency: null,
      delay_minutes: null,
      skip_reason: null,
      created_at: "2026-07-30T19:00:00Z",
      updated_at: "2026-07-30T19:00:00Z",
    };

    const transformed = transformProductionTaskRow(rawRow);

    expect(transformed).toEqual({
      id: "task-999",
      bakery_id: "bakery-456",
      order_id: "order-789",
      recipe_id: null,
      flow_id: null,
      flow_step_id: null,
      title: "Shape Loaves",
      category: "shaping",
      status: "pending",
      scheduled_at: "2026-08-01T08:00:00Z",
      duration_minutes: 30,
      urgency: "normal",
      delay_minutes: 0,
      skip_reason: null,
      created_at: "2026-07-30T19:00:00Z",
      updated_at: "2026-07-30T19:00:00Z",
    });
  });
});

describe("taskRegenerationAdapter database functions", () => {
  describe("fetchProductionTasks", () => {
    it("fetches tasks for a bakery with optional order, status, category, and limit filters", async () => {
      const mockRows = [
        {
          id: "t1",
          bakery_id: "b1",
          order_id: "o1",
          recipe_id: null,
          flow_id: null,
          flow_step_id: null,
          title: "Bake Baguettes",
          category: "baking",
          status: "pending",
          scheduled_at: "2026-08-01T10:00:00Z",
          duration_minutes: 30,
          urgency: "normal",
          delay_minutes: 0,
          skip_reason: null,
          created_at: "2026-07-30T00:00:00Z",
          updated_at: "2026-07-30T00:00:00Z",
        },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const results = await fetchProductionTasks(
        "b1",
        { orderId: "o1", status: "pending", category: "baking", limit: 10 },
        mockClient,
      );

      expect(mockClient.from).toHaveBeenCalledWith("production_tasks");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("bakery_id", "b1");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("order_id", "o1");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("status", "pending");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("category", "baking");
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Bake Baguettes");
    });

    it("throws error when fetch fail occurs", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Permission denied" },
        }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      await expect(fetchProductionTasks("b1", undefined, mockClient)).rejects.toThrow(
        "Failed to fetch production tasks: Permission denied",
      );
    });
  });

  describe("fetchProductionTaskById", () => {
    it("fetches single production task by ID", async () => {
      const mockRow = {
        id: "t1",
        bakery_id: "b1",
        order_id: "o1",
        title: "Ferment Dough",
        category: "ferment",
        status: "in-progress",
        scheduled_at: "2026-08-01T04:00:00Z",
        duration_minutes: 120,
        urgency: "urgent",
        delay_minutes: 15,
        created_at: "2026-07-30T00:00:00Z",
        updated_at: "2026-07-30T00:00:00Z",
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const task = await fetchProductionTaskById("t1", mockClient);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "t1");
      expect(task).not.toBeNull();
      expect(task?.title).toBe("Ferment Dough");
      expect(task?.status).toBe("in-progress");
    });

    it("returns null if task not found", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const task = await fetchProductionTaskById("t-missing", mockClient);
      expect(task).toBeNull();
    });

    it("throws error when query fails", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Internal Error" },
        }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      await expect(fetchProductionTaskById("t1", mockClient)).rejects.toThrow(
        "Failed to fetch production task by ID: Internal Error",
      );
    });
  });

  describe("insertProductionTask", () => {
    it("inserts production task with mapped payload", async () => {
      const insertedRow = {
        id: "t2",
        bakery_id: "b1",
        order_id: "o1",
        recipe_id: "r1",
        flow_id: "f1",
        flow_step_id: "fs1",
        title: "Prep Starter",
        category: "starter",
        status: "pending",
        scheduled_at: "2026-07-31T20:00:00Z",
        duration_minutes: 60,
        urgency: "normal",
        delay_minutes: 0,
        skip_reason: null,
        created_at: "2026-07-30T00:00:00Z",
        updated_at: "2026-07-30T00:00:00Z",
      };

      const mockQueryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: insertedRow, error: null }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const input = {
        bakery_id: "b1",
        order_id: "o1",
        recipe_id: "r1",
        flow_id: "f1",
        flow_step_id: "fs1",
        title: "Prep Starter",
        category: "starter" as const,
        scheduled_at: "2026-07-31T20:00:00Z",
        duration_minutes: 60,
      };

      const result = await insertProductionTask(input, mockClient);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        bakery_id: "b1",
        order_id: "o1",
        title: "Prep Starter",
        category: "starter",
        scheduled_at: "2026-07-31T20:00:00Z",
        recipe_id: "r1",
        flow_id: "f1",
        flow_step_id: "fs1",
        status: "pending",
        duration_minutes: 60,
        urgency: "normal",
        delay_minutes: 0,
        skip_reason: null,
      });
      expect(result.id).toBe("t2");
    });

    it("throws error when insert fails", async () => {
      const mockQueryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Unique violation" },
        }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const input = {
        bakery_id: "b1",
        order_id: "o1",
        title: "Prep Starter",
        category: "starter" as const,
        scheduled_at: "2026-07-31T20:00:00Z",
      };

      await expect(insertProductionTask(input, mockClient)).rejects.toThrow(
        "Failed to insert production task: Unique violation",
      );
    });
  });

  describe("updateProductionTask", () => {
    it("updates production task fields", async () => {
      const updatedRow = {
        id: "t1",
        bakery_id: "b1",
        order_id: "o1",
        title: "Mix Sourdough",
        category: "mixing",
        status: "completed",
        scheduled_at: "2026-08-01T06:00:00Z",
        duration_minutes: 45,
        urgency: "normal",
        delay_minutes: 10,
        skip_reason: null,
        created_at: "2026-07-30T00:00:00Z",
        updated_at: "2026-07-30T01:00:00Z",
      };

      const mockQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedRow, error: null }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const updateInput = {
        status: "completed" as const,
        delay_minutes: 10,
      };

      const result = await updateProductionTask("t1", updateInput, mockClient);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateInput);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "t1");
      expect(result.status).toBe("completed");
      expect(result.delay_minutes).toBe(10);
    });

    it("throws error on update failure", async () => {
      const mockQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Task not found" },
        }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      await expect(
        updateProductionTask("t-missing", { status: "skipped" }, mockClient),
      ).rejects.toThrow("Failed to update production task: Task not found");
    });
  });

  describe("deleteProductionTask", () => {
    it("deletes production task by ID", async () => {
      const mockQueryBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      await deleteProductionTask("t1", mockClient);

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "t1");
    });

    it("throws error on delete failure", async () => {
      const mockQueryBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: "FK Constraint" } }),
      };

      const mockClient: TaskRegenerationClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      await expect(deleteProductionTask("t1", mockClient)).rejects.toThrow(
        "Failed to delete production task: FK Constraint",
      );
    });
  });

  describe("regenerateOrderTasks", () => {
    it("invokes RPC generate_order_production_tasks with correct payload and maps response", async () => {
      const regeneratedRows = [
        {
          id: "rt1",
          bakery_id: "b1",
          order_id: "o100",
          recipe_id: "r1",
          flow_id: "f1",
          flow_step_id: "s1",
          title: "Ferment",
          category: "ferment",
          status: "pending",
          scheduled_at: "2026-08-05T04:00:00Z",
          duration_minutes: 180,
          urgency: "normal",
          delay_minutes: 0,
          skip_reason: null,
          created_at: "2026-07-30T00:00:00Z",
          updated_at: "2026-07-30T00:00:00Z",
        },
      ];

      const mockClient: TaskRegenerationClient = {
        rpc: vi.fn().mockResolvedValue({ data: regeneratedRows, error: null }),
      };

      const tasks = await regenerateOrderTasks(
        "b1",
        "o100",
        "2026-08-05",
        mockClient,
      );

      expect(mockClient.rpc).toHaveBeenCalledWith(
        "generate_order_production_tasks",
        {
          p_bakery_id: "b1",
          p_order_id: "o100",
          p_fulfillment_date: "2026-08-05",
        },
      );
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe("rt1");
      expect(tasks[0].order_id).toBe("o100");
    });

    it("throws error when RPC invocation fails", async () => {
      const mockClient: TaskRegenerationClient = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Order not found" },
        }),
      };

      await expect(
        regenerateOrderTasks("b1", "invalid-order", "2026-08-05", mockClient),
      ).rejects.toThrow(
        "Failed to regenerate order tasks: Order not found",
      );
    });
  });
});
