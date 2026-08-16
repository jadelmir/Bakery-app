import { useMemo, useState } from "react";
import { Download, ExternalLink, TrendingDown, TrendingUp } from "lucide-react";

import type { BakeryDomainSnapshot } from "../domain/types";
import { reportCsv, reportFor, type ReportRange } from "../reporting";
import { selectFinanceOrders } from "../state/selectors";
import type { Screen } from "../types";

type FinancesScreenProps = {
  snapshot?: BakeryDomainSnapshot;
  onNavigate?: (screen: Screen) => void;
};

const money = (value: number) => `$${value.toFixed(2)}`;
const number = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const rangeLabels: Record<ReportRange, string> = {
  all: "All dates",
  today: "Today",
  week: "This week",
  month: "This month",
  custom: "Custom range",
  empty: "No matching data",
};

const downloadCsv = (csv: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  if (typeof URL.createObjectURL !== "function") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bakery-finance-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(url);
};

function MetricCard({ label, value, detail, tone = "light" }: { label: string; value: string; detail?: string; tone?: "light" | "dark" | "green" | "red" }) {
  const styles = {
    light: "bg-white border-[#E5DDD3] text-[#2F2925]",
    dark: "bg-[#7A3E24] border-[#7A3E24] text-white",
    green: "bg-[#EBF4EC] border-[#B9D9BE] text-[#2D7A46]",
    red: "bg-[#FCE9E7] border-[#E4B8B4] text-[#B8443C]",
  }[tone];
  return (
    <div className={`rounded-[14px] border p-4 ${styles}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1.5 font-['DM_Mono',monospace] text-2xl font-extrabold">{value}</p>
      {detail && <p className="mt-1 text-[11px] opacity-70">{detail}</p>}
    </div>
  );
}

export function FinancesScreen({ snapshot, onNavigate }: FinancesScreenProps) {
  const [product, setProduct] = useState("all");
  const [range, setRange] = useState<ReportRange>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>();
  const [selectedOrderId, setSelectedOrderId] = useState<string>();
  const [exported, setExported] = useState(false);

  const financeOrders = useMemo(() => snapshot ? selectFinanceOrders(snapshot) : [], [snapshot]);
  const products = useMemo(() => [...new Set(financeOrders.flatMap(order => order.items.map(item => item.product)))].sort(), [financeOrders]);
  const report = useMemo(() => reportFor(financeOrders, {
    product,
    range,
    startDate: customStart,
    endDate: customEnd,
  }, { inventoryFinance: snapshot?.inventoryFinance }), [customEnd, customStart, financeOrders, product, range, snapshot?.inventoryFinance]);

  const selectedProductDetail = report.products.find(item => item.product === selectedProduct);
  const selectedOrder = report.orders.find(order => order.id === selectedOrderId);
  const maxTrendValue = Math.max(...report.trend.map(point => Math.max(point.revenue, point.profit)), 1);
  const rangeDescription = range === "custom" && customStart
    ? `${customStart}${customEnd ? ` to ${customEnd}` : ""}`
    : rangeLabels[range];

  const handleRangeChange = (next: ReportRange) => {
    setRange(next);
    setExported(false);
  };

  const handleExport = () => {
    downloadCsv(reportCsv(report));
    setExported(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-10">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#2F2925]">Finances</h1>
          <p className="mt-1 text-xs text-[#988D84]">A clear view of sales, costs, profit, and cash still to collect.</p>
        </div>
        <button type="button" onClick={handleExport} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-[#7A3E24] px-3 text-xs font-bold text-white">
          <Download size={14} /> Export CSV
        </button>
      </header>

      <section aria-label="Finance filters" className="mb-5 rounded-[14px] border border-[#E5DDD3] bg-white p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs font-semibold text-[#6F655E]">
            Period
            <select aria-label="Report date range" value={range} onChange={event => handleRangeChange(event.target.value as ReportRange)} className="h-9 rounded-[8px] border border-[#E5DDD3] bg-white px-2 text-xs">
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          <label className="grid min-w-44 gap-1 text-xs font-semibold text-[#6F655E]">
            Product
            <select aria-label="Report product filter" value={product} onChange={event => { setProduct(event.target.value); setSelectedProduct(undefined); setExported(false); }} className="h-9 rounded-[8px] border border-[#E5DDD3] bg-white px-2 text-xs">
              <option value="all">All products</option>
              {products.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          {range === "custom" && <>
            <label className="grid gap-1 text-xs font-semibold text-[#6F655E]">From<input aria-label="Report start date" type="date" value={customStart} onChange={event => setCustomStart(event.target.value)} className="h-9 rounded-[8px] border border-[#E5DDD3] px-2 text-xs" /></label>
            <label className="grid gap-1 text-xs font-semibold text-[#6F655E]">To<input aria-label="Report end date" type="date" value={customEnd} onChange={event => setCustomEnd(event.target.value)} className="h-9 rounded-[8px] border border-[#E5DDD3] px-2 text-xs" /></label>
          </>}
          <p className="ml-auto text-xs text-[#988D84]">Showing {rangeDescription} · {report.orders.length} order{report.orders.length === 1 ? "" : "s"}</p>
        </div>
      </section>

      {exported && <p role="status" className="mb-3 rounded-[10px] bg-[#EBF4EC] px-3 py-2 text-xs font-semibold text-[#2D7A46]">Report export is ready — your filtered Finance report downloaded successfully.</p>}
      {!snapshot && <p role="status" className="mb-5 rounded-[12px] border border-[#E5DDD3] bg-white p-4 text-sm text-[#6F655E]">Loading financial data for this bakery…</p>}
      {snapshot && report.orders.length === 0 && <p role="status" className="mb-5 rounded-[12px] border border-dashed border-[#E5DDD3] bg-white p-4 text-sm text-[#6F655E]">No records match these filters. No sales match the selected period or product; try widening your filters.</p>}

      <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <MetricCard label="Revenue" value={money(report.revenue)} detail={rangeDescription} tone="dark" />
        <MetricCard label="Product cost" value={report.costsAvailable ? money(report.costs) : "Unavailable"} detail={report.costsAvailable ? "Recipe or usage cost" : "No cost source recorded"} />
        <MetricCard label="Gross profit" value={report.costsAvailable ? money(report.profit) : "Unavailable"} detail={report.costsAvailable ? `${report.marginPercent.toFixed(1)}% margin` : "Add cost data to calculate"} tone="green" />
        <MetricCard label="Unpaid" value={money(report.unpaid)} detail={`${report.orders.filter(order => order.unpaid > 0).length} order${report.orders.filter(order => order.unpaid > 0).length === 1 ? "" : "s"} pending`} tone={report.unpaid > 0 ? "red" : "light"} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MetricCard label="Units sold" value={number(report.units)} />
        <MetricCard label="Average order" value={money(report.averageOrderValue)} />
        {report.inventoryFinance?.purchaseSpend !== undefined && <MetricCard label="Purchase spend" value={money(report.inventoryFinance.purchaseSpend)} detail="Inventory cash spend" />}
        {report.inventoryFinance?.inventoryValue !== undefined && <MetricCard label="Inventory value" value={money(report.inventoryFinance.inventoryValue)} detail="Current stock value" />}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[14px] border border-[#E5DDD3] bg-white p-4" aria-labelledby="finance-trend-heading">
          <div className="mb-4 flex items-center justify-between"><div><h2 id="finance-trend-heading" className="text-sm font-extrabold text-[#2F2925]">Revenue and profit trend</h2><p className="mt-1 text-xs text-[#988D84]">Grouped by order date for the selected period.</p></div><TrendingUp size={18} className="text-[#3F7A55]" /></div>
          {report.trend.length === 0 ? <p className="py-6 text-sm text-[#988D84]">Trend data will appear when orders match the selected filters.</p> : <div className="space-y-3">{report.trend.map(point => <div key={point.date} aria-label={`${point.date}: ${money(point.revenue)} revenue, ${money(point.profit)} profit`}><div className="mb-1 flex justify-between text-xs text-[#6F655E]"><span>{point.date}</span><span>{money(point.revenue)} revenue · {money(point.profit)} profit</span></div><div className="flex h-2 gap-1"><span className="rounded-full bg-[#B97855]" style={{ width: `${Math.max(3, (point.revenue / maxTrendValue) * 100)}%` }} /><span className="rounded-full bg-[#3F7A55]" style={{ width: `${Math.max(3, (Math.max(0, point.profit) / maxTrendValue) * 100)}%` }} /></div></div>)}</div>}
          <div className="mt-4 flex gap-4 text-[11px] font-semibold text-[#6F655E]"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#B97855]" />Revenue</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#3F7A55]" />Profit</span></div>
        </section>

        <section className="rounded-[14px] border border-[#E5DDD3] bg-white p-4" aria-labelledby="finance-products-heading">
          <div className="mb-3 flex items-center justify-between"><h2 id="finance-products-heading" className="text-sm font-extrabold text-[#2F2925]">Product performance</h2><span className="text-xs text-[#988D84]">{report.products.length} product{report.products.length === 1 ? "" : "s"}</span></div>
          {report.products.length === 0 ? <p className="py-6 text-sm text-[#988D84]">No product performance for this report.</p> : <div className="divide-y divide-[#F0E9E0]">{report.products.map(item => <button type="button" key={item.product} onClick={() => setSelectedProduct(selectedProduct === item.product ? undefined : item.product)} className={`flex w-full items-center justify-between py-3 text-left ${selectedProduct === item.product ? "rounded-[8px] bg-[#FBF6F0] px-2" : ""}`}><span><span className="block text-sm font-bold text-[#2F2925]">{item.product}</span><span className="text-xs text-[#988D84]">{number(item.units)} sold · {item.costsAvailable ? `${item.marginPercent.toFixed(1)}% margin` : "cost unavailable"}</span></span><span className="font-['DM_Mono',monospace] text-sm font-extrabold text-[#2F2925]">{money(item.revenue)}</span></button>)}</div>}
          {selectedProductDetail && <div className="mt-3 rounded-[10px] bg-[#FBF6F0] p-3 text-xs text-[#6F655E]"><p className="font-bold text-[#2F2925]">{selectedProductDetail.product} detail</p><p className="mt-1">{money(selectedProductDetail.revenue)} revenue · {selectedProductDetail.costsAvailable ? `${money(selectedProductDetail.cost)} cost · ${money(selectedProductDetail.profit)} profit` : "cost data unavailable"}</p><div className="mt-2 flex flex-wrap gap-1.5">{selectedProductDetail.orderIds.map(orderId => <button type="button" key={orderId} onClick={() => setSelectedOrderId(orderId)} className="rounded-full border border-[#D9C2B0] px-2 py-1 text-[11px] font-bold text-[#7A3E24]">Open {orderId}</button>)}</div></div>}
        </section>
      </div>

      <section className="mt-4 rounded-[14px] border border-[#E5DDD3] bg-white p-4" aria-labelledby="finance-unpaid-heading">
        <div className="mb-3 flex items-center justify-between"><div><h2 id="finance-unpaid-heading" className="text-sm font-extrabold text-[#2F2925]">Unpaid balances</h2><p className="mt-1 text-xs text-[#988D84]">Select an order to review its balance and contributing lines.</p></div><TrendingDown size={18} className="text-[#B8443C]" /></div>
        {report.orders.filter(order => order.unpaid > 0).length === 0 ? <p className="py-3 text-sm text-[#3F7A55]">No unpaid balances in this report.</p> : <div className="divide-y divide-[#F0E9E0]">{report.orders.filter(order => order.unpaid > 0).map(order => <button type="button" key={order.id} onClick={() => setSelectedOrderId(selectedOrderId === order.id ? undefined : order.id)} className="flex w-full items-center justify-between py-3 text-left"><span><span className="block text-sm font-bold text-[#2F2925]">{order.customer ?? order.id}</span><span className="text-xs text-[#988D84]">{order.id} · due {order.pickup}</span></span><span className="font-['DM_Mono',monospace] text-sm font-extrabold text-[#B8443C]">{money(order.unpaid)}</span></button>)}</div>}
        {selectedOrder && <div className="mt-3 rounded-[10px] border border-[#E4B8B4] bg-[#FCE9E7] p-3 text-xs text-[#6F655E]"><p className="font-bold text-[#2F2925]">{selectedOrder.id} details</p><p className="mt-1">{selectedOrder.selectedItems.map(item => `${item.qty} × ${item.product}`).join(" · ")}</p><p className="mt-1 font-bold text-[#B8443C]">{money(selectedOrder.unpaid)} remaining · {money(selectedOrder.revenue)} in this report</p>{onNavigate && <button type="button" onClick={() => onNavigate("orders")} className="mt-2 inline-flex items-center gap-1 font-bold text-[#7A3E24]">Open Orders <ExternalLink size={13} /></button>}</div>}
      </section>
    </div>
  );
}
