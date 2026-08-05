import { CalendarClock, Check, CheckCircle2, ChevronRight, CircleDollarSign, ListChecks } from "lucide-react";
import type { Order, OrderStatus, Task } from "../../../types";
import { ORDER_STATUS, PAYMENT_STATUS, TASK_STATUS } from "../../../constants";
import { getPickupPresentation } from "../orderPresentation";

const LIFECYCLE = ["confirmed", "in-production", "ready", "completed"] as const;

export function OrderLifecycle({ status }: { status: OrderStatus }) {
  const currentIndex = LIFECYCLE.indexOf(status as (typeof LIFECYCLE)[number]);
  return (
    <ol aria-label={`Order lifecycle. Current status: ${ORDER_STATUS[status].label}`} className="grid grid-cols-4 gap-1">
      {LIFECYCLE.map((step, index) => {
        const reached = currentIndex >= index;
        const current = currentIndex === index;
        return (
          <li key={step} aria-current={current ? "step" : undefined} className="min-w-0 text-center">
            <div className="flex items-center" aria-hidden="true">
              <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${reached ? "border-[#7A3E24] bg-[#7A3E24] text-white" : "border-[#D8CEC3] bg-white text-[#988D84]"}`}>{reached && !current ? <Check size={14} /> : index + 1}</span>
              {index < LIFECYCLE.length - 1 && <span className={`absolute hidden h-0.5 ${reached && currentIndex > index ? "bg-[#7A3E24]" : "bg-[#D8CEC3]"}`} />}
            </div>
            <span className={`mt-1.5 block text-[10px] font-bold leading-tight sm:text-xs ${current ? "text-[#7A3E24]" : "text-[#6F655E]"}`}>{ORDER_STATUS[step].label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function PickupSummary({ order, now = new Date() }: { order: Order; now?: Date }) {
  const pickup = getPickupPresentation(order, now);
  if (order.status === "completed") {
    return <SummaryCard icon={<CheckCircle2 aria-hidden="true" size={18} />} title="Fulfillment">
      <p className="text-sm font-extrabold">Fulfilled at {order.pickup}</p><p className="text-xs text-[#6F655E]">{order.pickupTime}</p>
    </SummaryCard>;
  }
  return <SummaryCard icon={<CalendarClock aria-hidden="true" size={18} />} title="Pickup" emphasis={pickup.urgency === "overdue"}>
    <p className="text-sm font-extrabold">{pickup.label}</p><p className="text-xs text-[#6F655E]">{order.pickup} at {order.pickupTime}</p>
  </SummaryCard>;
}

export function PaymentSummary({ order, pending = false, error, disabled = false, onMarkPaid }: { order: Order; pending?: boolean; error?: string; disabled?: boolean; onMarkPaid?: () => void }) {
  const balance = Math.max(0, order.total - order.paid);
  return <SummaryCard icon={<CircleDollarSign aria-hidden="true" size={18} />} title="Payment" emphasis={balance > 0}>
    <p className="text-sm font-extrabold">{balance > 0 ? `$${balance.toFixed(2)} due` : "Paid in full"}</p><p className="text-xs text-[#6F655E]">{PAYMENT_STATUS[order.paymentStatus].label} · ${order.paid.toFixed(2)} of ${order.total.toFixed(2)}</p>
    {balance > 0 && onMarkPaid && <button type="button" disabled={disabled || pending} onClick={onMarkPaid} className="mt-3 h-9 w-full rounded-[9px] bg-[#7A3E24] px-3 text-xs font-bold text-white hover:bg-[#934E2E] disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Saving payment…" : "Mark as Paid"}</button>}
    {error && <p role="alert" className="mt-2 text-xs font-semibold text-[#B8443C]">{error} Try again.</p>}
  </SummaryCard>;
}

function SummaryCard({ icon, title, emphasis = false, children }: { icon: React.ReactNode; title: string; emphasis?: boolean; children: React.ReactNode }) {
  return <section aria-label={`${title} summary`} className={`rounded-[12px] border p-3 ${emphasis ? "border-[#EDC4BF] bg-[#FFF8F7] text-[#B8443C]" : "border-[#E5DDD3] bg-white text-[#2F2925]"}`}><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide">{icon}{title}</div>{children}</section>;
}

export function ProductionProgress({ tasks }: { tasks: readonly Task[] }) {
  const completed = tasks.filter(task => task.status === "completed").length;
  const next = tasks.find(task => task.status === "in-progress") ?? tasks.find(task => task.status === "pending");
  const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  return <section aria-label="Production progress" className="rounded-[12px] border border-[#E5DDD3] bg-white p-4">
    <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm font-extrabold text-[#2F2925]"><ListChecks aria-hidden="true" size={17} />Production</p><p className="text-xs font-bold text-[#6F655E]">{completed} of {tasks.length} tasks complete</p></div>
    <div role="progressbar" aria-label="Production tasks completed" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={completed} className="mt-3 h-2 overflow-hidden rounded-full bg-[#EFE7DD]"><div className="h-full rounded-full bg-[#3F7A55]" style={{ width: `${percentage}%` }} /></div>
    <p className="mt-2 text-xs text-[#6F655E]">{next ? `Next: ${next.title}` : tasks.length ? "All production tasks complete" : "No production tasks generated"}</p>
  </section>;
}

export function ProductionTaskHistory({ tasks }: { tasks: readonly Task[] }) {
  return <details className="rounded-[12px] border border-[#E5DDD3] bg-white"><summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-[#2F2925] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A3E24]"><span className="flex items-center justify-between">View task history <ChevronRight aria-hidden="true" size={16} /></span></summary><ul className="divide-y divide-[#F0E9E0] border-t border-[#F0E9E0]">{tasks.map(task => <li key={task.id} className="flex items-start justify-between gap-3 px-4 py-3"><div><p className="text-sm font-bold text-[#2F2925]">{task.title}</p><p className="text-xs text-[#6F655E]">{task.time} · {task.product}</p></div><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${TASK_STATUS[task.status].textCls} ${TASK_STATUS[task.status].bgCls}`}>{TASK_STATUS[task.status].label}</span></li>)}</ul></details>;
}

export function NextActionArea({ label, description, pending = false, error, disabled = false, onAction }: { label?: string; description?: string; pending?: boolean; error?: string; disabled?: boolean; onAction?: () => void }) {
  if (!label) return <aside aria-label="Order action" className="rounded-[12px] border border-[#E5DDD3] bg-[#F6F0E8] p-4 text-sm font-semibold text-[#6F655E]">No further lifecycle action is needed.</aside>;
  return <aside aria-label="Next order action" className="sticky bottom-3 rounded-[14px] border border-[#E5DDD3] bg-white p-3 shadow-[0_8px_30px_rgba(47,41,37,0.14)]"><p className="mb-2 text-xs text-[#6F655E]">{description}</p><button type="button" disabled={disabled || pending} onClick={onAction} className="h-11 w-full rounded-[10px] bg-[#7A3E24] px-4 text-sm font-bold text-white hover:bg-[#934E2E] disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Updating…" : label}</button>{error && <p role="alert" className="mt-2 text-xs font-semibold text-[#B8443C]">{error} Try again.</p>}</aside>;
}
