import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Mail, MapPin, Phone, ShoppingBag } from "lucide-react";
import type { Screen } from "../../types";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../constants";
import type { BakeryDomainSnapshot } from "../../domain/types";
import { selectHomeOrderCalendar, type HomeOrderDayGroup, type HomeOrderReadModel } from "../../state/selectors";
import { Chip } from "../shared/Chip";
import { SectionHeader } from "../shared/SectionHeader";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

export interface HomeOrderCalendarProps {
  readonly snapshot?: BakeryDomainSnapshot;
  readonly onNavigate?: (screen: Screen) => void;
  readonly referenceDate?: Date;
}

function OrderSummaryCard({ order, onOpen }: { order: HomeOrderReadModel; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[14px] border border-[#E5DDD3] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4643B] active:scale-[0.99]"
      aria-label={`Open order for ${order.customerName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Chip cfg={ORDER_STATUS[order.status]} />
          </div>
          <p className="mt-1 truncate text-sm font-bold text-[#2F2925]">{order.customerName}</p>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-[#6F655E]">{order.productSummary || "No products listed"}</p>
        </div>
        <ChevronRight size={16} className="mt-1 flex-shrink-0 text-[#B4643B]" aria-hidden="true" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#F0E9E0] pt-3 text-xs text-[#6F655E]">
        <span className="font-['DM_Mono',monospace]">{order.pickupTime}</span>
        <span className="flex items-center gap-1.5 truncate">
          <Chip cfg={PAYMENT_STATUS[order.paymentStatus]} />
          {order.balance > 0 ? <span className="font-bold text-[#B8443C]">${order.balance} owed</span> : null}
        </span>
      </div>
    </button>
  );
}

function DayGroup({ day, onOpen }: { day: HomeOrderDayGroup; onOpen: (order: HomeOrderReadModel) => void }) {
  return (
    <section aria-labelledby={`home-order-day-${day.dateKey}`} className="rounded-[20px] border border-[#E5DDD3] bg-[#FBF8F3] p-3.5 shadow-xs">
      <div className="mb-3 flex items-start justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h3 id={`home-order-day-${day.dateKey}`} className="text-base font-extrabold text-[#2F2925]">
              {day.isToday ? "Today" : day.label.split(",")[0]}
            </h3>
            {day.isToday ? <span className="rounded-full bg-[#7A3E24] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">Today</span> : null}
          </div>
          <p className="mt-0.5 text-xs font-semibold text-[#988D84]">{day.shortLabel}</p>
        </div>
        <span className="rounded-full bg-[#F3DED1] px-2.5 py-1 text-xs font-extrabold text-[#7A3E24]">
          {day.orders.length} {day.orders.length === 1 ? "order" : "orders"}
        </span>
      </div>
      <div className="space-y-2.5">
        {day.orders.map(order => <OrderSummaryCard key={order.id} order={order} onOpen={() => onOpen(order)} />)}
      </div>
    </section>
  );
}

function DetailLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-start gap-2.5 text-sm text-[#6F655E]">{icon}<span className="min-w-0">{children}</span></div>;
}

function OrderDetailPanel({ order, onNavigate }: { order: HomeOrderReadModel; onNavigate?: (screen: Screen) => void }) {
  return (
    <>
      <SheetHeader className="border-b border-[#E5DDD3] bg-[#FBF8F3] pr-12">
        <div className="flex flex-wrap items-center gap-2">
          <Chip cfg={ORDER_STATUS[order.status]} />
        </div>
        <SheetTitle className="text-xl font-extrabold text-[#2F2925]">{order.customerName}</SheetTitle>
        <SheetDescription className="text-sm text-[#6F655E]">Order details and fulfillment information</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <section aria-labelledby="home-order-fulfillment-heading">
          <h3 id="home-order-fulfillment-heading" className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#988D84]">Fulfillment</h3>
          <div className="space-y-2.5">
            <DetailLine icon={<CalendarDays size={16} className="mt-0.5 flex-shrink-0 text-[#B4643B]" aria-hidden="true" />}>
              {order.pickupDate} at {order.pickupTime}
            </DetailLine>
            <DetailLine icon={<ShoppingBag size={16} className="mt-0.5 flex-shrink-0 text-[#B4643B]" aria-hidden="true" />}>
              <span className="flex items-center gap-2">Payment <Chip cfg={PAYMENT_STATUS[order.paymentStatus]} /></span>
            </DetailLine>
            {order.balance > 0 ? <p className="pl-6 text-xs font-bold text-[#B8443C]">${order.balance} remaining balance</p> : null}
          </div>
        </section>

        <section aria-labelledby="home-order-customer-heading">
          <h3 id="home-order-customer-heading" className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#988D84]">Customer</h3>
          <div className="space-y-2.5">
            {order.customer?.phone ? <DetailLine icon={<Phone size={16} className="mt-0.5 flex-shrink-0 text-[#B4643B]" aria-hidden="true" />}>{order.customer.phone}</DetailLine> : null}
            {order.customer?.email ? <DetailLine icon={<Mail size={16} className="mt-0.5 flex-shrink-0 text-[#B4643B]" aria-hidden="true" />}>{order.customer.email}</DetailLine> : null}
            {order.customer?.address ? <DetailLine icon={<MapPin size={16} className="mt-0.5 flex-shrink-0 text-[#B4643B]" aria-hidden="true" />}>{order.customer.address}</DetailLine> : null}
            {!order.customer?.phone && !order.customer?.email && !order.customer?.address ? <p className="text-sm italic text-[#988D84]">No contact details provided.</p> : null}
          </div>
        </section>

        <section aria-labelledby="home-order-items-heading">
          <h3 id="home-order-items-heading" className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#988D84]">Items</h3>
          <div className="divide-y divide-[#F0E9E0] rounded-[14px] border border-[#E5DDD3] bg-white">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                <span className="font-semibold text-[#2F2925]">{item.product}</span>
                <span className="font-['DM_Mono',monospace] text-[#6F655E]">{item.quantity} ×</span>
              </div>
            ))}
          </div>
        </section>

        {order.notes ? (
          <section aria-labelledby="home-order-notes-heading">
            <h3 id="home-order-notes-heading" className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#988D84]">Notes</h3>
            <p className="rounded-[14px] bg-[#F6F0E8] p-3.5 text-sm leading-relaxed text-[#6F655E]">{order.notes}</p>
          </section>
        ) : null}
      </div>

      {onNavigate ? (
        <div className="border-t border-[#E5DDD3] bg-[#FBF8F3] p-4">
          <button
            type="button"
            onClick={() => onNavigate("orders")}
            className="h-10 w-full rounded-[12px] bg-[#7A3E24] text-sm font-bold text-white transition-colors hover:bg-[#934E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4643B] focus-visible:ring-offset-2"
          >
            Open in Orders
          </button>
        </div>
      ) : null}
    </>
  );
}

export function HomeOrderCalendar({ snapshot, onNavigate, referenceDate = new Date() }: HomeOrderCalendarProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const days = useMemo(() => snapshot ? selectHomeOrderCalendar(snapshot, referenceDate) : [], [referenceDate, snapshot]);
  const selectedOrder = days.flatMap(day => day.orders).find(order => order.id === selectedOrderId);

  if (!snapshot) {
    return (
      <section aria-label="Upcoming orders" aria-busy="true" className="space-y-3">
        <SectionHeader title="Upcoming Orders" />
        <div className="rounded-[20px] border border-[#E5DDD3] bg-white p-6 shadow-xs">
          <div className="h-4 w-40 animate-pulse rounded-full bg-[#F0E9E0]" />
          <div className="mt-3 h-16 rounded-[14px] bg-[#FBF8F3]" />
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Upcoming orders" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <SectionHeader title="Upcoming Orders" />
          <p className="mt-1 text-xs font-semibold text-[#988D84]">Today and the next six days</p>
        </div>
        <CalendarDays size={20} className="mb-1 text-[#B4643B]" aria-hidden="true" />
      </div>

      {days.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {days.map(day => <DayGroup key={day.dateKey} day={day} onOpen={order => setSelectedOrderId(order.id)} />)}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-[#D8C9BB] bg-[#FBF8F3] p-8 text-center">
          <CalendarDays size={28} className="mx-auto text-[#B4643B]" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-extrabold text-[#2F2925]">No upcoming orders</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#6F655E]">Your calendar is clear for the next seven days. Add an order when you are ready.</p>
        </div>
      )}

      <Sheet open={Boolean(selectedOrder)} onOpenChange={open => { if (!open) setSelectedOrderId(null); }}>
        <SheetContent side="right" className="w-full border-[#E5DDD3] bg-white p-0 sm:max-w-md">
          {selectedOrder ? <OrderDetailPanel order={selectedOrder} onNavigate={onNavigate} /> : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
