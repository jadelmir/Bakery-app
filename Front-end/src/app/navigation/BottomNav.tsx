import type { Screen } from "../types";
import { useLocation } from "react-router";
import { BookOpen, ChefHat, Home, MoreHorizontal, Plus, ShoppingBag } from "lucide-react";
import { useGuardedNavigate } from "./dirtyFormGuard";
import { resolveWorkspaceRoute, workspacePath, type WorkspacePrimaryRouteId, type WorkspaceRouteId } from "./routeRegistry";

export const BOTTOM_NAV = [
  { Icon: Home,           label: "Home",       routeId: "home" as WorkspacePrimaryRouteId },
  { Icon: ShoppingBag,    label: "Orders",     routeId: "orders" as WorkspacePrimaryRouteId },
  { Icon: ChefHat,        label: "Production", routeId: "production" as WorkspacePrimaryRouteId },
  { Icon: BookOpen,       label: "Recipes",    routeId: "recipes" as WorkspacePrimaryRouteId },
  { Icon: MoreHorizontal, label: "More",       routeId: "more" as WorkspaceRouteId },
];

export function BottomNav({ screen: _screen, setScreen: _setScreen }: { screen?: Screen; setScreen?: (s: Screen) => void }) {
  const location = useLocation();
  const navigate = useGuardedNavigate();
  const currentRoute = resolveWorkspaceRoute(location.pathname)?.route;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5DDD3] z-30">
      <div className="flex items-stretch justify-around">
        {BOTTOM_NAV.map(({ Icon, label, routeId }) => {
          const active = routeId === "more"
            ? currentRoute?.id === "more" || (currentRoute !== undefined && !BOTTOM_NAV.some((item) => item.routeId !== "more" && item.routeId === currentRoute.id))
            : currentRoute?.id === routeId;
          return (
            <button key={routeId} onClick={() => navigate(workspacePath(routeId))} aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 py-3 flex-1 min-h-[56px] transition-colors ${active ? "text-[#7A3E24]" : "text-[#988D84]"}`}>
              <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
              <span className={`text-[10px] font-bold ${active ? "text-[#7A3E24]" : "text-[#988D84]"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Add order" onClick={onClick}
      className="lg:hidden fixed bottom-[72px] right-4 w-14 h-14 rounded-full bg-[#7A3E24] text-white flex items-center justify-center z-40 active:scale-95 transition-transform hover:bg-[#934E2E]"
      style={{ boxShadow: "0 4px 24px rgba(122,62,36,0.38)" }}>
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}
