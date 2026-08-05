import type { Screen } from "../types";
import type { BakeryMembership } from "../workspace";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  BookOpen,
  ChefHat,
  DollarSign,
  Droplets,
  FileText,
  Home,
  Leaf,
  LogOut,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { useGuardedExit, useGuardedNavigate } from "./dirtyFormGuard";
import { ReturnToBakerySelectorDialog } from "./ReturnToBakerySelectorDialog";
import {
  resolveWorkspaceRoute,
  workspacePath,
  workspaceRouteRegistry,
  type WorkspacePrimaryRouteId,
} from "./routeRegistry";

const sidebarIcons: Record<WorkspacePrimaryRouteId, typeof Home> = {
  home: Home,
  orders: ShoppingBag,
  invoices: FileText,
  storefront: Store,
  production: ChefHat,
  recipes: BookOpen,
  inventory: Package,
  customers: Users,
  finances: DollarSign,
  settings: Settings,
};

const sidebarBadges: Partial<Record<WorkspacePrimaryRouteId, string>> = {
  orders: "$103",
  inventory: "3",
};

export const SIDEBAR_NAV = workspaceRouteRegistry
  .filter((route): route is typeof route & { id: WorkspacePrimaryRouteId } => route.kind === "primary")
  .map((route) => ({ Icon: sidebarIcons[route.id], label: route.label, routeId: route.id, badge: sidebarBadges[route.id] }));

export function Sidebar({
  bakeryName = "J'adore Bakery",
  activeMembership,
  memberships = [],
  onSwitch,
  onAddOrder,
  onLogout,
  onManageStores,
}: {
  bakeryName?: string;
  activeMembership?: BakeryMembership;
  memberships?: BakeryMembership[];
  onSwitch?: (membership: BakeryMembership) => void;
  screen?: Screen;
  setScreen?: (s: Screen) => void;
  onAddOrder: () => void;
  onLogout: () => void;
  onManageStores?: () => void;
}) {
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useGuardedNavigate();
  const navigateRaw = useNavigate();
  const requestBakerySwitch = useGuardedExit("bakery-switch");
  const requestLogout = useGuardedExit("logout");
  const requestReturnToSelector = useGuardedExit("dismiss");
  const currentRoute = resolveWorkspaceRoute(location.pathname)?.route;

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-[#E5DDD3] min-h-screen flex-shrink-0">
      <div className="px-4 py-5 border-b border-[#E5DDD3]">
        <button
          type="button"
          aria-label={`Return to bakery selection from ${bakeryName}`}
          onClick={() => onManageStores && setReturnDialogOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-[#F6F0E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A3E24] focus-visible:ring-offset-2"
        >
          <div className="w-8 h-8 rounded-[8px] bg-[#7A3E24] flex items-center justify-center flex-shrink-0">
            <Leaf size={14} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-[#2F2925] text-sm leading-tight truncate">{bakeryName}</p>
            {activeMembership && (
              <p className="text-[11px] capitalize text-[#988D84] truncate">{activeMembership.role} · active bakery</p>
            )}
          </div>
        </button>

        <ReturnToBakerySelectorDialog
          open={returnDialogOpen}
          onOpenChange={setReturnDialogOpen}
          onConfirm={() => {
            setReturnDialogOpen(false);
            requestReturnToSelector(() => onManageStores?.());
          }}
        />

        {memberships.length > 1 && <div className="mt-3">
          <label className="block text-[11px] font-bold text-[#6F655E] mb-1">
            Active store
          </label>
          <select
              aria-label="Switch active bakery"
              value={activeMembership?.bakeryId}
              onChange={event => {
                const next = memberships.find(item => item.bakeryId === event.target.value);
                if (next) requestBakerySwitch(() => {
                  navigateRaw(workspacePath("home"), { replace: true });
                  onSwitch?.(next);
                });
              }}
              className="w-full h-8 rounded-lg border border-[#D9CEC4] bg-[#FBF8F3] px-2 text-xs text-[#2F2925] font-semibold"
          >
            {memberships.map(item => <option key={item.id} value={item.bakeryId}>{item.bakeryName}</option>)}
          </select>
        </div>}
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {SIDEBAR_NAV.map(({ Icon, label, routeId, badge }) => {
          const path = workspacePath(routeId);
          const active = currentRoute?.id === routeId || location.pathname.startsWith(`${path}/`);
          return (
            <button key={routeId} onClick={() => navigate(path)} aria-current={active ? "page" : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] transition-all text-left ${active ? "bg-[#FAF1EB] text-[#7A3E24]" : "text-[#6F655E] hover:bg-[#F6F0E8] hover:text-[#2F2925]"}`}>
              <Icon size={16} className="flex-shrink-0" />
              <span className={`text-sm flex-1 ${active ? "font-bold" : "font-semibold"}`}>{label}</span>
              {badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${routeId === "inventory" ? "bg-[#FCE9E7] text-[#B8443C]" : "text-[#B8443C]"}`}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-2">
        <button onClick={onAddOrder}
          className="w-full h-10 bg-[#7A3E24] text-white rounded-[10px] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#934E2E] transition-colors">
          <Plus size={14} /> New Order
        </button>
        <button
          type="button"
          onClick={() => requestLogout(onLogout)}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-[9px] text-xs font-bold text-[#7A3E24] transition-colors hover:bg-[#F6F0E8]"
        >
          <LogOut size={14} aria-hidden="true" />
          Log out
        </button>
        <div className="bg-[#FCE9E7] rounded-[12px] p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets size={12} className="text-[#B8443C]" />
            <p className="text-[11px] font-bold text-[#B8443C]">Starter Short — 70g</p>
          </div>
          <p className="text-[11px] text-[#B8443C]/80">280g / 350g needed · feed by 8 PM</p>
        </div>
      </div>
    </aside>
  );
}
