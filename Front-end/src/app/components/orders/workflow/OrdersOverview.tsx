import { AlertCircle, CalendarClock, CheckCircle2, ChevronRight, Search } from "lucide-react";
import type { Order, PaymentStatus } from "../../../types";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../../constants";
import {
  getPickupPresentation,
  type CurrentOrderStatus,
  type OrdersPrimaryView,
  type SecondaryOrderStatus,
} from "../orderPresentation";

export function OrdersViewTabs({ value, counts, onChange }: {
  value: OrdersPrimaryView;
  counts: Record<OrdersPrimaryView, number>;
  onChange: (view: OrdersPrimaryView) => void;
}) {
  return (
    <div role="tablist" aria-label="Order views" className="grid grid-cols-2 rounded-[12px] bg-[#EFE7DD] p-1">
      {(["current", "completed"] as const).map(view => (
        <button key={view} type="button" role="tab" aria-selected={value === view} onClick={() => onChange(view)}
          className={`min-h-10 rounded-[9px] px-3 text-sm font-bold transition-colors ${value === view ? "bg-white text-[#2F2925] shadow-sm" : "text-[#6F655E] hover:text-[#2F2925]"}`}>
          {view === "current" ? "Current" : "Completed"} <span aria-label={`${counts[view]} orders`}>({counts[view]})</span>
        </button>
      ))}
    </div>
  );
}

const STAGES: readonly { status: CurrentOrderStatus; label: string }[] = [
  { status: "confirmed", label: "Confirmed" },
  { status: "in-production", label: "In Production" },
  { status: "ready", label: "Ready for Pickup" },
];

export function CurrentWorkflowSummary({ counts, selected, onSelect }: {
  counts: Record<CurrentOrderStatus, number>;
  selected: CurrentOrderStatus | null;
  onSelect: (status: CurrentOrderStatus | null) => void;
}) {
  return (
    <div aria-label="Current order stages" className="grid grid-cols-3 gap-2">
      {STAGES.map(({ status, label }) => {
        const active = selected === status;
        return (
          <button key={status} type="button" aria-pressed={active} onClick={() => onSelect(active ? null : status)}
            className={`min-w-0 rounded-[12px] border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A3E24] ${active ? "border-[#7A3E24] bg-[#FFF8F1]" : "border-[#E5DDD3] bg-white hover:bg-[#FBF8F4]"}`}>
            <span className="block text-xl font-extrabold text-[#2F2925]">{counts[status]}</span>
            <span className="block text-[11px] font-bold leading-tight text-[#6F655E] sm:text-xs">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function OrderSecondaryFilters({ search, paymentStatus, secondaryStatus, products, selectedProduct, onSearchChange, onPaymentChange, onStatusChange, onProductChange }: {
  search: string;
  paymentStatus: PaymentStatus | "balance-due" | null;
  secondaryStatus: SecondaryOrderStatus | null;
  products: readonly string[];
  selectedProduct: string | null;
  onSearchChange: (value: string) => void;
  onPaymentChange: (value: PaymentStatus | "balance-due" | null) => void;
  onStatusChange: (value: SecondaryOrderStatus | null) => void;
  onProductChange: (value: string | null) => void;
}) {
  return (
    <div className="space-y-2" aria-label="Order filters">
      <label className="relative block">
        <span className="sr-only">Search orders</span>
        <Search aria-hidden="true" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
        <input value={search} onChange={event => onSearchChange(event.target.value)} placeholder="Search customer, order, or product"
          className="h-11 w-full rounded-[10px] border border-[#E5DDD3] bg-white pl-10 pr-4 text-sm text-[#2F2925] focus:border-[#B4643B] focus:outline-none" />
      </label>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterSelect label="Payment" value={paymentStatus ?? ""} onChange={value => onPaymentChange((value || null) as PaymentStatus | "balance-due" | null)}>
          <option value="">Any payment</option><option value="balance-due">Balance due</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="partially-paid">Partially paid</option><option value="refunded">Refunded</option>
        </FilterSelect>
        <FilterSelect label="Record status" value={secondaryStatus ?? ""} onChange={value => onStatusChange((value || null) as SecondaryOrderStatus | null)}>
          <option value="">Current view</option><option value="draft">Draft orders</option><option value="cancelled">Cancelled orders</option>
        </FilterSelect>
        <FilterSelect label="Product" value={selectedProduct ?? ""} onChange={value => onProductChange(value || null)}>
          <option value="">Any product</option>{products.map(product => <option key={product} value={product}>{product}</option>)}
        </FilterSelect>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="flex-shrink-0"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)} className="h-9 rounded-full border border-[#E5DDD3] bg-white px-3 text-xs font-bold text-[#6F655E] focus:border-[#B4643B] focus:outline-none">{children}</select></label>;
}

export function WorkflowOrderCard({ order, onOpen, now = new Date(), quiet = false }: { order: Order; onOpen: () => void; now?: Date; quiet?: boolean }) {
  const pickup = getPickupPresentation(order, now);
  const balance = Math.max(0, order.total - order.paid);
  const items = order.items.map(item => `${item.qty}× ${item.product}`).join(", ");
  const fulfilled = order.status === "completed";
  const urgent = !fulfilled && pickup.urgency === "overdue";
  return (
    <article className={`rounded-[14px] border border-[#E5DDD3] bg-white ${quiet ? "opacity-75" : ""}`}>
      <button type="button" onClick={onOpen} aria-label={`Open order ${order.id} for ${order.customer}`}
        className="w-full rounded-[14px] p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A3E24]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`flex items-center gap-1.5 text-xs font-extrabold ${urgent ? "text-[#B8443C]" : "text-[#7A3E24]"}`}>
              {fulfilled ? <CheckCircle2 aria-hidden="true" size={14} /> : urgent ? <AlertCircle aria-hidden="true" size={14} /> : <CalendarClock aria-hidden="true" size={14} />}
              <span>{fulfilled ? `Fulfilled at ${order.pickup} at ${order.pickupTime}` : `${pickup.label}: ${order.pickup} at ${order.pickupTime}`}</span>
            </p>
            <h3 className="mt-1.5 truncate text-base font-extrabold text-[#2F2925]">{order.customer}</h3>
            <p className="mt-0.5 truncate text-xs text-[#6F655E]">{items}</p>
          </div>
          <ChevronRight aria-hidden="true" size={18} className="mt-1 flex-shrink-0 text-[#988D84]" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#F0E9E0] pt-3">
          <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${ORDER_STATUS[order.status].textCls} ${ORDER_STATUS[order.status].bgCls}`}>Status: {ORDER_STATUS[order.status].label}</span>
          <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${PAYMENT_STATUS[order.paymentStatus].textCls} ${PAYMENT_STATUS[order.paymentStatus].bgCls}`}>Payment: {PAYMENT_STATUS[order.paymentStatus].label}</span>
          {balance > 0 && <span className="ml-auto text-xs font-extrabold text-[#B8443C]">${balance.toFixed(2)} due</span>}
        </div>
      </button>
    </article>
  );
}
