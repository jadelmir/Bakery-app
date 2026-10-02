import { useMemo, useState } from "react";
import type { Screen } from "../types";
import { HomeOrderCalendar } from "../components/home/HomeOrderCalendar";
import {
  selectUnpaidCustomerSummary,
  selectDashboard,
  selectFinances,
  selectHomeOrderCalendar,
  selectInventory,
} from "../state/selectors";
import type { BakeryDomainSnapshot } from "../domain/types";
import {
  Plus, Bell,
  DollarSign,
  Store,
  ClipboardList, TrendingUp, ExternalLink, ArrowRight,
} from "lucide-react";

// ─── Order Card ─────────────────────────────────────────────────────────────

// ─── Home Screen ────────────────────────────────────────────────────────────

export function HomeScreen({ bakeryName = "Bakery", snapshot, onNavigate, onAddOrder, onOpenPrepList, onContinueOnboarding }: { bakeryName?: string; snapshot?: BakeryDomainSnapshot; onNavigate?: (screen: Screen) => void; onAddOrder?: () => void; onOpenPrepList?: () => void; onContinueOnboarding?: () => void }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const now = new Date();
  const currentWeekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentDateString = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const dashboard = snapshot ? selectDashboard(snapshot) : undefined;
  const finances = snapshot ? selectFinances(snapshot) : undefined;
  const unpaidInfo = snapshot ? selectUnpaidCustomerSummary(snapshot) : undefined;
  const storefrontSlug = snapshot?.storefront?.slug;

  const activeOrderCount = dashboard?.activeOrders.length ?? 0;
  const productionLabel = dashboard?.activeOrders.some(order => order.status === "in-production")
    ? "In Production"
    : activeOrderCount > 0 ? "Orders Scheduled" : "No Active Orders";
  const revenue = finances?.revenue ?? 0;
  const profit = finances?.profit ?? 0;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const unpaidTotal = unpaidInfo?.unpaidTotal ?? 0;

  const notifications = useMemo(() => {
    if (!snapshot) return [];
    const next: { id: string; title: string; detail: string }[] = [];
    selectInventory(snapshot).shortages.slice(0, 3).forEach(shortage => {
      next.push({ id: `shortage-${shortage.itemId}`, title: `${shortage.name} shortage`, detail: `Need ${shortage.shortage}${shortage.unit} for scheduled production.` });
    });
    if (unpaidTotal > 0 && unpaidInfo) {
      next.push({ id: "unpaid-balance", title: "Unpaid balance", detail: unpaidInfo.summary });
    }
    const nextOrder = selectHomeOrderCalendar(snapshot).flatMap(day => day.orders)[0];
    if (nextOrder) {
      next.push({ id: `pickup-${nextOrder.id}`, title: "Upcoming pickup", detail: `${nextOrder.customerName} · ${nextOrder.pickupDate} at ${nextOrder.pickupTime}` });
    }
    return next;
  }, [unpaidInfo, unpaidTotal, snapshot]);

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-6 pb-28 lg:pb-10">
      {/* Artisanal Command Center Hero Header */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#7A3E24] via-[#934E2E] to-[#B4643B] p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/70">{currentWeekday}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#E8F3EB] text-[#3F7A55]">
                {productionLabel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{currentDateString} · {bakeryName} 🍞</h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1">
              {activeOrderCount} active order{activeOrderCount === 1 ? "" : "s"} in queue
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenPrepList}
              className="h-10 px-4 bg-white/15 border border-white/25 text-white rounded-[12px] text-xs font-extrabold flex items-center gap-1.5 hover:bg-white/25 transition-all active:scale-[0.98]"
            >
              <ClipboardList size={15} /> Today's Prep List
            </button>
            <button
              onClick={onAddOrder}
              className="h-10 px-4 bg-white text-[#7A3E24] rounded-[12px] text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:bg-[#F6F0E8] transition-all active:scale-[0.98]"
            >
              <Plus size={15} /> New Order
            </button>
            <button
              type="button"
              aria-label="View notifications"
              onClick={() => setShowNotifications(v => !v)}
              className="relative w-10 h-10 rounded-[12px] bg-white/15 border border-white/20 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <Bell size={18} />
              {notifications.length > 0 ? <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#B8443C] rounded-full ring-2 ring-[#7A3E24]" /> : null}
            </button>
          </div>
        </div>

        {/* Notifications Dropdown Panel */}
        {showNotifications && (
          <section aria-label="Notifications" className="mt-4 bg-white text-[#2F2925] rounded-[16px] border border-[#E5DDD3] divide-y divide-[#F0E9E0] shadow-xl overflow-hidden relative z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2.5 bg-[#FAF1EB] border-b border-[#E5DDD3] flex justify-between items-center">
              <span className="text-xs font-extrabold text-[#7A3E24] uppercase tracking-wider">Alerts &amp; Notifications</span>
              <span className="text-[10px] text-[#988D84] font-semibold">{notifications.length} new</span>
            </div>
            {notifications.length === 0 ? <p className="p-4 text-sm text-[#6F655E]">No new notifications.</p> : notifications.map(notification => (
              <div className="p-3.5 hover:bg-[#FBF8F3] transition-colors" key={notification.id}>
                <p className="text-sm font-bold text-[#2F2925]">{notification.title}</p>
                <p className="text-xs text-[#6F655E] mt-0.5">{notification.detail}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Primary order calendar */}
      <HomeOrderCalendar snapshot={snapshot} onNavigate={onNavigate} />

      {onContinueOnboarding && (
        <button type="button" onClick={onContinueOnboarding} className="flex w-full items-center gap-4 rounded-[18px] border border-[#E4C9B8] bg-[#FAF1EB] p-4 text-left shadow-xs transition hover:border-[#C99B80] hover:bg-[#F6E8DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A3E24] focus-visible:ring-offset-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#7A3E24] text-white"><ClipboardList size={18} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-[#2F2925]">Continue setting up {bakeryName}</span><span className="mt-0.5 block text-xs text-[#6F655E]">Finish the few steps that turn your first order into a clear Prep List.</span></span>
          <ArrowRight size={17} className="shrink-0 text-[#7A3E24]" aria-hidden="true" />
        </button>
      )}

      {/* Actionable Smart Priority Banners */}
      <div className="space-y-2.5">
        {unpaidTotal > 0 && (
          <div className="bg-[#FFF4D8] border border-[#B7791F]/30 rounded-[16px] p-4 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-[10px] bg-[#B7791F]/15 text-[#B7791F] flex items-center justify-center flex-shrink-0 mt-0.5">
              <DollarSign size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-[#B7791F]">${unpaidTotal} unpaid balance</p>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#B7791F] text-white rounded-full uppercase font-mono">Unpaid Balance</span>
              </div>
              <p className="text-xs text-[#B7791F]/90 mt-0.5">{unpaidInfo?.summary}</p>
            </div>
          </div>
        )}
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white rounded-[16px] border border-[#E5DDD3] p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#988D84] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Revenue</span>
            <TrendingUp size={14} className="text-[#3F7A55]" />
          </div>
          <p className="text-2xl font-extrabold text-[#2F2925] font-['DM_Mono',monospace]">${revenue}</p>
          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 bg-[#E8F3EB] text-[#3F7A55] rounded-full">
            Recorded total
          </span>
        </div>

        <div className="bg-[#7A3E24] text-white rounded-[16px] p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#F3DED1]/70 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Profit</span>
            <DollarSign size={14} className="text-[#F3DED1]" />
          </div>
          <p className="text-2xl font-extrabold text-white font-['DM_Mono',monospace]">${profit}</p>
          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 bg-white/20 text-white rounded-full">
            {margin}% margin
          </span>
        </div>

      </div>

      {/* Public Storefront Banner Card */}
      {storefrontSlug && <div className="bg-gradient-to-r from-[#FAF1EB] to-[#F6F0E8] rounded-[20px] border border-[#E5DDD3] p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[14px] bg-[#7A3E24] text-white flex items-center justify-center font-extrabold text-xl flex-shrink-0 shadow-sm">
            <Store size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-[#2F2925] text-base">Public Storefront</h2>
              <span className="px-2 py-0.5 bg-[#E8F3EB] text-[#3F7A55] text-[10px] font-bold rounded-full">
                Accepting Orders Online
              </span>
            </div>
            <p className="text-xs text-[#6F655E] mt-0.5">
              URL: <code className="bg-white px-1.5 py-0.5 rounded text-[11px] font-mono text-[#7A3E24] border border-[#E5DDD3]">/store/{storefrontSlug}</code>
            </p>
          </div>
        </div>

        <a
          href={`/store/${storefrontSlug}`}
          target="_blank"
          rel="noreferrer"
          className="h-9 px-3.5 rounded-[10px] bg-[#7A3E24] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#934E2E] transition-colors shadow-xs active:scale-[0.98]"
        >
          <ExternalLink size={13} /> View Storefront
        </a>
      </div>}

    </div>
  );
}
