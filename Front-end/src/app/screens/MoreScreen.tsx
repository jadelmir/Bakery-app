import {
  FileText, Store, Package, Users, DollarSign, CreditCard, User, Settings,
  ChevronRight, LogOut, BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useGuardedExit, useGuardedNavigate } from "../navigation/dirtyFormGuard";
import { workspacePath, type WorkspaceRouteId } from "../navigation/routeRegistry";
import type { Screen } from "../types";
import {
  selectLowStockCount,
  selectActiveCustomerCount,
  selectUnpaidCustomerSummary,
} from "../state/selectors";
import type { BakeryDomainSnapshot } from "../domain/types";
import type { BakeryMembership } from "../workspace";

export function MoreScreen({
  activeMembership,
  snapshot,
  memberships = [],
  onSwitch,
  onLogout
}: {
  activeMembership?: BakeryMembership;
  snapshot?: BakeryDomainSnapshot;
  memberships?: BakeryMembership[];
  onSwitch?: (m: BakeryMembership) => void;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
}) {
  const lowStockCount = snapshot ? selectLowStockCount(snapshot) : 3;
  const navigate = useGuardedNavigate();
  const navigateRaw = useNavigate();
  const requestBakerySwitch = useGuardedExit("bakery-switch");
  const requestLogout = useGuardedExit("logout");
  const customerCount = snapshot ? selectActiveCustomerCount(snapshot) : 4;
  const unpaidInfo = snapshot ? selectUnpaidCustomerSummary(snapshot) : { unpaidTotal: 103, summary: "" };
  const items = [
    { Icon: BookOpen,   label: "Recipes",          routeId: "recipes" as WorkspaceRouteId,          sub: "Manage recipes & batch costing" },
    { Icon: FileText,   label: "Invoices",         routeId: "invoices" as WorkspaceRouteId,         sub: "Manage customer billing & payments" },
    { Icon: Store,      label: "Online Store",     routeId: "storefront" as WorkspaceRouteId,       sub: "Manage public store & products" },
    { Icon: Package,    label: "Inventory",        routeId: "inventory" as WorkspaceRouteId,        sub: `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} need attention` },
    { Icon: Users,      label: "Customers",        routeId: "customers" as WorkspaceRouteId,        sub: `${customerCount} active customer${customerCount === 1 ? "" : "s"}` },
    { Icon: DollarSign, label: "Finances",         routeId: "finances" as WorkspaceRouteId,         sub: unpaidInfo.unpaidTotal > 0 ? `$${unpaidInfo.unpaidTotal} unpaid balance` : "All customer accounts paid" },
    { Icon: CreditCard, label: "Payment Settings", routeId: "payment-settings" as WorkspaceRouteId, sub: "Zelle, PayPal, Cash & Check" },
    { Icon: User,       label: "Account & Profile",routeId: "account" as WorkspaceRouteId,          sub: "Profile, preferences & password" },
    { Icon: Settings,   label: "Settings",         routeId: "settings" as WorkspaceRouteId,         sub: "App & notifications" },
  ];
  return (
    <div className="px-4 py-6 pb-28">
      <h1 className="text-xl font-extrabold text-[#2F2925] mb-5">More</h1>

      {memberships.length > 1 && (
        <div className="bg-white rounded-[14px] border border-[#E5DDD3] p-4 mb-4">
          <p className="text-xs font-bold text-[#6F655E] mb-0.5">{activeMembership?.bakeryName}</p>
          <p className="text-[11px] capitalize text-[#988D84] mb-2">{activeMembership?.role} · active bakery</p>
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
            className="w-full h-10 rounded-lg border border-[#D9CEC4] bg-[#FBF8F3] px-3 text-xs text-[#2F2925] font-semibold"
          >
            {memberships.map(item => <option key={item.id} value={item.bakeryId}>{item.bakeryName}</option>)}
          </select>
        </div>
      )}
      <div className="bg-white rounded-[14px] border border-[#E5DDD3] overflow-hidden">
        {items.map(({ Icon, label, routeId, sub }, i) => (
          <button key={label} onClick={() => navigate(workspacePath(routeId))}
            className={`w-full flex items-center gap-3.5 px-4 py-4 text-left hover:bg-[#F6F0E8] transition-colors active:bg-[#EDE6DC] ${i < items.length - 1 ? "border-b border-[#F0E9E0]" : ""}`}>
            <div className="w-10 h-10 rounded-[10px] bg-[#F3DED1] flex items-center justify-center flex-shrink-0">
              <Icon size={17} className="text-[#7A3E24]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#2F2925] text-sm">{label}</p>
              <p className="text-xs text-[#988D84] mt-0.5">{sub}</p>
            </div>
            <ChevronRight size={15} className="text-[#C5BAB1] flex-shrink-0" />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => requestLogout(onLogout)}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border border-[#D9CEC4] bg-white text-sm font-bold text-[#7A3E24] transition-colors hover:bg-[#F6F0E8]"
      >
        <LogOut size={16} aria-hidden="true" />
        Log out
      </button>
    </div>
  );
}
