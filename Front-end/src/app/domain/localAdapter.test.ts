import { describe, expect, it } from "vitest";
import { FIXTURE_BAKERY_IDS } from "./fixtures";
import { createSessionLocalBakeryDomainAdapter, calculateRecipeMargin } from "./localAdapter";

const earls = FIXTURE_BAKERY_IDS.EARLS;

describe("session-local bakery domain adapter", () => {
  it("records package receiving and physical counts as retry-safe inventory events", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const received = await adapter.restockInventory({
      bakeryId: earls,
      operationId: "receive-flour-once",
      itemId: "flour",
      quantityAdded: 75000,
      unitCost: 0.004,
      notes: "Three 25kg bags",
    });
    const retried = await adapter.restockInventory({
      bakeryId: earls,
      operationId: "receive-flour-once",
      itemId: "flour",
      quantityAdded: 75000,
      unitCost: 0.004,
      notes: "Three 25kg bags",
    });
    const counted = await adapter.adjustInventory({
      bakeryId: earls,
      operationId: "count-flour-once",
      itemId: "flour",
      newOnHand: 74000,
      notes: "Physical count",
    });
    const loaded = await adapter.loadSnapshot({ bakeryId: earls });

    expect(received).toEqual(retried);
    expect(received).toMatchObject({ ok: true, data: { changes: { inventoryItems: [{ onHand: 75800 }] } } });
    expect(counted).toMatchObject({ ok: true, data: { changes: { inventoryItems: [{ onHand: 74000 }], inventoryTransactions: [{ quantityChange: -1800 }] } } });
    expect(loaded).toMatchObject({ ok: true, data: { inventoryById: { flour: { onHand: 74000 } } } });
  });

  it("loads known and newly created session-local bakeries from isolated fixture snapshots", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const loaded = await adapter.loadSnapshot({ bakeryId: earls });
    const createdBakery = await adapter.loadSnapshot({ bakeryId: "bakery-created" });

    expect(loaded).toMatchObject({ ok: true, data: { bakeryId: earls } });
    expect(createdBakery).toMatchObject({ ok: true, data: { bakeryId: "bakery-created" } });
    if (loaded.ok && createdBakery.ok) {
      expect(createdBakery.data.ordersById).toEqual(loaded.data.ordersById);
      expect(createdBakery.data).not.toBe(loaded.data);
    }
  });

  it("keeps mutations in one bakery's session snapshot", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const before = await adapter.loadSnapshot({ bakeryId: FIXTURE_BAKERY_IDS.MARINA });
    const created = await adapter.createOrder({
      bakeryId: earls, operationId: "create-earls-order", orderId: "order-local-001", customerId: "customer-sarah",
      pickupDate: "2026-08-04", pickupTime: "10:00", paid: 0, items: [{ recipeId: "recipe-sourdough", quantity: 1, unitPrice: 14 }],
    });
    const after = await adapter.loadSnapshot({ bakeryId: FIXTURE_BAKERY_IDS.MARINA });

    expect(created).toMatchObject({ ok: true, data: { kind: "order-created" } });
    expect(before).toEqual(after);
  });

  it("keeps typed connection failures distinct from ordinary failures", async () => {
    const connectionAdapter = createSessionLocalBakeryDomainAdapter({ failures: { "load-snapshot": { kind: "connection", message: "Offline", retryable: true } } });
    const unknownAdapter = createSessionLocalBakeryDomainAdapter({ failures: { "load-snapshot": { kind: "unknown", message: "Service failed", retryable: false } } });

    await expect(connectionAdapter.loadSnapshot({ bakeryId: earls })).resolves.toMatchObject({ ok: false, error: { kind: "connection", retryable: true } });
    await expect(unknownAdapter.loadSnapshot({ bakeryId: earls })).resolves.toMatchObject({ ok: false, error: { kind: "unknown", retryable: false } });
  });

  it("deduplicates repeated order and completed-task operation IDs", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const orderInput = {
      bakeryId: earls, operationId: "create-once", orderId: "order-local-once", customerId: "customer-sarah",
      pickupDate: "2026-08-04", pickupTime: "10:00", paid: 0, items: [{ recipeId: "recipe-focaccia", quantity: 2, unitPrice: 8 }],
    } as const;
    const firstOrder = await adapter.createOrder(orderInput);
    const repeatedOrder = await adapter.createOrder(orderInput);
    const firstTask = await adapter.updateTask({ bakeryId: earls, operationId: "complete-once", taskId: "order-025-1-mix", patch: { status: "completed" } });
    const repeatedTask = await adapter.updateTask({ bakeryId: earls, operationId: "complete-once", taskId: "order-025-1-mix", patch: { status: "completed" } });
    const loaded = await adapter.loadSnapshot({ bakeryId: earls });

    expect(firstOrder).toEqual(repeatedOrder);
    expect(firstTask).toEqual(repeatedTask);
    expect(loaded).toMatchObject({ ok: true });
    if (loaded.ok) {
      expect(Object.keys(loaded.data.ordersById).filter((id) => id === "order-local-once")).toHaveLength(1);
      expect(Object.values(loaded.data.inventoryTransactionsById).length).toBeGreaterThan(0);
    }
  });

  it("advances orders sequentially and safely returns the same result on a retried operation", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const input = { bakeryId: earls, operationId: "transition-order-025", orderId: "order-025", expectedStatus: "confirmed", targetStatus: "in-production" } as const;

    const first = await adapter.transitionOrderStatus(input);
    const retried = await adapter.transitionOrderStatus(input);
    const ready = await adapter.transitionOrderStatus({ bakeryId: earls, operationId: "transition-order-025-ready", orderId: "order-025", expectedStatus: "in-production", targetStatus: "ready" });
    const completed = await adapter.transitionOrderStatus({ bakeryId: earls, operationId: "transition-order-025-completed", orderId: "order-025", expectedStatus: "ready", targetStatus: "completed" });

    expect(first).toEqual(retried);
    expect(first).toMatchObject({ ok: true, data: { kind: "order-status-transitioned", changes: { orders: [{ id: "order-025", status: "in-production" }] } } });
    expect(ready).toMatchObject({ ok: true, data: { changes: { orders: [{ status: "ready" }] } } });
    expect(completed).toMatchObject({ ok: true, data: { changes: { orders: [{ status: "completed" }] } } });
  });

  it("rejects skipped, repeated, backward, and cross-bakery order transitions without changing either snapshot", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const before = await adapter.loadSnapshot({ bakeryId: earls });
    const marinaBefore = await adapter.loadSnapshot({ bakeryId: FIXTURE_BAKERY_IDS.MARINA });
    if (!before.ok || !marinaBefore.ok) throw new Error("Expected fixture snapshots.");

    const skipped = await adapter.transitionOrderStatus({ bakeryId: earls, operationId: "skip-order-025", orderId: "order-025", expectedStatus: "confirmed", targetStatus: "ready" });
    const backward = await adapter.transitionOrderStatus({ bakeryId: earls, operationId: "backward-order-026", orderId: "order-026", expectedStatus: "ready", targetStatus: "in-production" });
    const repeated = await adapter.transitionOrderStatus({ bakeryId: earls, operationId: "repeat-order-027", orderId: "order-027", expectedStatus: "completed", targetStatus: "completed" });
    const crossBakery = await adapter.transitionOrderStatus({ bakeryId: FIXTURE_BAKERY_IDS.MARINA, operationId: "cross-bakery-order", orderId: "order-025", expectedStatus: "confirmed", targetStatus: "in-production" });
    const after = await adapter.loadSnapshot({ bakeryId: earls });
    const marinaAfter = await adapter.loadSnapshot({ bakeryId: FIXTURE_BAKERY_IDS.MARINA });

    expect(skipped).toMatchObject({ ok: false, error: { kind: "validation", field: "targetStatus" } });
    expect(backward).toMatchObject({ ok: false, error: { kind: "validation", field: "targetStatus" } });
    expect(repeated).toMatchObject({ ok: false, error: { kind: "validation", field: "targetStatus" } });
    expect(crossBakery).toMatchObject({ ok: false, error: { kind: "validation", field: "orderId" } });
    expect(after).toEqual(before);
    expect(marinaAfter).toEqual(marinaBefore);
  });

  it("marks the full order balance paid idempotently and keeps bakery scope", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const input = { bakeryId: earls, operationId: "pay-order-025", orderId: "order-025" } as const;
    const first = await adapter.markOrderPaid(input);
    const retried = await adapter.markOrderPaid(input);
    const crossBakery = await adapter.markOrderPaid({ bakeryId: FIXTURE_BAKERY_IDS.MARINA, operationId: "cross-bakery-payment", orderId: "order-025" });

    expect(first).toEqual(retried);
    expect(first).toMatchObject({ ok: true, data: { kind: "order-marked-paid", changes: { orders: [{ id: "order-025", total: 22, paid: 22, paymentStatus: "paid", status: "confirmed" }] } } });
    expect(crossBakery).toMatchObject({ ok: false, error: { kind: "validation", field: "orderId" } });
  });

  it("calculates cost per base unit and updates stock levels on movement", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const pkgPrice = 15.0;
    const pkgQty = 5000;
    const costPerUnit = pkgPrice / pkgQty;
    expect(costPerUnit).toBeCloseTo(0.003, 3);

    const created = await adapter.createIngredient!({
      bakeryId: earls, operationId: "create-flour", ingredientId: "ing-flour-organic",
      name: "Organic Flour", unit: "g", packageQuantity: pkgQty, packagePrice: pkgPrice, minLevel: 1000, kind: "ingredient",
    });
    expect(created).toMatchObject({ ok: true, data: { kind: "ingredient-created" } });
    const createdSnapshot = await adapter.loadSnapshot({ bakeryId: earls });
    expect(createdSnapshot).toMatchObject({ ok: true, data: { inventoryById: { "ing-flour-organic": { onHand: 0, packageQuantity: pkgQty, packagePrice: pkgPrice, unitCost: costPerUnit } } } });

    const moved = await adapter.recordMovement!({
      bakeryId: earls, operationId: "restock-flour", movementId: "mov-001",
      ingredientId: "ing-flour-organic", quantityChange: 2000, reason: "restock",
    });
    expect(moved).toMatchObject({ ok: true, data: { kind: "movement-recorded" } });
  });

  it("creates a recipe, computes batch cost dynamically, and calculates margin %", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    // Create an ingredient with known package pricing ($10 for 5000g -> $0.002/g)
    await adapter.createIngredient!({
      bakeryId: earls,
      operationId: "create-butter",
      ingredientId: "ing-butter",
      name: "Unsalted Butter",
      unit: "g",
      packageQuantity: 5000,
      packagePrice: 10.0,
      minLevel: 500,
      kind: "ingredient",
    });

    const createRes = await adapter.createRecipe({
      bakeryId: earls,
      operationId: "create-croissant",
      recipeId: "recipe-croissant",
      name: "Butter Croissant",
      yield: "12 croissants",
      sellingPrice: 20.0,
      flowId: "flow-sourdough",
      ingredients: [
        { inventoryItemId: "ing-butter", quantity: 1000 }, // 1000 * 0.002 = $2.00
      ],
    });

    expect(createRes.ok).toBe(true);
    if (createRes.ok) {
      expect(createRes.data.kind).toBe("recipe-mutated");
      const recipe = createRes.data.changes.recipes?.[0];
      expect(recipe).toBeDefined();
      expect(recipe?.batchCost).toBe(2.0);
      expect(recipe?.marginPercent).toBe(90.0); // ((20 - 2) / 20) * 100 = 90%
      expect(recipe?.archived).toBe(false);
    }

    const snapshotRes = await adapter.loadSnapshot({ bakeryId: earls });
    expect(snapshotRes.ok).toBe(true);
    if (snapshotRes.ok) {
      expect(snapshotRes.data.recipesById["recipe-croissant"]).toBeDefined();
    }
  });

  it("updates recipe details and recalculates batch cost and margin", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const updateRes = await adapter.updateRecipe({
      bakeryId: earls,
      operationId: "update-sourdough-price",
      recipeId: "recipe-sourdough",
      sellingPrice: 20.0,
    });

    expect(updateRes.ok).toBe(true);
    if (updateRes.ok) {
      const recipe = updateRes.data.changes.recipes?.[0];
      expect(recipe?.sellingPrice).toBe(20.0);
      // Batch cost of sourdough in fixture is 3.2. Margin: ((20 - 3.2) / 20) * 100 = 84%
      expect(recipe?.marginPercent).toBe(84.0);
    }
  });

  it("allows recipes to be created unassigned and clears a later flow assignment", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const created = await adapter.createRecipe({
      bakeryId: earls,
      operationId: "create-unassigned-recipe",
      recipeId: "recipe-unassigned",
      name: "Baguette",
      yield: "1 loaf",
      sellingPrice: 8,
      flowId: null,
      ingredients: [{ inventoryItemId: "flour", quantity: 500 }],
    });

    expect(created).toMatchObject({ ok: true, data: { changes: { recipes: [{ flowId: null }] } } });

    const cleared = await adapter.updateRecipe({
      bakeryId: earls,
      operationId: "clear-unassigned-recipe-flow",
      recipeId: "recipe-sourdough",
      flowId: null,
    });

    expect(cleared).toMatchObject({ ok: true, data: { changes: { recipes: [{ flowId: null }] } } });
  });

  it("duplicates an existing recipe with (Copy) appended to name", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const dupRes = await adapter.duplicateRecipe({
      bakeryId: earls,
      operationId: "dup-sourdough",
      recipeId: "recipe-sourdough",
      newRecipeId: "recipe-sourdough-v2",
    });

    expect(dupRes.ok).toBe(true);
    if (dupRes.ok) {
      const duplicated = dupRes.data.changes.recipes?.[0];
      expect(duplicated?.id).toBe("recipe-sourdough-v2");
      expect(duplicated?.name).toBe("Sourdough Loaf (Copy)");
      expect(duplicated?.yield).toBe("1 loaf · 850g");
      expect(duplicated?.archived).toBe(false);
    }
  });

  it("soft-archives and restores a recipe without deleting it", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const archiveRes = await adapter.archiveRecipe({
      bakeryId: earls,
      operationId: "archive-sourdough",
      recipeId: "recipe-sourdough",
    });
    expect(archiveRes.ok).toBe(true);
    if (archiveRes.ok) {
      expect(archiveRes.data.changes.recipes?.[0].archived).toBe(true);
    }

    let snapshotRes = await adapter.loadSnapshot({ bakeryId: earls });
    if (snapshotRes.ok) {
      expect(snapshotRes.data.recipesById["recipe-sourdough"].archived).toBe(true);
    }

    const restoreRes = await adapter.restoreRecipe({
      bakeryId: earls,
      operationId: "restore-sourdough",
      recipeId: "recipe-sourdough",
    });
    expect(restoreRes.ok).toBe(true);
    if (restoreRes.ok) {
      expect(restoreRes.data.changes.recipes?.[0].archived).toBe(false);
    }

    snapshotRes = await adapter.loadSnapshot({ bakeryId: earls });
    if (snapshotRes.ok) {
      expect(snapshotRes.data.recipesById["recipe-sourdough"].archived).toBe(false);
    }
  });

  it("creates a customer, supports idempotency retries, and allows customer lookup", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const input = {
      bakeryId: earls,
      operationId: "create-customer-001",
      customerId: "customer-test-01",
      name: "Alice Smith",
      email: "alice@example.com",
      phone: "555-0199",
      type: "wholesale" as const,
      address: "123 Main St",
      notes: "Weekly wholesale orders",
    };

    const createRes = await adapter.createCustomer(input);
    expect(createRes.ok).toBe(true);
    if (createRes.ok) {
      expect(createRes.data.kind).toBe("customer-mutated");
      const customer = createRes.data.changes.customers?.[0];
      expect(customer).toBeDefined();
      expect(customer?.id).toBe("customer-test-01");
      expect(customer?.name).toBe("Alice Smith");
      expect(customer?.email).toBe("alice@example.com");
      expect(customer?.type).toBe("wholesale");
    }

    // Safe idempotency retry returns cached result
    const retryRes = await adapter.createCustomer(input);
    expect(retryRes).toEqual(createRes);

    // Customer lookup via snapshot
    const snapshotRes = await adapter.loadSnapshot({ bakeryId: earls });
    expect(snapshotRes.ok).toBe(true);
    if (snapshotRes.ok) {
      const found = snapshotRes.data.customersById["customer-test-01"];
      expect(found).toBeDefined();
      expect(found.name).toBe("Alice Smith");
      expect(found.type).toBe("wholesale");
    }
  });

  it("updates customer details and supports idempotency retries", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const updateInput = {
      bakeryId: earls,
      operationId: "update-sarah-001",
      customerId: "customer-sarah",
      notes: "Updated delivery instructions",
      type: "retail" as const,
    };

    const updateRes = await adapter.updateCustomer(updateInput);
    expect(updateRes.ok).toBe(true);
    if (updateRes.ok) {
      expect(updateRes.data.kind).toBe("customer-mutated");
      const updated = updateRes.data.changes.customers?.[0];
      expect(updated?.id).toBe("customer-sarah");
      expect(updated?.notes).toBe("Updated delivery instructions");
      expect(updated?.name).toBe("Sarah Mitchell");
    }

    // Safe idempotency retry returns cached result
    const retryRes = await adapter.updateCustomer(updateInput);
    expect(retryRes).toEqual(updateRes);

    // Verification via lookup
    const snapshotRes = await adapter.loadSnapshot({ bakeryId: earls });
    expect(snapshotRes.ok).toBe(true);
    if (snapshotRes.ok) {
      expect(snapshotRes.data.customersById["customer-sarah"].notes).toBe("Updated delivery instructions");
    }
  });

  it("loads default fixture invoices and payment methods for active bakery workspace", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const loaded = await adapter.loadSnapshot({ bakeryId: earls });
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.invoicesById).toBeDefined();
      expect(Object.keys(loaded.data.invoicesById ?? {})).toContain("inv-earls-001");
      expect(loaded.data.paymentMethodsById).toBeDefined();
      expect(Object.keys(loaded.data.paymentMethodsById ?? {})).toContain("pm-earls-zelle");
    }
  });

  it("verifies invoice total calculation (subtotal + tax - discount)", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const createRes = await adapter.createInvoice({
      bakeryId: earls,
      operationId: "create-inv-total-calc",
      invoiceId: "inv-calc-001",
      customerId: "customer-sarah",
      dueDate: "2026-08-15",
      items: [
        { description: "Special Cake", quantity: 2, unitPriceCents: 5000 },
      ],
      taxCents: 800,
      discountCents: 500,
      notes: "Custom celebration order",
    });

    expect(createRes.ok).toBe(true);
    if (createRes.ok) {
      const inv = createRes.data.changes.invoices?.[0];
      expect(inv).toBeDefined();
      expect(inv?.subtotalCents).toBe(10000);
      expect(inv?.taxCents).toBe(800);
      expect(inv?.discountCents).toBe(500);
      expect(inv?.totalCents).toBe(10300);
      expect(inv?.amountPaidCents).toBe(0);
      expect(inv?.balanceCents).toBe(10300);
      expect(inv?.status).toBe("Draft");
      expect(inv?.publicToken).toMatch(/^tok_/);
    }
  });

  it("verifies partial payment balance reduction and status change to 'Partially paid' then 'Paid'", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const createRes = await adapter.createInvoice({
      bakeryId: earls,
      operationId: "create-inv-payment-flow",
      invoiceId: "inv-flow-001",
      customerId: "customer-james",
      dueDate: "2026-08-20",
      items: [
        { description: "Sourdough Batch", quantity: 10, unitPriceCents: 1000 },
      ],
    });
    expect(createRes.ok).toBe(true);

    const partialPayRes = await adapter.recordPayment({
      bakeryId: earls,
      operationId: "pay-partial-40",
      paymentId: "pay-001",
      invoiceId: "inv-flow-001",
      paymentMethodType: "zelle",
      amountCents: 4000,
      paymentDate: "2026-08-01",
      referenceNumber: "ZEL-12345",
    });

    expect(partialPayRes.ok).toBe(true);
    if (partialPayRes.ok) {
      const inv = partialPayRes.data.changes.invoices?.[0];
      expect(inv?.amountPaidCents).toBe(4000);
      expect(inv?.balanceCents).toBe(6000);
      expect(inv?.status).toBe("Partially paid");
      const pay = partialPayRes.data.changes.payments?.[0];
      expect(pay?.amountCents).toBe(4000);
      expect(pay?.paymentMethodType).toBe("zelle");
    }

    const fullPayRes = await adapter.recordPayment({
      bakeryId: earls,
      operationId: "pay-full-60",
      paymentId: "pay-002",
      invoiceId: "inv-flow-001",
      paymentMethodType: "cash",
      amountCents: 6000,
      paymentDate: "2026-08-02",
    });

    expect(fullPayRes.ok).toBe(true);
    if (fullPayRes.ok) {
      const inv = fullPayRes.data.changes.invoices?.[0];
      expect(inv?.amountPaidCents).toBe(10000);
      expect(inv?.balanceCents).toBe(0);
      expect(inv?.status).toBe("Paid");
    }
  });

  it("creates invoice from an existing order and supports cancellation and payment method updates", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const createRes = await adapter.createInvoice({
      bakeryId: earls,
      operationId: "create-inv-from-order",
      invoiceId: "inv-order-026",
      customerId: "customer-reed",
      orderId: "order-026",
      dueDate: "2026-08-10",
    });

    expect(createRes.ok).toBe(true);
    if (createRes.ok) {
      const inv = createRes.data.changes.invoices?.[0];
      expect(inv?.orderId).toBe("order-026");
      expect(inv?.items.length).toBeGreaterThan(0);
      expect(inv?.totalCents).toBe(5600);
    }

    const cancelRes = await adapter.cancelInvoice({
      bakeryId: earls,
      operationId: "cancel-inv-order-026",
      invoiceId: "inv-order-026",
      reason: "Customer requested cancellation",
    });

    expect(cancelRes.ok).toBe(true);
    if (cancelRes.ok) {
      expect(cancelRes.data.changes.invoices?.[0].status).toBe("Cancelled");
    }

    const updatePmRes = await adapter.updatePaymentMethods({
      bakeryId: earls,
      operationId: "update-pms",
      paymentMethods: [
        {
          id: "pm-earls-custom",
          bakeryId: earls,
          methodType: "custom",
          name: "Venmo",
          instructions: "@earlsbakery",
          isEnabled: true,
          requiresManualConfirmation: false,
        },
      ],
    });

    expect(updatePmRes.ok).toBe(true);
    if (updatePmRes.ok) {
      expect(updatePmRes.data.changes.paymentMethods?.[0].name).toBe("Venmo");
    }
  });

  it("fetches storefront by slug and returns products, pickup windows, and closed dates", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const res = await adapter.getStorefrontBySlug("jadore-bakery");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.storefront.slug).toBe("jadore-bakery");
      expect(res.data.storefront.name).toBe("J'adore Bakery");
      expect(res.data.products.length).toBeGreaterThan(0);
      expect(res.data.pickupWindows.length).toBeGreaterThan(0);
      expect(res.data.closedDates).toBeDefined();
    }

    const missingRes = await adapter.getStorefrontBySlug("unknown-bakery-slug");
    expect(missingRes.ok).toBe(false);
  });

  it("publishes a recipe to storefront with a custom online price and public details", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const publishRes = await adapter.publishRecipeToStorefront({
      bakeryId: earls,
      operationId: "pub-sourdough-001",
      recipeId: "recipe-sourdough",
      publicName: "Grand Artisanal Sourdough",
      publicDescription: "Freshly baked handcrafted sourdough loaf.",
      onlinePriceCents: 1600,
      isPublished: true,
    });

    expect(publishRes.ok).toBe(true);
    if (publishRes.ok) {
      expect(publishRes.data.kind).toBe("storefront-mutated");
      const prod = publishRes.data.changes.storefrontProducts?.[0];
      expect(prod).toBeDefined();
      expect(prod?.publicName).toBe("Grand Artisanal Sourdough");
      expect(prod?.onlinePriceCents).toBe(1600);
      expect(prod?.isPublished).toBe(true);
    }

    const storeRes = await adapter.getStorefrontBySlug("earls-bakery");
    expect(storeRes.ok).toBe(true);
    if (storeRes.ok) {
      const pubProd = storeRes.data.products.find((p) => p.recipeId === "recipe-sourdough");
      expect(pubProd?.publicName).toBe("Grand Artisanal Sourdough");
      expect(pubProd?.onlinePriceCents).toBe(1600);
    }
  });

  it("validates online checkout for lead-time, closed dates, and valid dates", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    // 1. Closed date check (2026-12-25 is configured closed in fixtures)
    const closedRes = await adapter.validateOnlineCheckout({
      slug: "earls-bakery",
      fulfillmentDate: "2026-12-25",
    });
    expect(closedRes.ok).toBe(true);
    if (closedRes.ok) {
      expect(closedRes.data.valid).toBe(false);
      expect(closedRes.data.code).toBe("CLOSED_DATE");
    }

    // 2. Lead-time blocked check (Today / past date within 24h lead time)
    const todayStr = new Date().toISOString().split("T")[0];
    const leadTimeRes = await adapter.validateOnlineCheckout({
      slug: "earls-bakery",
      fulfillmentDate: todayStr,
    });
    expect(leadTimeRes.ok).toBe(true);
    if (leadTimeRes.ok) {
      expect(leadTimeRes.data.valid).toBe(false);
      expect(leadTimeRes.data.code).toBe("LEAD_TIME_VIOLATION");
    }

    // 3. Valid date check (Future date e.g. 10 days out)
    const futureDate = new Date(Date.now() + 10 * 86400 * 1000).toISOString().split("T")[0];
    const validRes = await adapter.validateOnlineCheckout({
      slug: "earls-bakery",
      fulfillmentDate: futureDate,
    });
    expect(validRes.ok).toBe(true);
    if (validRes.ok) {
      expect(validRes.data.valid).toBe(true);
    }
  });

  it("submits an online order, matches customer, and generates production tasks atomically", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const futureDate = new Date(Date.now() + 10 * 86400 * 1000).toISOString().split("T")[0];
    const submitRes = await adapter.submitOnlineOrder({
      slug: "earls-bakery",
      customerName: "Jane Online",
      customerEmail: "jane.online@example.com",
      customerPhone: "555-0987",
      fulfillmentType: "pickup",
      fulfillmentDate: futureDate,
      fulfillmentTimeWindow: "10:00",
      items: [
        { productId: "sf-prod-sourdough", quantity: 2, unitPriceCents: 1400 },
        { productId: "sf-prod-focaccia", quantity: 1, unitPriceCents: 800 },
      ],
      notes: "Online pickup request",
      operationId: "op-online-submit-001",
    });

    expect(submitRes.ok).toBe(true);
    if (submitRes.ok) {
      expect(submitRes.data.kind).toBe("online-order-submitted");
      expect(submitRes.data.orderId).toBeDefined();
      expect(submitRes.data.customerId).toBeDefined();
      expect(submitRes.data.changes.orders?.length).toBe(1);
      expect(submitRes.data.changes.orderItems?.length).toBe(2);
      expect(submitRes.data.changes.tasks?.length).toBeGreaterThan(0);

      const order = submitRes.data.changes.orders?.[0];
      expect(order?.total).toBe(36);
      expect(order?.status).toBe("confirmed");
      expect(order?.pickupDate).toBe(futureDate);

      const tasks = submitRes.data.changes.tasks;
      expect(tasks?.some((t) => t.product.includes("Sourdough") || t.product.includes("Focaccia"))).toBe(true);
    }

    const snapshotRes = await adapter.loadSnapshot({ bakeryId: earls });
    expect(snapshotRes.ok).toBe(true);
    if (snapshotRes.ok) {
      const createdOrderId = submitRes.ok ? submitRes.data.orderId : "";
      expect(snapshotRes.data.ordersById[createdOrderId]).toBeDefined();
    }
  });

  it("saves and deletes custom production flows in local adapter snapshot", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const customFlow = {
      id: "flow-custom-ciabatta",
      name: "Ciabatta Flow",
      recipe: "Ciabatta",
      steps: [
        { id: "c1", name: "Autolyse", instructions: "Mix flour and water", dayOffset: -1, time: "08:00", duration: 30, category: "prep", enabled: true },
        { id: "c2", name: "Bake", instructions: "Bake high temp", dayOffset: 0, time: "09:00", duration: 25, category: "baking", enabled: true, dependsOn: "c1" },
      ],
    };

    const saveRes = await adapter.saveProductionFlow({
      bakeryId: earls,
      operationId: "op-save-flow-001",
      flow: customFlow,
    });

    expect(saveRes.ok).toBe(true);
    if (saveRes.ok) {
      expect(saveRes.data.kind).toBe("production-flow-mutated");
      expect(saveRes.data.changes.flows?.[0].id).toBe("flow-custom-ciabatta");
    }

    const loadedSnapshot = await adapter.loadSnapshot({ bakeryId: earls });
    expect(loadedSnapshot.ok).toBe(true);
    if (loadedSnapshot.ok) {
      expect(loadedSnapshot.data.flowsById["flow-custom-ciabatta"]).toEqual(customFlow);
    }

    const deleteRes = await adapter.deleteProductionFlow({
      bakeryId: earls,
      operationId: "op-del-flow-001",
      flowId: "flow-custom-ciabatta",
    });
    expect(deleteRes.ok).toBe(true);

    const snapshotAfterDelete = await adapter.loadSnapshot({ bakeryId: earls });
    if (snapshotAfterDelete.ok) {
      expect(snapshotAfterDelete.data.flowsById["flow-custom-ciabatta"]).toBeUndefined();
    }
  });

  it("deducts inventory stock on task completion and prevents duplicate deductions", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const snap1 = await adapter.loadSnapshot({ bakeryId: earls });
    expect(snap1.ok).toBe(true);
    if (!snap1.ok) return;
    const initialFlour = snap1.data.inventoryById["flour"].onHand;

    const res1 = await adapter.updateTask({
      bakeryId: earls,
      operationId: "complete-mix-task-deduct",
      taskId: "order-025-1-mix",
      patch: { status: "completed" },
    });

    expect(res1.ok).toBe(true);
    if (res1.ok) {
      expect(res1.data.changes.inventoryTransactions?.length).toBeGreaterThan(0);
      expect(res1.data.changes.inventoryItems?.length).toBeGreaterThan(0);
    }

    const snap2 = await adapter.loadSnapshot({ bakeryId: earls });
    expect(snap2.ok).toBe(true);
    if (!snap2.ok) return;
    const updatedFlour = snap2.data.inventoryById["flour"].onHand;
    expect(updatedFlour).toBeLessThan(initialFlour);

    const res2 = await adapter.updateTask({
      bakeryId: earls,
      operationId: "complete-mix-task-retry-diff-op",
      taskId: "order-025-1-mix",
      patch: { status: "completed" },
    });

    expect(res2.ok).toBe(true);
    if (res2.ok) {
      expect(res2.data.changes.inventoryTransactions).toHaveLength(0);
    }

    const snap3 = await adapter.loadSnapshot({ bakeryId: earls });
    if (snap3.ok) {
      expect(snap3.data.inventoryById["flour"].onHand).toBe(updatedFlour);
    }
  });

  it("restocks inventory, updates on-hand balance, and records a restock transaction", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const snap1 = await adapter.loadSnapshot({ bakeryId: earls });
    expect(snap1.ok).toBe(true);
    if (!snap1.ok) return;
    const beforeFlour = snap1.data.inventoryById["flour"].onHand;

    const restockRes = await adapter.restockInventory({
      bakeryId: earls,
      operationId: "op-restock-flour-1000",
      itemId: "flour",
      quantityAdded: 1000,
      notes: "Arrived from supplier",
    });

    expect(restockRes.ok).toBe(true);
    if (restockRes.ok) {
      expect(restockRes.data.kind).toBe("inventory-mutated");
      const item = restockRes.data.changes.inventoryItems?.[0];
      expect(item?.onHand).toBe(beforeFlour + 1000);
      const tx = restockRes.data.changes.inventoryTransactions?.[0];
      expect(tx?.quantityChange).toBe(1000);
      expect(tx?.reason).toBe("restock");
    }

    const snap2 = await adapter.loadSnapshot({ bakeryId: earls });
    if (snap2.ok) {
      expect(snap2.data.inventoryById["flour"].onHand).toBe(beforeFlour + 1000);
    }
  });

  it("starts and stops task timers while recording elapsed execution seconds", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const startRes = await adapter.startTaskTimer!({
      bakeryId: earls,
      operationId: "start-timer-001",
      taskId: "order-025-1-mix",
    });

    expect(startRes.ok).toBe(true);
    if (startRes.ok) {
      const task = startRes.data.changes.tasks?.[0];
      expect(task?.timerRunning).toBe(true);
      expect(task?.timerStartedAt).toBeDefined();
      expect(task?.status).toBe("in-progress");
    }

    const stopRes = await adapter.stopTaskTimer!({
      bakeryId: earls,
      operationId: "stop-timer-001",
      taskId: "order-025-1-mix",
      elapsedSeconds: 120,
    });

    expect(stopRes.ok).toBe(true);
    if (stopRes.ok) {
      const task = stopRes.data.changes.tasks?.[0];
      expect(task?.timerRunning).toBe(false);
      expect(task?.timerStartedAt).toBeUndefined();
      expect(task?.elapsedSeconds).toBe(120);
    }
  });

  it("delays task scheduled time and accumulates delay minutes", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();
    const loaded = await adapter.loadSnapshot({ bakeryId: earls });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const initialTask = loaded.data.tasksById["order-025-1-mix"];
    const initialTime = new Date(initialTask.scheduledAt).getTime();

    const delayRes = await adapter.delayTask!({
      bakeryId: earls,
      operationId: "delay-task-15m",
      taskId: "order-025-1-mix",
      delayMinutes: 15,
    });

    expect(delayRes.ok).toBe(true);
    if (delayRes.ok) {
      const task = delayRes.data.changes.tasks?.[0];
      expect(task?.delayMinutes).toBe(15);
      const newTime = new Date(task!.scheduledAt).getTime();
      expect(newTime - initialTime).toBe(15 * 60 * 1000);
    }
  });

  it("skips a task and records the skip reason", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const skipRes = await adapter.skipTask!({
      bakeryId: earls,
      operationId: "skip-task-001",
      taskId: "order-025-1-mix",
      reason: "Equipment failure on mixer 2",
    });

    expect(skipRes.ok).toBe(true);
    if (skipRes.ok) {
      const task = skipRes.data.changes.tasks?.[0];
      expect(task?.status).toBe("skipped");
      expect(task?.skipReason).toBe("Equipment failure on mixer 2");
      expect(task?.timerRunning).toBe(false);
    }
  });

  it("supports delay and skip status in updateTask patch", async () => {
    const adapter = createSessionLocalBakeryDomainAdapter();

    const updateRes = await adapter.updateTask({
      bakeryId: earls,
      operationId: "patch-task-delay-skip",
      taskId: "order-025-1-mix",
      patch: {
        skipReason: "Ran out of yeast",
      },
    });

    expect(updateRes.ok).toBe(true);
    if (updateRes.ok) {
      const task = updateRes.data.changes.tasks?.[0];
      expect(task?.status).toBe("skipped");
      expect(task?.skipReason).toBe("Ran out of yeast");
    }
  });
});
