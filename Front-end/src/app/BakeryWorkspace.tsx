import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { DEFAULT_FLOWS, type ProductionFlow, type ProductionTask } from "./production";
import {
  buildStarterPlans,
  calculateRequirements,
  DEFAULT_INVENTORY,
  DEFAULT_STARTER_PROFILE,
  recordDeductions,
  type DeductionTrigger,
  type InventoryTransaction,
  type StarterBuildOverride,
  type StarterProfile,
} from "./planning";
import { createLocalBakeryAdapter } from "./domain/localAdapter";
import { BakeryDomainProvider, useBakeryDomain, useBakeryDomainSelector } from "./state/provider";
import { selectSnapshot } from "./state/selectors";
import { DirtyFormGuardProvider, UnsavedChangesDialog, useGuardedExit, useGuardedNavigate } from "./navigation/dirtyFormGuard";
import { WorkspaceRoutes } from "./navigation/WorkspaceRoutes";
import { workspacePath } from "./navigation/routeRegistry";
import type { BakeryDomainAdapter } from "./domain/types";
import type { AuthAdapter, AuthSession } from "./auth";
import type { BakeryMembership, WorkspaceAdapter } from "./workspace";
import type { Order, Task } from "./types";
import { ORDERS, planTasks } from "./constants";
import { Sidebar } from "./navigation/Sidebar";
import { ReturnToBakerySelectorDialog } from "./navigation/ReturnToBakerySelectorDialog";
import { BottomNav, FAB } from "./navigation/BottomNav";
import { AddOrderModal } from "./components/orders/AddOrderModal";
import type { Screen } from "./types";
import type { ManualOrderService, ManualOrderSnapshot } from "../lib/supabase/manualOrderAdapter";
import { createSupabaseCustomerAdapter } from "../lib/supabase/customerAdapter";
import type { OrderStatusTransition } from "./screens/OrdersScreen";

const LazyHomeScreen = lazy(() =>
  import("./screens/HomeScreen").then(module => ({ default: module.HomeScreen })),
);
const LazyOrdersScreen = lazy(() =>
  import("./screens/OrdersScreen").then(module => ({ default: module.OrdersScreen })),
);
const LazyProductionScreen = lazy(() =>
  import("./screens/ProductionScreen").then(module => ({ default: module.ProductionScreen })),
);
const LazyInventoryScreen = lazy(() =>
  import("./screens/InventoryScreen").then(module => ({ default: module.InventoryScreen })),
);
const LazyStarterScreen = lazy(() =>
  import("./screens/InventoryScreen").then(module => ({ default: module.StarterScreen })),
);
const LazyFinancesScreen = lazy(() =>
  import("./screens/FinancesScreen").then(module => ({ default: module.FinancesScreen })),
);
const LazyMoreScreen = lazy(() =>
  import("./screens/MoreScreen").then(module => ({ default: module.MoreScreen })),
);
const LazySettingsScreen = lazy(() =>
  import("./screens/SettingsScreen").then(module => ({ default: module.SettingsScreen })),
);
const LazyRecipeManager = lazy(() =>
  import("./components/recipes/RecipeManager").then(module => ({ default: module.RecipeManager })),
);
const LazyCustomerManager = lazy(() =>
  import("./components/customers/CustomerManager").then(module => ({ default: module.CustomerManager })),
);
const LazyPaymentSettings = lazy(() =>
  import("./components/invoicing/PaymentSettings").then(module => ({ default: module.PaymentSettings })),
);
const LazyInvoiceList = lazy(() =>
  import("./components/invoicing/InvoiceList").then(module => ({ default: module.InvoiceList })),
);
const LazyStorefrontDashboard = lazy(() =>
  import("./components/storefront/StorefrontDashboard").then(module => ({ default: module.StorefrontDashboard })),
);
const LazyAccountProfileScreen = lazy(() =>
  import("./AccountProfileScreen").then(module => ({ default: module.AccountProfileScreen })),
);

function FeatureScreenLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center px-6 py-12 text-sm font-semibold text-[#6F655E]" role="status" aria-live="polite">
      Loading workspace…
    </div>
  );
}

function BakeryWorkspaceInner({
  onLogout = () => undefined,
  activeMembership,
  memberships = [],
  onSwitch,
  onSetDefault,
  onManageStores,
  workspaceAdapter,
  adapter,
  session,
  authAdapter,
  manualOrderService,
}: {
  onLogout?: () => void;
  activeMembership?: BakeryMembership;
  memberships?: BakeryMembership[];
  onSwitch?: (membership: BakeryMembership) => void;
  onSetDefault?: (membership: BakeryMembership) => void;
  onManageStores?: () => void;
  workspaceAdapter?: WorkspaceAdapter;
  adapter?: BakeryDomainAdapter;
  session?: AuthSession | null;
  authAdapter?: AuthAdapter;
  manualOrderService?: ManualOrderService;
}) {
  const domainContext = useBakeryDomain();
  const snapshot = useBakeryDomainSelector(selectSnapshot);
  const invoices = snapshot?.invoicesById ? Object.values(snapshot.invoicesById) : undefined;
  const paymentMethods = snapshot?.paymentMethodsById ? Object.values(snapshot.paymentMethodsById) : undefined;
  const domainCustomers = snapshot?.customersById ? Object.values(snapshot.customersById) : undefined;
  const bakeryId = activeMembership?.bakeryId ?? "bakery-north";

  const location = useLocation();
  const navigate = useGuardedNavigate();
  const navigateRaw = useNavigate();
  const requestBakerySwitch = useGuardedExit("bakery-switch");
  const requestReturnToSelector = useGuardedExit("dismiss");
  const navigateToScreen = (screen: Screen) => navigate(workspacePath(screen));
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [manualOrderSnapshot, setManualOrderSnapshot] = useState<ManualOrderSnapshot | null>(null);
  const [manualOrderLoadError, setManualOrderLoadError] = useState("");
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [productionTasks, setProductionTasks] = useState<Task[]>(() => planTasks({ id: "#025", pickupDate: "2026-07-31", pickupTime: "10:00", items: ORDERS[1].items.map((item, index) => ({ id: `${index}`, product: item.product, qty: item.qty })) }));
  const [starterProfile, setStarterProfile] = useState<StarterProfile>(DEFAULT_STARTER_PROFILE);
  const [starterOverrides, setStarterOverrides] = useState<Record<string, StarterBuildOverride>>({});
  const [deductionTrigger] = useState<DeductionTrigger>("task-completion");
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  useEffect(() => {
    if (!manualOrderService || !activeMembership?.bakeryId) return;
    let mounted = true;
    setManualOrderLoadError("");
    void manualOrderService.loadSnapshot(activeMembership.bakeryId)
      .then(next => { if (mounted) setManualOrderSnapshot(next); })
      .catch(error => { if (mounted) setManualOrderLoadError(error instanceof Error ? error.message : "Could not load persisted orders."); });
    return () => { mounted = false; };
  }, [activeMembership?.bakeryId, manualOrderService]);
  const starterBuilds = useMemo(() => buildStarterPlans(productionTasks as unknown as ProductionTask[], starterProfile, starterProfile.defaultRatio, starterOverrides), [productionTasks, starterProfile, starterOverrides]);
  const recordTaskDeduction = (task: Task) => {
    if (deductionTrigger !== "task-completion" || task.status === "completed") return;
    const lines = calculateRequirements([task] as unknown as ProductionTask[], starterBuilds, DEFAULT_INVENTORY);
    setInventoryTransactions(current => recordDeductions(current, deductionTrigger, task.id, lines));
  };
  const updateProductionTask = (id: string, patch: Partial<Task>) => {
    setProductionTasks(current => current.map(task => {
      if (task.id !== id) return task;
      if (patch.status === "completed") recordTaskDeduction(task);
      return { ...task, ...patch };
    }));
    void domainContext.commands.updateTask({
      bakeryId,
      operationId: `update-task-${id}-${Date.now()}`,
      taskId: id,
      patch: {
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.note ? { note: patch.note } : {}),
        ...(patch.skipReason ? { skipReason: patch.skipReason } : {}),
      },
    });
  };
  const createPlan = async (items: { product: string; qty: number; price: number; recipeId?: string }[], pickupDate: string, pickupTime: string, customer: { id: string; name: string }, paid: number, notes: string) => {
    if (manualOrderService) {
      const recipeByName = new Map((manualOrderSnapshot?.recipes ?? []).map(recipe => [recipe.name, recipe.id]));
      const orderId = crypto.randomUUID();
      const persisted = await manualOrderService.createOrder({
        bakeryId,
        orderId,
        customerId: customer.id,
        pickupDate,
        pickupTime,
        paid,
        notes,
        items: items.map(item => ({ recipeId: item.recipeId ?? recipeByName.get(item.product) ?? "", quantity: item.qty, unitPrice: item.price })),
      });
      setManualOrderSnapshot(persisted);
      navigateToScreen("orders");
      return;
    }

    const id = `local-${Date.now()}`;
    setOrders(current => current.some(order => order.id === id) ? current : [...current, { id, customer: customer.name, items, pickup: new Date(`${pickupDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }), pickupTime, status: "confirmed", total: items.reduce((sum, item) => sum + item.qty * item.price, 0), paid, paymentStatus: paid <= 0 ? "unpaid" : paid >= items.reduce((sum, item) => sum + item.qty * item.price, 0) ? "paid" : "partially-paid", notes }]);
    setProductionTasks(current => current.some(task => task.orderId === id) ? current : [...current, ...planTasks({ id, pickupDate, pickupTime, items })]);

    void domainContext.commands.createOrder({
      bakeryId,
      operationId: `create-order-${Date.now()}`,
      orderId: id,
      customerId: customer.id || "c1",
      pickupDate,
      pickupTime,
      items: items.map(item => ({
        recipeId: item.recipeId ?? (item.product === "Sourdough Loaf" ? "r1" : "r2"),
        quantity: item.qty,
        unitPrice: item.price,
      })),
      paid,
      notes,
    });
    navigateToScreen("orders");
  };

  const transitionOrder = async (order: Order, transition: OrderStatusTransition): Promise<Order> => {
    if (manualOrderService) {
      const snapshot = await manualOrderService.transitionOrder({
        bakeryId,
        operationId: `transition-order-${order.id}-${Date.now()}`,
        orderId: order.id,
        expectedStatus: transition.expectedStatus,
        targetStatus: transition.targetStatus,
      });
      setManualOrderSnapshot(snapshot);
      const customerNames = new Map(snapshot.customers.map(customer => [customer.id, customer.name]));
      const updated = snapshot.orders.find(item => item.id === order.id);
      if (!updated) throw new Error("The updated order could not be found. Please reload and try again.");
      return {
        id: updated.id,
        customer: customerNames.get(updated.customerId) ?? "Customer",
        items: updated.items.map(item => ({ product: item.product, qty: item.quantity, price: item.unitPrice })),
        pickup: updated.pickupDate,
        pickupTime: updated.pickupTime,
        status: updated.status,
        total: updated.total,
        paid: updated.paid,
        paymentStatus: updated.paymentStatus,
        notes: updated.notes,
      };
    }

    const persistedOrderId = snapshot?.ordersById[order.id]
      ? order.id
      : Object.values(snapshot?.ordersById ?? {}).find(candidate => `#${candidate.id.slice(-3)}` === order.id)?.id ?? order.id;
    const result = await domainContext.commands.transitionOrderStatus({
      bakeryId,
      operationId: `transition-order-${order.id}-${Date.now()}`,
      orderId: persistedOrderId,
      expectedStatus: transition.expectedStatus,
      targetStatus: transition.targetStatus,
    });
    if (!result.ok) throw new Error(result.error.message);
    return { ...order, status: transition.targetStatus };
  };

  const markOrderPaid = async (order: Order): Promise<Order> => {
    if (manualOrderService) {
      const updatedSnapshot = await manualOrderService.markOrderPaid({
        bakeryId,
        operationId: `pay-order-${order.id}-${Date.now()}`,
        orderId: order.id,
      });
      setManualOrderSnapshot(updatedSnapshot);
      const updated = updatedSnapshot.orders.find(item => item.id === order.id);
      if (!updated) throw new Error("The updated order could not be found. Please reload and try again.");
      return { ...order, paid: updated.paid, paymentStatus: updated.paymentStatus };
    }

    const persistedOrderId = snapshot?.ordersById[order.id]
      ? order.id
      : Object.values(snapshot?.ordersById ?? {}).find(candidate => `#${candidate.id.slice(-3)}` === order.id)?.id ?? order.id;
    const result = await domainContext.commands.markOrderPaid({
      bakeryId,
      operationId: `pay-order-${order.id}-${Date.now()}`,
      orderId: persistedOrderId,
    });
    if (!result.ok) throw new Error(result.error.message);
    const updated = result.data.changes.orders?.find(item => item.id === persistedOrderId);
    if (!updated) throw new Error("The payment update returned no order result. Please reload and try again.");
    return { ...order, paid: updated.paid, paymentStatus: updated.paymentStatus };
  };

  const [flows, setFlows] = useState<ProductionFlow[]>(DEFAULT_FLOWS);
  const handleSaveFlow = (savedFlow: ProductionFlow) => {
    setFlows(prev => {
      const exists = prev.some(f => f.id === savedFlow.id);
      if (exists) {
        return prev.map(f => f.id === savedFlow.id ? savedFlow : f);
      }
      return [...prev, savedFlow];
    });
  };

  const domainOrders = useMemo(() => {
    if (manualOrderSnapshot) {
      const customerNames = new Map(manualOrderSnapshot.customers.map(customer => [customer.id, customer.name]));
      return manualOrderSnapshot.orders.map(order => ({
        id: order.id,
        customer: customerNames.get(order.customerId) ?? "Customer",
        items: order.items.map(item => ({ product: item.product, qty: item.quantity, price: item.unitPrice })),
        pickup: order.pickupDate,
        pickupTime: order.pickupTime,
        status: order.status,
        total: order.total,
        paid: order.paid,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
      }));
    }
    if (!snapshot?.ordersById) return orders;
    const rawOrders = Object.values(snapshot.ordersById);
    if (rawOrders.length === 0) return orders;
    return rawOrders.map(o => {
      const customerName = snapshot.customersById?.[o.customerId]?.name || "Customer";
      const itemIds = o.itemIds || [];
      const orderItems = itemIds.map(id => {
        const item = snapshot.orderItemsById?.[id];
        return item ? { product: item.product, qty: item.quantity, price: item.unitPrice } : { product: "Product", qty: 1, price: 14 };
      });
      return {
        id: o.id.length > 8 ? `#${o.id.slice(-3)}` : o.id,
        customer: customerName,
        items: orderItems.length > 0 ? orderItems : [{ product: "Sourdough Loaf", qty: 2, price: 14 }],
        pickup: o.pickupDate,
        pickupTime: o.pickupTime || "10:00 AM",
        status: o.status,
        total: o.total,
        paid: o.paid,
        paymentStatus: o.paymentStatus,
        notes: o.notes,
      };
    });
  }, [manualOrderSnapshot, snapshot, orders]);

  const displayedTasks = useMemo(() => {
    if (!manualOrderSnapshot) return productionTasks;
    return manualOrderSnapshot.tasks.map(task => ({
      id: task.id,
      time: task.scheduledAt ? new Date(task.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
      title: task.title,
      product: manualOrderSnapshot.recipes.find(recipe => recipe.id === task.recipeId)?.name ?? "Product",
      orderId: task.orderId,
      orderItemId: task.recipeId,
      flowId: task.flowId,
      flowStepId: task.flowStepId,
      quantity: task.quantity,
      instructions: "Generated production task",
      status: task.status,
      category: task.category,
      duration: task.duration,
      scheduledAt: task.scheduledAt,
      skipReason: task.skipReason,
    } satisfies Task));
  }, [manualOrderSnapshot, productionTasks]);

  const domainRecipes = useMemo(() => {
    if (!snapshot?.recipesById) return undefined;
    return Object.values(snapshot.recipesById).map(r => ({
      id: r.id,
      name: r.name,
      yield: r.yield,
      batchCost: r.batchCost,
      sellingPrice: r.sellingPrice,
      flowId: r.flowId,
      archived: r.archived,
      ingredients: r.ingredients || [],
    }));
  }, [snapshot]);

  const domainIngredients = useMemo(() => {
    if (!snapshot?.inventoryById) return undefined;
    return Object.values(snapshot.inventoryById).map(i => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      current: i.onHand,
      onHand: i.onHand,
      kind: i.kind || ("ingredient" as const),
      minLevel: i.minLevel,
      upcoming: 0,
      status: i.status,
      packageQuantity: i.packageQuantity,
      packagePrice: i.packagePrice,
      unitCost: i.unitCost || (i.packagePrice && i.packageQuantity ? i.packagePrice / i.packageQuantity : 0.002),
    }));
  }, [snapshot]);

  return (
    <div className="flex h-screen bg-[#FBF8F3] overflow-hidden">
      <Sidebar
        bakeryName={activeMembership?.bakeryName}
        activeMembership={activeMembership}
        memberships={memberships}
        onSwitch={onSwitch}
        onAddOrder={() => setAddOrderOpen(true)}
        onLogout={onLogout}
        onManageStores={onManageStores}
      />

      <main className="flex-1 overflow-y-auto overscroll-contain"
        style={{ scrollbarWidth: "none" }}>
        {activeMembership && (
          <div className="lg:hidden flex items-center justify-between gap-2 border-b border-[#E5DDD3] bg-white px-4 py-2">
            <button
              type="button"
              aria-label={`Return to bakery selection from ${activeMembership.bakeryName}`}
              onClick={() => onManageStores && setReturnDialogOpen(true)}
              className="min-w-0 rounded-lg px-1 py-1 text-left text-xs font-bold text-[#6F655E] transition-colors hover:bg-[#F6F0E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A3E24]"
            >
              <span className="block truncate">{activeMembership.bakeryName}</span>
              <span className="block truncate text-[11px] font-semibold">{activeMembership.role} · active bakery</span>
            </button>
            {memberships.length > 1 && <select
              aria-label="Switch active bakery"
              value={activeMembership?.bakeryId}
              onChange={event => {
                const next = memberships.find(item => item.bakeryId === event.target.value);
                if (next) requestBakerySwitch(() => {
                  navigateRaw(workspacePath("home"), { replace: true });
                  onSwitch?.(next);
                });
              }}
              className="h-8 max-w-48 rounded-lg border border-[#D9CEC4] bg-[#FBF8F3] px-2 text-xs text-[#2F2925] font-semibold"
            >
              {memberships.map(item => <option key={item.id} value={item.bakeryId}>{item.bakeryName}</option>)}
            </select>}
          </div>
        )}
        <ReturnToBakerySelectorDialog
          open={returnDialogOpen}
          onOpenChange={setReturnDialogOpen}
          onConfirm={() => {
            setReturnDialogOpen(false);
            requestReturnToSelector(() => onManageStores?.());
          }}
        />
        <Suspense fallback={<FeatureScreenLoading />}>
        <WorkspaceRoutes
          fallback={location.pathname === "/" ? <Navigate replace to={workspacePath("home")} /> : undefined}
          renderRoute={({ id: screen }) => <>
        {screen === "home"       && <LazyHomeScreen bakeryName={activeMembership?.bakeryName} snapshot={snapshot} onNavigate={navigateToScreen} onAddOrder={() => setAddOrderOpen(true)} />}
        {screen === "orders"     && <LazyOrdersScreen onAddOrder={() => setAddOrderOpen(true)} onTransitionOrder={transitionOrder} onMarkOrderPaid={markOrderPaid} tasks={displayedTasks} orders={domainOrders} />}
        {screen === "invoices"   && (
          <LazyInvoiceList
            invoices={invoices}
            customers={domainCustomers}
            orders={domainOrders}
            paymentMethods={paymentMethods}
            onCreateInvoice={async (input) => {
              if (adapter) await adapter.createInvoice(input);
              void domainContext.commands.load(bakeryId);
            }}
            onUpdateInvoice={async (input) => {
              if (adapter) await adapter.updateInvoice(input);
              void domainContext.commands.load(bakeryId);
            }}
            onRecordPayment={async (input) => {
              if (adapter) await adapter.recordPayment(input);
              void domainContext.commands.load(bakeryId);
            }}
            onCancelInvoice={async (invoiceId) => {
              if (adapter) {
                await adapter.cancelInvoice({
                  bakeryId,
                  operationId: `cancel-inv-${invoiceId}-${Date.now()}`,
                  invoiceId,
                });
              }
              void domainContext.commands.load(bakeryId);
            }}
            onOpenPaymentSettings={() => navigateToScreen("payment-settings")}
            onOpenPublicInvoice={(token) => {
              window.open(`/invoice/${token}`, "_blank");
            }}
          />
        )}
        {screen === "payment-settings" && (
          <LazyPaymentSettings
            paymentMethods={paymentMethods}
            onSave={async (methods) => {
              if (adapter) {
                await adapter.updatePaymentMethods({
                  bakeryId,
                  operationId: `update-pm-${Date.now()}`,
                  paymentMethods: methods,
                });
              }
              void domainContext.commands.load(bakeryId);
            }}
            onBack={() => navigateToScreen("invoices")}
          />
        )}
        {screen === "storefront" && <LazyStorefrontDashboard />}
        {screen === "production" && <LazyProductionScreen flows={flows} onSaveFlow={handleSaveFlow} tasks={displayedTasks} setTasks={setProductionTasks} onTaskUpdate={updateProductionTask} starterBuilds={starterBuilds} />}
        {screen === "recipes"    && (
          <LazyRecipeManager
            recipes={domainRecipes}
            inventoryItems={domainIngredients}
            productionFlows={flows}
            onSaveProductionFlow={handleSaveFlow}
            onAddRecipe={async (recipe) => {
              if (adapter) {
                await adapter.createRecipe({
                  bakeryId,
                  operationId: `create-recipe-${Date.now()}`,
                  recipeId: `r-${Date.now()}`,
                  name: recipe.name,
                  yield: recipe.yield,
                  sellingPrice: recipe.sellingPrice,
                  flowId: recipe.flowId,
                  ingredients: recipe.ingredients,
                });
              }
              void domainContext.commands.load(bakeryId);
            }}
            onUpdateRecipe={async (id, patch) => {
              if (adapter) {
                await adapter.updateRecipe({
                  bakeryId,
                  operationId: `update-recipe-${id}-${Date.now()}`,
                  recipeId: id,
                  name: patch.name,
                  yield: patch.yield,
                  sellingPrice: patch.sellingPrice,
                  flowId: patch.flowId,
                  ingredients: patch.ingredients,
                });
              }
              void domainContext.commands.load(bakeryId);
            }}
          />
        )}
        {screen === "inventory"  && (
          <LazyInventoryScreen
            tasks={displayedTasks}
            builds={starterBuilds}
            transactions={inventoryTransactions}
            ingredients={domainIngredients}
            onOpenStarter={() => navigateToScreen("starter")}
          />
        )}
        {screen === "starter"    && <LazyStarterScreen builds={starterBuilds} profile={starterProfile} onProfile={patch => setStarterProfile(current => ({ ...current, ...patch }))} onOverride={(id, patch) => setStarterOverrides(current => ({ ...current, [id]: { ...current[id], ...patch } }))} onBack={() => navigateToScreen("inventory")} />}
        {screen === "customers"  && (
          <LazyCustomerManager
            customers={domainCustomers}
            onAddCustomer={(data) => {
              return domainContext.commands.createCustomer({
                bakeryId,
                operationId: `create-cust-${Date.now()}`,
                customerId: globalThis.crypto?.randomUUID?.() ?? `c-${Date.now()}`,
                name: data.name,
                email: data.email,
                phone: data.phone,
                type: data.type || "retail",
                address: data.address,
                notes: data.notes,
              });
            }}
            onUpdateCustomer={(id, patch) => {
              return domainContext.commands.updateCustomer({
                bakeryId,
                operationId: `update-cust-${id}-${Date.now()}`,
                customerId: id,
                name: patch.name,
                email: patch.email,
                phone: patch.phone,
                type: patch.type,
                address: patch.address,
                notes: patch.notes,
              });
            }}
          />
        )}
        {screen === "finances"   && <LazyFinancesScreen />}
        {screen === "settings"   && (
          <LazySettingsScreen
            membership={activeMembership}
            adapter={workspaceAdapter}
            onDeleteBakery={onManageStores}
          />
        )}
        {screen === "account" && session && (
          <LazyAccountProfileScreen
            session={session}
            authAdapter={authAdapter}
            onBack={() => navigateToScreen("settings")}
            onLogout={onLogout}
          />
        )}
        {screen === "more"       && <LazyMoreScreen activeMembership={activeMembership} snapshot={snapshot} memberships={memberships} onSwitch={onSwitch} onNavigate={navigateToScreen} onLogout={onLogout} />}
          </>}
        />
        </Suspense>
      </main>

      <BottomNav />
      <FAB onClick={() => setAddOrderOpen(true)} />

      {manualOrderLoadError && <p role="alert" className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl bg-[#FCE9E7] px-4 py-3 text-sm font-semibold text-[#9B3933]">{manualOrderLoadError}</p>}
      {addOrderOpen && <AddOrderModal
        onClose={() => setAddOrderOpen(false)}
        onCreatePlan={createPlan}
        customers={manualOrderService ? (manualOrderSnapshot?.customers.map(customer => ({ ...customer, orders: 0, totalSpent: 0, balance: 0, favorites: [] })) ?? []) : undefined}
        recipes={manualOrderService ? (manualOrderSnapshot?.recipes ?? []) : undefined}
      />}
    </div>
  );
}

export function BakeryWorkspace(props: {
  onLogout?: () => void;
  activeMembership?: BakeryMembership;
  memberships?: BakeryMembership[];
  onSwitch?: (membership: BakeryMembership) => void;
  onSetDefault?: (membership: BakeryMembership) => void;
  onManageStores?: () => void;
  workspaceAdapter?: WorkspaceAdapter;
  session?: AuthSession | null;
  authAdapter?: AuthAdapter;
  manualOrderService?: ManualOrderService;
}) {
  const localBakeryAdapter = useMemo(() => {
    const localAdapter = createLocalBakeryAdapter();
    if (!props.manualOrderService) return localAdapter;

    const customerAdapter = createSupabaseCustomerAdapter();
    return {
      ...localAdapter,
      source: {
        durability: "persisted" as const,
        description: "Authenticated customer records are persisted in Supabase; unsupported bakery-domain records remain session-local.",
      },
      async loadSnapshot(scope: { bakeryId: string }) {
        const localSnapshot = await localAdapter.loadSnapshot(scope);
        if (!localSnapshot.ok) return localSnapshot;
        const customers = await customerAdapter.loadCustomers(scope);
        if (!customers.ok) return customers;
        return {
          ok: true as const,
          data: {
            ...localSnapshot.data,
            customersById: Object.fromEntries(customers.data.map(customer => [customer.id, customer])),
          },
        };
      },
      createCustomer: customerAdapter.createCustomer,
      updateCustomer: customerAdapter.updateCustomer,
    };
  }, [props.manualOrderService]);
  const bakeryId = props.activeMembership?.bakeryId ?? "bakery-north";

  return (
    <BakeryDomainProvider adapter={localBakeryAdapter} bakeryId={bakeryId}>
      <DirtyFormGuardProvider>
        <BakeryWorkspaceInner {...props} adapter={localBakeryAdapter} />
        <UnsavedChangesDialog />
      </DirtyFormGuardProvider>
    </BakeryDomainProvider>
  );
}
