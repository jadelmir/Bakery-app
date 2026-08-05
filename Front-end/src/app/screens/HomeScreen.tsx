import { useState } from "react";
import type { Task, Order, Screen } from "../types";
import {
  TASKS, ORDERS,
  TASK_STATUS, TASK_URGENCY, ORDER_STATUS, PAYMENT_STATUS,
  CAT_COLORS, pickupDateKey, dateKey,
} from "../constants";
import { Chip } from "../components/shared/Chip";
import { SectionHeader } from "../components/shared/SectionHeader";
import { notificationsFor } from "../reporting";
import {
  selectUnpaidCustomerSummary,
  selectActiveStarterInfo,
} from "../state/selectors";
import type { BakeryDomainSnapshot } from "../domain/types";
import {
  Plus, Bell, AlertTriangle,
  DollarSign,
  Calendar,
  Check,
  Clock, Store,
  Sparkles, TrendingUp, ExternalLink,
  Timer, Droplets,
} from "lucide-react";

// ─── Task Card ──────────────────────────────────────────────────────────────

export function TaskCard({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TASK_STATUS[task.status];
  const urgencyCfg = task.urgency ? TASK_URGENCY[task.urgency] : null;
  const dotColor = CAT_COLORS[task.category] || "#988D84";
  const isActive = task.status === "pending" || task.status === "in-progress";

  const cardBorder =
    task.urgency === "overdue"  ? "border-[#B8443C]/25 shadow-sm" :
    task.urgency === "due-now"  ? "border-[#B7791F]/30 shadow-md" :
    task.status === "completed" ? "border-[#E5DDD3] opacity-55"   : "border-[#E5DDD3] shadow-sm";

  return (
    <div className={`bg-white rounded-[14px] border overflow-hidden transition-all ${cardBorder}`}>
      <div className="p-4 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start gap-3">
          <span className="text-[11px] font-['DM_Mono',monospace] text-[#988D84] pt-0.5 min-w-[36px] leading-tight">{task.time}</span>
          <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: dotColor }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-[#2F2925] text-sm leading-snug">{task.title}</p>
                <p className="text-xs text-[#6F655E] mt-0.5 truncate">
                  {task.product}{task.quantity ? ` · ${task.quantity}×` : ""}
                  {task.orderId ? <span className="text-[#B4643B] font-semibold"> · {task.orderId}</span> : null}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Chip cfg={cfg} />
                {urgencyCfg && <Chip cfg={urgencyCfg} />}
              </div>
            </div>
            {!expanded && task.status !== "completed" && (
              <div className="flex items-center gap-1 mt-2">
                <Clock size={11} className="text-[#988D84]" />
                <span className="text-xs text-[#988D84]">{task.duration} min</span>
              </div>
            )}
          </div>
        </div>
        {expanded && (
          <div className="mt-3 ml-[55px] bg-[#F6F0E8] rounded-xl p-3">
            <p className="text-xs text-[#6F655E] leading-relaxed">{task.instructions}</p>
          </div>
        )}
      </div>
      {isActive && (
        <div className="px-4 pb-3 ml-[55px] flex gap-2">
          <button
            onClick={() => onComplete(task.id)}
            className="flex-1 h-9 rounded-[10px] bg-[#7A3E24] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#934E2E] transition-colors active:scale-[0.98]"
          >
            <Check size={13} /> Complete
          </button>
          <button className="h-9 px-3 rounded-[10px] bg-[#F6F0E8] text-[#6F655E] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#EDE6DC] transition-colors">
            <Timer size={12} /> Timer
          </button>
          <button className="h-9 px-3 rounded-[10px] bg-[#F6F0E8] text-[#6F655E] text-xs font-semibold hover:bg-[#EDE6DC] transition-colors">
            Delay
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Order Card ─────────────────────────────────────────────────────────────

export function OrderCard({ order, onClick }: { order: Order; onClick?: () => void }) {
  const balance = order.total - order.paid;
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[14px] border border-[#E5DDD3] p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-['DM_Mono',monospace] text-[#988D84]">{order.id}</span>
            <Chip cfg={ORDER_STATUS[order.status]} />
          </div>
          <p className="font-bold text-[#2F2925] mt-1 text-sm">{order.customer}</p>
          <p className="text-xs text-[#6F655E] mt-0.5 line-clamp-1">
            {order.items.map(i => `${i.qty}x ${i.product}`).join(", ")}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-[#2F2925]">${order.total}</p>
          <div className="mt-1 flex justify-end"><Chip cfg={PAYMENT_STATUS[order.paymentStatus]} /></div>
          {balance > 0 && <p className="text-xs text-[#B8443C] font-bold mt-0.5">-${balance} owed</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#F0E9E0]">
        <Calendar size={11} className="text-[#B4643B]" />
        <span className="text-xs text-[#6F655E]">{order.pickup} · {order.pickupTime}</span>
        {order.notes && <span className="text-xs text-[#988D84] italic ml-auto truncate max-w-[140px]">"{order.notes}"</span>}
      </div>
    </div>
  );
}

// ─── Home Screen ────────────────────────────────────────────────────────────

export function HomeScreen({ bakeryName = "J'adore Bakery", snapshot, onNavigate, onAddOrder }: { bakeryName?: string; snapshot?: BakeryDomainSnapshot; onNavigate?: (screen: Screen) => void; onAddOrder?: () => void }) {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [showNotifications, setShowNotifications] = useState(false);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>("all");

  const now = new Date();
  const currentWeekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentDateString = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const unpaidInfo = snapshot ? selectUnpaidCustomerSummary(snapshot) : { unpaidTotal: ORDERS.reduce((s, o) => s + (o.total - o.paid), 0), summary: "Reed Family $56 · Priya Nair $29 · James Okonkwo $18" };
  const starterInfo = snapshot ? selectActiveStarterInfo(snapshot) : { name: "Earl", subtitle: "Need 350g for #024 · Feed Earl tonight by 8 PM" };
  const storefrontSlug = snapshot?.storefront?.slug || "jadore-bakery";

  const done = tasks.filter(t => t.status === "completed").length;
  const overdue = tasks.filter(t => t.urgency === "overdue");
  const unpaidTotal = unpaidInfo.unpaidTotal;
  const notifications = notificationsFor(unpaidTotal);

  const complete = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "completed" } : t));

  const filteredTasks = tasks.filter(t => {
    if (taskCategoryFilter === "all") return true;
    return t.category.toLowerCase() === taskCategoryFilter.toLowerCase();
  });

  const nextPendingTask = tasks.find(t => t.status === "pending" || t.status === "in-progress");
  const progressPercent = Math.round((done / tasks.length) * 100);

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-6 pb-28 lg:pb-10">
      {/* Artisanal Command Center Hero Header */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#7A3E24] via-[#934E2E] to-[#B4643B] p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/70">{currentWeekday}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#E8F3EB] text-[#3F7A55]">
                In Production
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{currentDateString} · {bakeryName} 🍞</h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1">
              4 active orders in queue · {tasks.length} tasks scheduled for today
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#B8443C] rounded-full ring-2 ring-[#7A3E24]" />
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
            {notifications.map(notification => (
              <div className="p-3.5 hover:bg-[#FBF8F3] transition-colors" key={notification.id}>
                <p className="text-sm font-bold text-[#2F2925]">{notification.title}</p>
                <p className="text-xs text-[#6F655E] mt-0.5">{notification.detail}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Production Progress Bar Widget */}
      <div className="bg-white rounded-[20px] border border-[#E5DDD3] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[#FAF1EB] text-[#7A3E24] flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#988D84]">Daily Production Progress</p>
              <p className="text-sm font-extrabold text-[#2F2925]">{done} of {tasks.length} tasks completed ({progressPercent}%)</p>
            </div>
          </div>
          {nextPendingTask && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#FAF1EB] border border-[#E5DDD3] rounded-full text-xs font-bold text-[#7A3E24]">
              <Clock size={12} /> Next: {nextPendingTask.title} ({nextPendingTask.time})
            </div>
          )}
        </div>

        {/* Progress bar line */}
        <div className="w-full h-3 bg-[#F6F0E8] rounded-full overflow-hidden p-0.5 flex gap-1">
          <div
            className="h-full bg-gradient-to-r from-[#7A3E24] to-[#B4643B] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Actionable Smart Priority Banners */}
      <div className="space-y-2.5">
        {overdue.length > 0 && (
          <div className="bg-[#FCE9E7] border border-[#B8443C]/25 rounded-[16px] p-4 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-[10px] bg-[#B8443C]/10 text-[#B8443C] flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-[#B8443C]">{overdue.length} task{overdue.length > 1 ? "s" : ""} overdue</p>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#B8443C] text-white rounded-full uppercase">Action Needed</span>
              </div>
              <p className="text-xs text-[#B8443C]/90 mt-0.5">{overdue.map(t => t.title).join(", ")}</p>
            </div>
          </div>
        )}

        <div className="bg-[#FCE9E7] border border-[#B8443C]/25 rounded-[16px] p-4 flex items-start gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-[10px] bg-[#B8443C]/10 text-[#B8443C] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Droplets size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-[#B8443C]">Starter Alert</p>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#B8443C] text-white rounded-full uppercase font-mono">Starter Alert</span>
            </div>
            <p className="text-xs text-[#B8443C]/90 mt-0.5">{starterInfo.subtitle}</p>
          </div>
        </div>

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
              <p className="text-xs text-[#B7791F]/90 mt-0.5">{unpaidInfo.summary}</p>
            </div>
          </div>
        )}
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-[16px] border border-[#E5DDD3] p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#988D84] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Revenue</span>
            <TrendingUp size={14} className="text-[#3F7A55]" />
          </div>
          <p className="text-2xl font-extrabold text-[#2F2925] font-['DM_Mono',monospace]">$172</p>
          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 bg-[#E8F3EB] text-[#3F7A55] rounded-full">
            +18% this week
          </span>
        </div>

        <div className="bg-[#7A3E24] text-white rounded-[16px] p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#F3DED1]/70 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Profit</span>
            <DollarSign size={14} className="text-[#F3DED1]" />
          </div>
          <p className="text-2xl font-extrabold text-white font-['DM_Mono',monospace]">$126</p>
          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 bg-white/20 text-white rounded-full">
            73% margin
          </span>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E5DDD3] p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#988D84] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tasks</span>
            <Check size={14} className="text-[#3F7A55]" />
          </div>
          <p className="text-2xl font-extrabold text-[#2F2925]">{done}/{tasks.length}</p>
          <p className="text-[11px] text-[#988D84] mt-0.5 font-semibold">done today</p>
        </div>
      </div>

      {/* Public Storefront Banner Card */}
      <div className="bg-gradient-to-r from-[#FAF1EB] to-[#F6F0E8] rounded-[20px] border border-[#E5DDD3] p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
      </div>

      {/* Today's Tasks Timeline with Category Filter */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <SectionHeader title="Today's Tasks" />
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {["all", "mixing", "shaping", "baking", "packaging"].map((cat) => (
              <button
                key={cat}
                onClick={() => setTaskCategoryFilter(cat)}
                className={`h-7 px-3 rounded-full text-xs font-bold capitalize transition-colors ${
                  taskCategoryFilter === cat
                    ? "bg-[#7A3E24] text-white"
                    : "bg-white border border-[#E5DDD3] text-[#6F655E] hover:bg-[#F6F0E8]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredTasks.map(t => <TaskCard key={t.id} task={t} onComplete={complete} />)}
          {filteredTasks.length === 0 && (
            <div className="bg-white rounded-[16px] border border-[#E5DDD3] p-8 text-center text-[#988D84]">
              <p className="text-sm font-bold text-[#2F2925]">No tasks in this category</p>
              <p className="text-xs mt-1">Select "All" to view full daily schedule.</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Orders */}
      <section>
        <SectionHeader title="Upcoming Orders" />
        <div className="space-y-2.5">
          {ORDERS.map(o => <OrderCard key={o.id} order={o} />)}
        </div>
      </section>

      {/* Tomorrow's Prep */}
      <section>
        <SectionHeader title="Tomorrow's Prep" />
        <div className="bg-white rounded-[18px] border border-[#E5DDD3] divide-y divide-[#F0E9E0] shadow-xs overflow-hidden">
          {[
            { dot: "#7A3E24", title: "Bake Sourdough Loaves", sub: "From cold fermentation · #024 · 06:30 AM" },
            { dot: "#B4643B", title: "Build starter", sub: "For Sourdough Loaves and Focaccia · Start by 07:00 AM" },
            { dot: "#B8443C", title: "Kirkland Organic Flour — 4kg short", sub: "Needed for upcoming Sourdough Loaf and Focaccia orders", danger: true },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 hover:bg-[#FBF8F3] transition-colors">
              <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: item.dot }} />
              <div>
                <p className="text-sm font-bold text-[#2F2925]">{item.title}</p>
                <p className={`text-xs mt-0.5 ${item.danger ? "text-[#B8443C] font-semibold" : "text-[#6F655E]"}`}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
