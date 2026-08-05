import { describe, expect, it, vi } from "vitest";
import {
  fetchInventoryTransactions,
  fetchStarterBuilds,
  fetchStarterProfiles,
  fetchTaskExecutionLogs,
  insertInventoryTransaction,
  insertStarterBuild,
  insertStarterProfile,
  insertTaskExecutionLog,
  transformInventoryTransactionRow,
  transformStarterBuildRow,
  transformStarterProfileRow,
  transformTaskExecutionLogRow,
  type StarterInventoryClient,
} from "./starterInventoryAdapter";

describe("starterInventoryAdapter data transformers", () => {
  it("transforms starter profile row with string numerics and defaults", () => {
    const rawRow = {
      id: "profile-123",
      bakery_id: "bakery-456",
      name: "Levain Starter",
      flour_ratio: "100.00",
      water_ratio: "100.00",
      seed_ratio: "20.00",
      build_duration_hours: null,
      is_default: true,
      created_at: "2026-07-30T18:00:00Z",
    };

    const transformed = transformStarterProfileRow(rawRow);

    expect(transformed).toEqual({
      id: "profile-123",
      bakery_id: "bakery-456",
      name: "Levain Starter",
      flour_ratio: 100,
      water_ratio: 100,
      seed_ratio: 20,
      build_duration_hours: 8,
      is_default: true,
      created_at: "2026-07-30T18:00:00Z",
    });
  });

  it("transforms starter build row correctly", () => {
    const rawRow = {
      id: "build-123",
      bakery_id: "bakery-456",
      profile_id: "profile-789",
      target_date: "2026-08-01",
      seed_amount_g: "200.50",
      flour_amount_g: "1000.00",
      water_amount_g: "1000.00",
      total_build_g: "2200.50",
      usable_amount_g: "2000.00",
      retained_starter_g: "200.50",
      created_at: "2026-07-30T18:00:00Z",
    };

    const transformed = transformStarterBuildRow(rawRow);

    expect(transformed).toEqual({
      id: "build-123",
      bakery_id: "bakery-456",
      profile_id: "profile-789",
      target_date: "2026-08-01",
      seed_amount_g: 200.5,
      flour_amount_g: 1000,
      water_amount_g: 1000,
      total_build_g: 2200.5,
      usable_amount_g: 2000,
      retained_starter_g: 200.5,
      created_at: "2026-07-30T18:00:00Z",
    });
  });

  it("transforms inventory transaction row with optional fields", () => {
    const rawRow = {
      id: "tx-123",
      bakery_id: "bakery-456",
      item_id: "item-789",
      transaction_type: "deduction",
      quantity_change: "-15.500",
      unit_cost_cents: 250,
      invoice_reference: "INV-001",
      source_key: "task-build-1",
      notes: "Daily mix deduction",
      created_at: "2026-07-30T18:00:00Z",
    };

    const transformed = transformInventoryTransactionRow(rawRow);

    expect(transformed).toEqual({
      id: "tx-123",
      bakery_id: "bakery-456",
      item_id: "item-789",
      transaction_type: "deduction",
      quantity_change: -15.5,
      unit_cost_cents: 250,
      invoice_reference: "INV-001",
      source_key: "task-build-1",
      notes: "Daily mix deduction",
      created_at: "2026-07-30T18:00:00Z",
    });
  });

  it("transforms task execution log row with defaults", () => {
    const rawRow = {
      id: "log-123",
      bakery_id: "bakery-456",
      task_id: "task-789",
      action: "timer_start",
      elapsed_seconds: 120,
      delay_minutes: null,
      reason: null,
      created_at: "2026-07-30T18:00:00Z",
    };

    const transformed = transformTaskExecutionLogRow(rawRow);

    expect(transformed).toEqual({
      id: "log-123",
      bakery_id: "bakery-456",
      task_id: "task-789",
      action: "timer_start",
      elapsed_seconds: 120,
      delay_minutes: 0,
      reason: null,
      created_at: "2026-07-30T18:00:00Z",
    });
  });
});

describe("starterInventoryAdapter database functions", () => {
  describe("Starter Profiles", () => {
    it("fetches starter profiles for a bakery", async () => {
      const mockRows = [
        {
          id: "p1",
          bakery_id: "b1",
          name: "Sourdough",
          flour_ratio: 100,
          water_ratio: 80,
          seed_ratio: 20,
          build_duration_hours: 8,
          is_default: true,
          created_at: "2026-07-30T00:00:00Z",
        },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
      };

      const mockClient: StarterInventoryClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const results = await fetchStarterProfiles("b1", mockClient);

      expect(mockClient.from).toHaveBeenCalledWith("starter_profiles");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("bakery_id", "b1");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Sourdough");
    });

    it("inserts starter profile with mapped payload and default fields", async () => {
      const insertedRow = {
        id: "p1",
        bakery_id: "b1",
        name: "Poolish",
        flour_ratio: 100,
        water_ratio: 100,
        seed_ratio: 1,
        build_duration_hours: 12,
        is_default: false,
        created_at: "2026-07-30T00:00:00Z",
      };

      const mockQueryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: insertedRow, error: null }),
      };

      const mockClient: StarterInventoryClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const input = {
        bakery_id: "b1",
        name: "Poolish",
        flour_ratio: 100,
        water_ratio: 100,
        seed_ratio: 1,
        build_duration_hours: 12,
      };

      const result = await insertStarterProfile(input, mockClient);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        bakery_id: "b1",
        name: "Poolish",
        flour_ratio: 100,
        water_ratio: 100,
        seed_ratio: 1,
        build_duration_hours: 12,
        is_default: false,
      });
      expect(result.name).toBe("Poolish");
    });

    it("throws error when fetchStarterProfiles fails", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database connection failed" },
        }),
      };

      const mockClient: StarterInventoryClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      await expect(fetchStarterProfiles("b1", mockClient)).rejects.toThrow(
        "Failed to fetch starter profiles: Database connection failed",
      );
    });
  });

  describe("Starter Builds", () => {
    it("fetches starter builds with targetDate and limit options", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockClient: StarterInventoryClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      await fetchStarterBuilds(
        "b1",
        { targetDate: "2026-08-01", limit: 5 },
        mockClient,
      );

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("bakery_id", "b1");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
        "target_date",
        "2026-08-01",
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
    });

    it("inserts starter build with exact payload", async () => {
      const mockRow = {
        id: "sb-1",
        bakery_id: "b1",
        profile_id: null,
        target_date: "2026-08-01",
        seed_amount_g: 100,
        flour_amount_g: 500,
        water_amount_g: 500,
        total_build_g: 1100,
        usable_amount_g: 1000,
        retained_starter_g: 100,
        created_at: "2026-07-30T00:00:00Z",
      };

      const mockQueryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
      };

      const mockClient: StarterInventoryClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const input = {
        bakery_id: "b1",
        target_date: "2026-08-01",
        seed_amount_g: 100,
        flour_amount_g: 500,
        water_amount_g: 500,
        total_build_g: 1100,
        usable_amount_g: 1000,
        retained_starter_g: 100,
      };

      const result = await insertStarterBuild(input, mockClient);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        bakery_id: "b1",
        profile_id: null,
        target_date: "2026-08-01",
        seed_amount_g: 100,
        flour_amount_g: 500,
        water_amount_g: 500,
        total_build_g: 1100,
        usable_amount_g: 1000,
        retained_starter_g: 100,
      });
      expect(result.total_build_g).toBe(1100);
    });
  });

  describe("Inventory Transactions", () => {
    it("fetches inventory transactions filtering by itemId", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockClient: StarterInventoryClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      await fetchInventoryTransactions("b1", { itemId: "item-1" }, mockClient);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("bakery_id", "b1");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("item_id", "item-1");
    });

    it("inserts inventory transaction payload", async () => {
      const mockRow = {
        id: "tx-1",
        bakery_id: "b1",
        item_id: "item-1",
        transaction_type: "restock",
        quantity_change: 50,
        unit_cost_cents: 1200,
        invoice_reference: "INV-999",
        source_key: null,
        notes: null,
        created_at: "2026-07-30T00:00:00Z",
      };

      const mockQueryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
      };

      const mockClient: StarterInventoryClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const input = {
        bakery_id: "b1",
        item_id: "item-1",
        transaction_type: "restock" as const,
        quantity_change: 50,
        unit_cost_cents: 1200,
        invoice_reference: "INV-999",
      };

      const result = await insertInventoryTransaction(input, mockClient);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        bakery_id: "b1",
        item_id: "item-1",
        transaction_type: "restock",
        quantity_change: 50,
        unit_cost_cents: 1200,
        invoice_reference: "INV-999",
        source_key: null,
        notes: null,
      });
      expect(result.quantity_change).toBe(50);
    });
  });

  describe("Task Execution Logs", () => {
    it("fetches task execution logs with taskId filter", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockClient: StarterInventoryClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      await fetchTaskExecutionLogs("b1", { taskId: "task-10" }, mockClient);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("bakery_id", "b1");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("task_id", "task-10");
    });

    it("inserts task execution log with defaults for elapsed_seconds and delay_minutes", async () => {
      const mockRow = {
        id: "log-1",
        bakery_id: "b1",
        task_id: "task-10",
        action: "complete",
        elapsed_seconds: 0,
        delay_minutes: 0,
        reason: null,
        created_at: "2026-07-30T00:00:00Z",
      };

      const mockQueryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
      };

      const mockClient: StarterInventoryClient = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      const input = {
        bakery_id: "b1",
        task_id: "task-10",
        action: "complete" as const,
      };

      const result = await insertTaskExecutionLog(input, mockClient);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        bakery_id: "b1",
        task_id: "task-10",
        action: "complete",
        elapsed_seconds: 0,
        delay_minutes: 0,
        reason: null,
      });
      expect(result.action).toBe("complete");
    });
  });
});
