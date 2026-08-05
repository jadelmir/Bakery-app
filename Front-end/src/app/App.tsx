import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { PasswordResetDialog } from "./PasswordResetDialog";
import { ProtectedRoute } from "./ProtectedRoute";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { InvitationLanding } from "./InvitationLanding";
import { createMockAuthAdapter, supabaseAuthAdapter, type AuthAdapter, type AuthSession } from "./auth";
import {
  createMockWorkspaceAdapter,
  supabaseWorkspaceAdapter,
  type BakeryMembership,
  type WorkspaceAdapter,
} from "./workspace";
import { InventoryAdjustModal } from "./components/inventory/InventoryAdjustModal";
import { ShoppingListDrawer } from "./components/inventory/ShoppingListDrawer";
import { Chip } from "./components/shared/Chip";
import { SectionHeader } from "./components/shared/SectionHeader";
import { INVENTORY, INV_STATUS } from "./constants";
import {
  buildStarterPlans,
  calculateRequirements,
  shoppingList,
  type InventoryTransaction,
} from "./planning";
import type { ProductionTask } from "./production";
import type { InventoryItem, Task } from "./types";
import { createManualOrderService } from "../lib/supabase/manualOrderAdapter";
import { AlertTriangle, Plus, Droplets, ShoppingBag, PackagePlus } from "lucide-react";

const LazyPublicInvoiceView = lazy(() =>
  import("./components/invoicing/PublicInvoiceView").then(module => ({ default: module.PublicInvoiceView })),
);
const LazyPublicStorefront = lazy(() =>
  import("./components/storefront/PublicStorefront").then(module => ({ default: module.PublicStorefront })),
);
const LazyBakeryWorkspace = lazy(() =>
  import("./BakeryWorkspace").then(module => ({ default: module.BakeryWorkspace })),
);

function PublicViewLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBF8F3]" role="status" aria-live="polite">
      {label}
    </main>
  );
}

export interface InventoryScreenProps {
  tasks: Task[];
  builds: ReturnType<typeof buildStarterPlans>;
  transactions: InventoryTransaction[];
  ingredients?: readonly InventoryItem[];
  onOpenStarter: () => void;
  onRecordRestock?: (data: { itemId: string; quantityAdded: number; unitCost?: number; notes?: string }) => void;
}

export function InventoryScreen({
  tasks,
  builds,
  transactions: initialTransactions,
  ingredients: externalIngredients,
  onOpenStarter,
  onRecordRestock,
}: InventoryScreenProps) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(initialTransactions || []);
  const [localIngredients, setLocalIngredients] = useState<InventoryItem[]>(
    () => (externalIngredients && externalIngredients.length > 0 ? [...externalIngredients] : INVENTORY)
  );

  useEffect(() => {
    if (externalIngredients && externalIngredients.length > 0) {
      setLocalIngredients([...externalIngredients]);
    }
  }, [externalIngredients]);

  useEffect(() => {
    setTransactions(initialTransactions || []);
  }, [initialTransactions]);

  const [selectedOrder, setSelectedOrder] = useState("all");
  const [, setAddIngredientOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [selectedAdjustItem, setSelectedAdjustItem] = useState<{ id: string; name: string; unit: string; current?: number } | undefined>();

  const requirements = calculateRequirements(
    tasks as unknown as ProductionTask[],
    builds,
    localIngredients.map((i) => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      onHand: i.current ?? (i as unknown as { onHand?: number }).onHand ?? 0,
      kind: (i as unknown as { kind?: "ingredient" | "packaging" }).kind ?? "ingredient",
    })),
    undefined,
    selectedOrder === "all" ? undefined : selectedOrder
  );

  const totals = Object.values(
    requirements.reduce<Record<string, (typeof requirements)[number]>>((result, line) => {
      const existing = result[line.itemId];
      result[line.itemId] = existing
        ? {
            ...existing,
            required: existing.required + line.required,
            shortage: Math.max(0, existing.required + line.required - existing.available),
          }
        : line;
      return result;
    }, {})
  );

  const shortages = shoppingList(totals);
  const issues = shortages.length;

  const drawerItems = localIngredients.map((item) => {
    const itemExt = item as unknown as {
      onHand?: number;
      packageQuantity?: number;
      packagePrice?: number;
      unitCost?: number;
    };
    const currentVal = item.current ?? itemExt.onHand ?? 0;
    const planned = totals.find((line) => line.itemId === item.id || line.name === item.name);
    const required = planned?.required ?? 0;
    const shortage = planned?.shortage ?? Math.max(0, required - currentVal);
    return {
      itemId: item.id,
      name: item.name,
      unit: item.unit,
      onHand: currentVal,
      minLevel: item.minLevel ?? 0,
      required,
      shortage,
      packageQuantity: itemExt.packageQuantity,
      packagePrice: itemExt.packagePrice,
      unitCost: itemExt.unitCost,
    };
  });

  const handleRestockConfirm = (data: { itemId: string; quantityAdded: number; unitCost?: number; invoiceRef?: string; notes?: string }) => {
    setLocalIngredients((prev) =>
      prev.map((item) => {
        if (item.id === data.itemId) {
          const itemExt = item as unknown as { onHand?: number };
          const currentVal = item.current ?? itemExt.onHand ?? 0;
          const updatedCurrent = currentVal + data.quantityAdded;
          return {
            ...item,
            current: updatedCurrent,
            status: updatedCurrent <= 0 ? "out-of-stock" : updatedCurrent <= (item.minLevel ?? 0) ? "low" : "in-stock",
          };
        }
        return item;
      })
    );

    const newTx: InventoryTransaction = {
      id: `tx-restock-${Date.now()}`,
      sourceKey: `manual-restock:${data.itemId}:${Date.now()}`,
      itemId: data.itemId,
      quantityChange: data.quantityAdded,
      reason: "task-completed",
    };
    setTransactions((prev) => [...prev, newTx]);

    if (onRecordRestock) {
      onRecordRestock(data);
    }
  };

  const handleOpenRestockModal = (item?: { id: string; name: string; unit: string; current?: number }) => {
    setSelectedAdjustItem(item);
    setAdjustModalOpen(true);
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-[#2F2925]">Inventory & Ingredients</h1>
          <p className="text-xs text-[#988D84] mt-1">{transactions.length} local movements recorded</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Shopping List Trigger Button */}
          <button
            onClick={() => setShoppingListOpen(true)}
            className="h-9 px-3 bg-[#EBF4EC] text-[#2D7A46] border border-[#2D7A46]/20 rounded-[10px] text-sm font-bold flex items-center gap-1.5 hover:bg-[#D8EADB] transition-colors relative"
          >
            <ShoppingBag size={14} />
            Shopping List
            {issues > 0 && (
              <span className="ml-1 bg-[#B8443C] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {issues}
              </span>
            )}
          </button>

          {/* Restock Button in Header */}
          <button
            onClick={() => handleOpenRestockModal()}
            className="h-9 px-3 bg-[#F3DED1] text-[#7A3E24] rounded-[10px] text-sm font-bold flex items-center gap-1.5 hover:bg-[#EAC5B0] transition-colors"
          >
            <PackagePlus size={14} />
            + Restock
          </button>

          <button
            onClick={() => setAddIngredientOpen(true)}
            className="h-9 px-3.5 bg-[#7A3E24] text-white rounded-[10px] text-sm font-bold flex items-center gap-1.5 hover:bg-[#934E2E] transition-colors"
          >
            <Plus size={14} /> Add Ingredient
          </button>
          <button
            onClick={onOpenStarter}
            className="h-9 px-3 border border-[#7A3E24] text-[#7A3E24] rounded-[10px] text-sm font-bold flex items-center gap-1.5 hover:bg-[#F3DED1] transition-colors"
          >
            <Droplets size={14} /> Starter
          </button>
        </div>
      </div>

      <label className="block text-xs text-[#6F655E] mb-4">
        Requirements for{" "}
        <select
          aria-label="Inventory order filter"
          value={selectedOrder}
          onChange={(event) => setSelectedOrder(event.target.value)}
          className="ml-2 h-8 rounded-[8px] border border-[#E5DDD3] px-2 bg-white"
        >
          <option value="all">all scheduled orders</option>
          {[...new Set(tasks.map((task) => task.orderId).filter(Boolean))].map((orderId) => (
            <option key={orderId} value={orderId}>
              {orderId}
            </option>
          ))}
        </select>
      </label>

      {/* Shortage Alert Banner */}
      {issues > 0 && (
        <div className="bg-[#FCE9E7] border border-[#B8443C]/20 rounded-[14px] p-3.5 mb-5 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={15} className="text-[#B8443C] flex-shrink-0" />
            <p className="text-sm font-semibold text-[#B8443C]">
              {issues} item{issues > 1 ? "s" : ""} need attention for scheduled production
            </p>
          </div>
          <button
            onClick={() => setShoppingListOpen(true)}
            className="text-xs font-extrabold text-[#B8443C] underline hover:text-[#93342E]"
          >
            View Shopping List
          </button>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-[14px] border border-[#E5DDD3] overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 border-b border-[#E5DDD3] bg-[#F8F4EE]">
          <p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider">Item</p>
          <p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider text-right">Available</p>
          <p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider">Status</p>
          <p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider text-center">Action</p>
        </div>
        {localIngredients.map((item, i) => {
          const itemExt = item as unknown as { onHand?: number };
          const planned = totals.find((line) => line.itemId === item.id || line.name === item.name);
          const required = planned?.required ?? 0;
          const shortage = planned?.shortage ?? 0;
          const available = item.current ?? itemExt.onHand ?? 0;

          return (
            <div
              key={item.id}
              className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-4 py-3.5 ${
                i < localIngredients.length - 1 ? "border-b border-[#F0E9E0]" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-[#2F2925]">{item.name}</p>
                <p className="text-xs text-[#988D84] mt-0.5">
                  required {required}{item.unit} including starter inputs
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-['DM_Mono',monospace] text-[#2F2925]">
                  {available}{item.unit}
                </p>
                {item.upcoming > available && (
                  <p className="text-xs font-['DM_Mono',monospace] text-[#B8443C] font-bold">
                    –{item.upcoming - available}{item.unit}
                  </p>
                )}
              </div>
              <Chip cfg={shortage > 0 ? INV_STATUS.insufficient : INV_STATUS[item.status]} />
              {/* Restock button on inventory item cards */}
              <button
                onClick={() => handleOpenRestockModal({ id: item.id, name: item.name, unit: item.unit, current: available })}
                className="h-7 px-2.5 rounded-[6px] bg-[#F5EBE1] text-[#7A3E24] hover:bg-[#7A3E24] hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
                aria-label={`Restock ${item.name}`}
              >
                + Restock
              </button>
            </div>
          );
        })}
      </div>

      {/* Shopping List Summary */}
      <section className="mt-5">
        <SectionHeader title="Shopping list" />
        {shortages.length ? (
          <div className="bg-white rounded-[14px] border border-[#E5DDD3] divide-y divide-[#F0E9E0]">
            {shortages.map((line) => (
              <div key={line.itemId} className="flex justify-between items-center p-3">
                <span className="text-sm font-semibold">{line.name}</span>
                <span className="text-sm font-bold text-[#B8443C]">Buy {line.shortage}{line.unit}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6F655E]">Everything required is available.</p>
        )}
      </section>

      {/* Modals */}
      <InventoryAdjustModal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        items={localIngredients.map((i) => {
          const itemExt = i as unknown as { onHand?: number };
          return {
            id: i.id,
            name: i.name,
            unit: i.unit,
            current: i.current ?? itemExt.onHand ?? 0,
          };
        })}
        selectedItemId={selectedAdjustItem?.id}
        onConfirm={handleRestockConfirm}
      />

      <ShoppingListDrawer
        isOpen={shoppingListOpen}
        onClose={() => setShoppingListOpen(false)}
        items={drawerItems}
      />
    </div>
  );
}

export default function App({
  authAdapter,
  workspaceAdapter,
}: {
  authAdapter?: AuthAdapter;
  workspaceAdapter?: WorkspaceAdapter;
}) {
  const publicTokenMatch = window.location.pathname.match(/^\/invoice\/([^/]+)$/);
  if (publicTokenMatch) {
    const publicToken = publicTokenMatch[1];
    return (
      <Suspense fallback={<PublicViewLoading label="Loading invoice…" />}>
        <LazyPublicInvoiceView publicToken={publicToken} />
      </Suspense>
    );
  }
  const publicStorefrontMatch = window.location.pathname.match(/^\/store\/([^/]+)$/);
  if (publicStorefrontMatch) {
    const slug = publicStorefrontMatch[1];
    return (
      <Suspense fallback={<PublicViewLoading label="Loading storefront…" />}>
        <LazyPublicStorefront slug={slug} />
      </Suspense>
    );
  }

  const useBrowserMock = import.meta.env.VITE_USE_MOCK_BACKEND === "true";
  const isRecoveryPath = window.location.pathname === "/auth/reset-password";
  const browserMockAuthAdapter = useMemo(() => createMockAuthAdapter(20), []);
  const activeAuthAdapter = authAdapter ?? (useBrowserMock ? browserMockAuthAdapter : supabaseAuthAdapter);
  const activeWorkspaceAdapter = useMemo(
    () => {
      if (workspaceAdapter) return workspaceAdapter;
      if (authAdapter) return createMockWorkspaceAdapter();
      if (!useBrowserMock) return supabaseWorkspaceAdapter;
      const scenario = localStorage.getItem("bakery-mock-scenario");
      if (scenario === "empty") return createMockWorkspaceAdapter([]);
      if (scenario === "multiple") {
        return createMockWorkspaceAdapter([
          { id: "m-north", bakeryId: "bakery-north", bakeryName: "North Bakery", role: "owner", isDefault: true },
          { id: "m-south", bakeryId: "bakery-south", bakeryName: "South Bakery", role: "manager", isDefault: false },
        ]);
      }
      return createMockWorkspaceAdapter();
    },
    [authAdapter, useBrowserMock, workspaceAdapter],
  );
  const manualOrderService = useMemo(
    () => (!useBrowserMock && !authAdapter ? createManualOrderService() : undefined),
    [authAdapter, useBrowserMock],
  );

  const [session, setSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [memberships, setMemberships] = useState<BakeryMembership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [activeMembership, setActiveMembership] = useState<BakeryMembership | null>(null);
  const [shellError, setShellError] = useState("");
  const [recoveryState, setRecoveryState] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >(() => (isRecoveryPath ? "checking" : "idle"));
  const [recoveryNotice, setRecoveryNotice] = useState("");
  const recoveryEventSeen = useRef(false);
  const [invitationToken, setInvitationToken] = useState(
    () => new URLSearchParams(window.location.search).get("invitation") ?? "",
  );

  useEffect(() => {
    let mounted = true;
    recoveryEventSeen.current = false;
    const unsubscribe = activeAuthAdapter.onAuthStateChange((nextSession, event) => {
      if (!mounted) return;
      if (isRecoveryPath) {
        if (event === "PASSWORD_RECOVERY" && nextSession) {
          recoveryEventSeen.current = true;
          setSession(nextSession);
          setRecoveryState("valid");
          setAuthLoading(false);
        } else if (event === "SIGNED_OUT") {
          setSession(null);
        }
        return;
      }
      setSession(nextSession);
      if (!nextSession) {
        setMemberships([]);
        setActiveMembership(null);
      }
    });

    activeAuthAdapter.getSession()
      .then(restored => {
        if (mounted && !isRecoveryPath) setSession(restored);
      })
      .catch(reason => {
        if (mounted) setShellError(reason instanceof Error ? reason.message : "Could not restore your session.");
      })
      .finally(() => {
        if (!mounted) return;
        setAuthLoading(false);
        if (isRecoveryPath && !recoveryEventSeen.current) {
          setRecoveryState("invalid");
        }
      });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [activeAuthAdapter, isRecoveryPath]);

  const loadMemberships = async (currentSession: AuthSession, showLoading = true) => {
    if (showLoading) setMembershipsLoading(true);
    try {
      const accessible = await activeWorkspaceAdapter.listMemberships(currentSession.user.id);
      setMemberships(accessible);
      setShellError("");
      setActiveMembership(current => {
        if (current) {
          return accessible.find(item => item.bakeryId === current.bakeryId) ?? null;
        }
        const storageKey = `bakery:${currentSession.user.id}`;
        const rememberedBakeryId = sessionStorage.getItem(storageKey);
        const rememberedMembership = accessible.find(item => item.bakeryId === rememberedBakeryId);
        if (rememberedBakeryId && !rememberedMembership) {
          sessionStorage.removeItem(storageKey);
        }
        return rememberedMembership ?? null;
      });
      return accessible;
    } catch (reason) {
      setShellError(reason instanceof Error ? reason.message : "Could not load your bakeries.");
      throw reason;
    } finally {
      if (showLoading) setMembershipsLoading(false);
    }
  };

  useEffect(() => {
    if (session && !isRecoveryPath) void loadMemberships(session);
  }, [session, activeWorkspaceAdapter, isRecoveryPath]);

  const navigateToLogin = (notice = "") => {
    window.history.replaceState({}, "", "/auth/login");
    setRecoveryState("idle");
    setRecoveryNotice(notice);
    setSession(null);
    setAuthLoading(false);
  };

  if (isRecoveryPath && recoveryState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF8F3]" role="status">
        Verifying your password reset linkâ€¦
      </main>
    );
  }

  if (isRecoveryPath) {
    const hasValidRecoverySession = recoveryState === "valid";
    return (
      <>
        {shellError && (
          <p role="alert" className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-xl bg-[#FCE9E7] px-4 py-3 text-sm font-semibold text-[#9B3933]">
            {shellError}
          </p>
        )}
        <PasswordResetDialog
          key={hasValidRecoverySession ? "valid-recovery" : "invalid-recovery"}
          isOpen={true}
          onClose={() => {
            if (!hasValidRecoverySession) {
              navigateToLogin();
              return;
            }
            setShellError("");
            void activeAuthAdapter.signOut()
              .then(() => navigateToLogin())
              .catch(() => {
                setShellError("We couldn't end the recovery session. Please try again.");
              });
          }}
          authAdapter={activeAuthAdapter}
          initialMode={hasValidRecoverySession ? "update" : "request"}
          initialError={hasValidRecoverySession
            ? ""
            : "This password reset link is invalid or has expired. Request a new link or return to login."}
          onSuccess={() => {
            navigateToLogin("Your password was updated. Log in with your new password.");
          }}
        />
      </>
    );
  }

  if (authLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#FBF8F3]" role="status">Restoring your session…</main>;
  }

  if (!session) {
    return (
      <>
        {recoveryNotice && (
          <p role="status" className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl bg-[#EDF8EF] px-4 py-3 text-sm font-semibold text-[#356344]">
            {recoveryNotice}
          </p>
        )}
        <ProtectedRoute
          session={session}
          loading={authLoading}
          authAdapter={activeAuthAdapter}
          onAuthenticated={setSession}
        >
          <div />
        </ProtectedRoute>
      </>
    );
  }

  const logout = async () => {
    setActiveMembership(null);
    setMemberships([]);
    sessionStorage.removeItem(`bakery:${session.user.id}`);
    await activeAuthAdapter.signOut();
    setSession(null);
  };

  if (membershipsLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#FBF8F3]" role="status">Loading your bakeries…</main>;
  }

  if (invitationToken) {
    const finishInvitation = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("invitation");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      setInvitationToken("");
    };
    return (
      <InvitationLanding
        token={invitationToken}
        adapter={activeWorkspaceAdapter}
        userEmail={session.user.email}
        onAccepted={async () => {
          await loadMemberships(session, false);
        }}
        onFinished={finishInvitation}
      />
    );
  }

  if (!activeMembership) {
    return (
      <>
        {shellError && <p role="alert" className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl bg-[#FCE9E7] px-4 py-3 text-sm font-semibold text-[#9B3933]">{shellError}</p>}
        <WorkspaceSelector
          memberships={memberships}
          onLogout={logout}
          onCreate={async name => {
            const createdBakeryId = memberships.length === 0
              ? await activeWorkspaceAdapter.createDefaultBakery(name)
              : await activeWorkspaceAdapter.createAdditionalBakery(name);
            const accessible = await loadMemberships(session, false);
            const createdMembership = accessible.find(item => item.bakeryId === createdBakeryId);
            if (!createdMembership) {
              throw new Error("The new bakery is not available to your account yet.");
            }
            sessionStorage.setItem(`bakery:${session.user.id}`, createdMembership.bakeryId);
            setActiveMembership(createdMembership);
          }}
          onSelect={membership => {
            sessionStorage.setItem(`bakery:${session.user.id}`, membership.bakeryId);
            setActiveMembership(membership);
          }}
        />
      </>
    );
  }

  return (
    <Suspense fallback={<PublicViewLoading label="Loading workspace…" />}>
      <LazyBakeryWorkspace
        key={activeMembership.bakeryId}
        activeMembership={activeMembership}
        memberships={memberships}
        workspaceAdapter={activeWorkspaceAdapter}
        session={session}
        authAdapter={activeAuthAdapter}
        manualOrderService={manualOrderService}
        onSwitch={membership => {
          sessionStorage.removeItem(`bakery:${session.user.id}`);
          setActiveMembership(null);
          queueMicrotask(() => {
            sessionStorage.setItem(`bakery:${session.user.id}`, membership.bakeryId);
            setActiveMembership(membership);
          });
        }}
        onSetDefault={membership => {
          void activeWorkspaceAdapter.setDefaultBakery(membership.bakeryId)
            .then(() => loadMemberships(session))
            .catch(reason => setShellError(reason instanceof Error ? reason.message : "Could not update the default bakery."));
        }}
        onLogout={() => void logout()}
        onManageStores={() => {
          sessionStorage.removeItem(`bakery:${session.user.id}`);
          setActiveMembership(null);
        }}
      />
    </Suspense>
  );
}
