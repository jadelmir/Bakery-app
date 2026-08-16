import { describe, expect, it } from "vitest";
import { FIXTURE_BAKERY_IDS } from "../domain/fixtures";
import { createSessionLocalBakeryDomainAdapter } from "../domain/localAdapter";
import type { DomainProductionFlow, ProductionFlowResult } from "../domain/types";
import { createBakeryDomainController, selectMutationState } from "./domainState";
import { selectCustomers, selectDashboard, selectFinances, selectInventory, selectOrders, selectProduction, selectSnapshot } from "./selectors";

const earls = FIXTURE_BAKERY_IDS.EARLS;

async function loadedController() {
  const controller = createBakeryDomainController(createSessionLocalBakeryDomainAdapter());
  await controller.load(earls);
  const snapshot = selectSnapshot(controller.getState());
  if (!snapshot) throw new Error("Expected Earl's fixture snapshot to load.");
  return { controller, snapshot };
}

describe("bakery domain state", () => {
  it("commits one created order to all six F1 screen projections", async () => {
    const { controller, snapshot: before } = await loadedController();
    const dashboardBefore = selectDashboard(before);
    const ordersBefore = selectOrders(before);
    const productionBefore = selectProduction(before);
    const inventoryBefore = selectInventory(before);
    const sarahBefore = selectCustomers(before).find((customer) => customer.id === "customer-sarah");
    const financesBefore = selectFinances(before);

    await controller.createOrder({
      bakeryId: earls, operationId: "state-create-order", orderId: "order-state-001", customerId: "customer-sarah",
      pickupDate: "2026-08-04", pickupTime: "10:00", paid: 0, items: [{ recipeId: "recipe-sourdough", quantity: 1, unitPrice: 14 }],
    });
    const after = selectSnapshot(controller.getState());
    if (!after || !sarahBefore) throw new Error("Expected a committed snapshot and fixture customer.");
    const sarahAfter = selectCustomers(after).find((customer) => customer.id === "customer-sarah");

    expect(selectDashboard(after).activeOrders).toHaveLength(dashboardBefore.activeOrders.length + 1);
    expect(selectOrders(after)).toHaveLength(ordersBefore.length + 1);
    expect(selectProduction(after).tasks.length).toBeGreaterThan(productionBefore.tasks.length);
    expect(selectInventory(after).requirements.reduce((total, line) => total + line.required, 0)).toBeGreaterThan(
      inventoryBefore.requirements.reduce((total, line) => total + line.required, 0),
    );
    expect(sarahAfter?.orderCount).toBe(sarahBefore.orderCount + 1);
    expect(selectFinances(after).revenue).toBe(financesBefore.revenue + 14);
  });

  it("commits a completed task and its inventory result only once", async () => {
    const { controller, snapshot: before } = await loadedController();
    const completedBefore = selectDashboard(before).completedTaskCount;
    await controller.updateTask({ bakeryId: earls, operationId: "state-complete-task", taskId: "order-025-1-mix", patch: { status: "completed" } });
    const once = selectSnapshot(controller.getState());
    if (!once) throw new Error("Expected a committed snapshot.");
    const transactionCount = selectInventory(once).transactions.length;
    await controller.updateTask({ bakeryId: earls, operationId: "state-complete-task", taskId: "order-025-1-mix", patch: { status: "completed" } });
    const retried = selectSnapshot(controller.getState());
    if (!retried) throw new Error("Expected a committed retry snapshot.");

    expect(selectProduction(once).tasks.find((task) => task.id === "order-025-1-mix")?.status).toBe("completed");
    expect(selectDashboard(once).completedTaskCount).toBe(completedBefore + 1);
    expect(transactionCount).toBeGreaterThan(0);
    expect(selectInventory(retried).transactions).toHaveLength(transactionCount);
  });

  it("commits an authoritative order status transition and preserves state when it fails", async () => {
    const { controller } = await loadedController();
    await controller.transitionOrderStatus({ bakeryId: earls, operationId: "state-transition-order", orderId: "order-025", expectedStatus: "confirmed", targetStatus: "in-production" });
    const transitioned = selectSnapshot(controller.getState());
    if (!transitioned) throw new Error("Expected a transitioned snapshot.");

    await controller.transitionOrderStatus({ bakeryId: earls, operationId: "state-transition-order-invalid", orderId: "order-025", expectedStatus: "in-production", targetStatus: "completed" });
    const afterFailure = selectSnapshot(controller.getState());

    expect(transitioned.ordersById["order-025"].status).toBe("in-production");
    expect(afterFailure).toEqual(transitioned);
    expect(selectMutationState(controller.getState(), "state-transition-order-invalid")).toMatchObject({ status: "error", error: { kind: "validation" } });
  });

  it("commits a created recipe to the current snapshot without a reload", async () => {
    const { controller } = await loadedController();
    const recipe = {
      id: "recipe-state-created",
      name: "State Test Recipe",
      yield: "1 loaf",
      batchCost: 2,
      sellingPrice: 8,
      flowId: null,
      ingredients: [],
      archived: false,
      marginPercent: 75,
    };

    const result = await controller.createRecipe({
      bakeryId: earls,
      operationId: "state-create-recipe",
      recipeId: recipe.id,
      name: recipe.name,
      yield: recipe.yield,
      sellingPrice: recipe.sellingPrice,
      flowId: recipe.flowId,
      ingredients: recipe.ingredients,
    });
    const after = selectSnapshot(controller.getState());

    expect(result).toMatchObject({
      ok: true,
      data: { changes: { recipes: [{ id: recipe.id, name: recipe.name, batchCost: 0, marginPercent: 100 }] } },
    });
    expect(after?.recipesById[recipe.id]).toMatchObject({ id: recipe.id, name: recipe.name, batchCost: 0, marginPercent: 100 });

    const updateResult = await controller.updateRecipe({
      bakeryId: earls,
      operationId: "state-update-recipe",
      recipeId: recipe.id,
      name: "Updated State Test Recipe",
      yield: "2 loaves",
      sellingPrice: 10,
      flowId: null,
      ingredients: [],
    });
    const afterUpdate = selectSnapshot(controller.getState());

    expect(updateResult).toMatchObject({
      ok: true,
      data: { changes: { recipes: [{ id: recipe.id, name: "Updated State Test Recipe", yield: "2 loaves", sellingPrice: 10 }] } },
    });
    expect(afterUpdate?.recipesById[recipe.id]).toMatchObject({ name: "Updated State Test Recipe", yield: "2 loaves", sellingPrice: 10 });
  });

  it("commits an authoritative full-balance payment without changing order status", async () => {
    const { controller } = await loadedController();
    const result = await controller.markOrderPaid({ bakeryId: earls, operationId: "state-pay-order", orderId: "order-025" });
    const after = selectSnapshot(controller.getState());

    expect(result).toMatchObject({ ok: true, data: { kind: "order-marked-paid" } });
    expect(after?.ordersById["order-025"]).toMatchObject({ total: 22, paid: 22, paymentStatus: "paid", status: "confirmed" });
  });

  it("does not partially commit a failed mutation", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter({ failures: { "create-order": { kind: "unknown", message: "Unavailable", retryable: true } } });
    const controller = createBakeryDomainController(adapter);
    await controller.load(earls);
    const before = selectSnapshot(controller.getState());
    if (!before) throw new Error("Expected fixture snapshot.");
    await controller.createOrder({ bakeryId: earls, operationId: "failed-order", orderId: "order-failed", customerId: "customer-sarah", pickupDate: "2026-08-04", pickupTime: "10:00", paid: 0, items: [{ recipeId: "recipe-sourdough", quantity: 1, unitPrice: 14 }] });
    const after = selectSnapshot(controller.getState());

    expect(after).toEqual(before);
    expect(selectMutationState(controller.getState(), "failed-order")).toMatchObject({ status: "error", error: { kind: "unknown" } });
  });

  it("clears the old bakery snapshot before loading the next bakery", async () => {
    const { controller } = await loadedController();
    const loading = controller.load(FIXTURE_BAKERY_IDS.MARINA);
    expect(selectSnapshot(controller.getState())).toBeUndefined();
    expect(controller.getState().resource).toMatchObject({ status: "loading", bakeryId: FIXTURE_BAKERY_IDS.MARINA });
    await loading;

    const marina = selectSnapshot(controller.getState());
    expect(marina?.bakeryId).toBe(FIXTURE_BAKERY_IDS.MARINA);
    expect(marina?.ordersById["order-024"]).toBeUndefined();
  });

  it("commits and deletes authoritative production-flow changes", async () => {
    const { controller, snapshot: before } = await loadedController();
    const flow: DomainProductionFlow = {
      id: "state-custom-flow",
      name: "State custom flow",
      recipe: "Sourdough",
      isDefault: false,
      steps: [],
    };

    const saved = await controller.saveProductionFlow({ bakeryId: earls, operationId: "state-save-flow", flow });
    expect(saved).toMatchObject({ ok: true, data: { changes: { flows: [flow] } } });
    expect(controller.getState().resource).toMatchObject({ data: { flowsById: { "state-custom-flow": flow } } });

    await controller.load(earls);
    expect(controller.getState().resource).toMatchObject({ data: { flowsById: { "state-custom-flow": flow } } });

    const deleted = await controller.deleteProductionFlow({ bakeryId: earls, operationId: "state-delete-flow", flowId: flow.id });
    expect(deleted).toMatchObject({ ok: true, data: { changes: { deletedFlowIds: [flow.id] } } });
    expect(controller.getState().resource).toMatchObject({ data: { flowsById: { ...before.flowsById } } });
  });

  it("ignores a flow mutation that resolves after switching bakeries", async () => {
    const baseAdapter = createSessionLocalBakeryDomainAdapter();
    let resolveSave: (result: { ok: true; data: ProductionFlowResult }) => void = () => undefined;
    const pendingSave = new Promise<{ ok: true; data: ProductionFlowResult }>((resolve) => {
      resolveSave = resolve;
    });
    const adapter = { ...baseAdapter, saveProductionFlow: () => pendingSave };
    const controller = createBakeryDomainController(adapter);
    await controller.load(earls);
    const saving = controller.saveProductionFlow({
      bakeryId: earls,
      operationId: "state-stale-flow",
      flow: { id: "state-stale-flow", name: "Stale flow", recipe: "", isDefault: false, steps: [] },
    });

    await controller.load(FIXTURE_BAKERY_IDS.MARINA);
    resolveSave({
      ok: true,
      data: {
        kind: "production-flow-mutated",
        operationId: "state-stale-flow",
        changes: { flows: [{ id: "state-stale-flow", name: "Stale flow", recipe: "", isDefault: false, steps: [] }] },
      },
    });
    await saving;

    expect(selectSnapshot(controller.getState())?.bakeryId).toBe(FIXTURE_BAKERY_IDS.MARINA);
    expect(selectSnapshot(controller.getState())?.flowsById["state-stale-flow"]).toBeUndefined();
  });
});
