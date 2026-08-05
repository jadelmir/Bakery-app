import { useState } from "react";
import { ORDERS } from "../constants";
import { reportFor, reportCsv } from "../reporting";

// ─── Finances Screen ─────────────────────────────────────────────────────────

export function FinancesScreen() {
  const [product, setProduct] = useState("all");
  const [range, setRange] = useState<"all" | "july" | "empty">("all");
  const report = reportFor(ORDERS, { product, range });
  const unpaid = report.unpaid;
  const [exported, setExported] = useState(false);
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-28 lg:pb-10">
      <div className="flex items-center justify-between mb-3"><h1 className="text-xl font-extrabold text-[#2F2925]">Finances</h1><button onClick={() => { reportCsv(report); setExported(true); }} className="h-9 px-3 rounded-[8px] bg-[#7A3E24] text-white text-xs font-bold">Export CSV</button></div>
      <div className="flex gap-2 mb-5"><select aria-label="Report product filter" value={product} onChange={event => setProduct(event.target.value)} className="h-9 rounded-[8px] border border-[#E5DDD3] px-2 text-xs"><option value="all">All products</option><option>Sourdough Loaf</option><option>Focaccia</option></select><select aria-label="Report date range" value={range} onChange={event => setRange(event.target.value as typeof range)} className="h-9 rounded-[8px] border border-[#E5DDD3] px-2 text-xs"><option value="all">All dates</option><option value="july">July</option><option value="empty">No matching data</option></select></div>
      {exported && <p role="status" className="text-xs text-[#3F7A55] mb-3">Report export is ready from the current filtered results.</p>}
      {report.orders.length === 0 && <p role="status" className="rounded-[12px] bg-white border border-[#E5DDD3] p-4 text-sm text-[#6F655E] mb-5">No records match these filters. Try another date range or product.</p>}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <div className="bg-[#7A3E24] rounded-[14px] p-4">
          <p className="text-[11px] text-[#F3DED1]/70 font-semibold uppercase tracking-wider">Revenue — July</p>
          <p className="text-2xl font-extrabold text-white mt-1.5 font-['DM_Mono',monospace]">${report.revenue}</p>
          <p className="text-[11px] text-[#F3DED1]/60 mt-1">↑ 23% vs June</p>
        </div>
        <div className="bg-white rounded-[14px] border border-[#E5DDD3] p-4">
          <p className="text-[11px] text-[#988D84] font-semibold uppercase tracking-wider">Gross Profit</p>
          <p className="text-2xl font-extrabold text-[#3F7A55] mt-1.5 font-['DM_Mono',monospace]">${report.profit}</p>
          <p className="text-[11px] text-[#988D84] mt-1">73% margin</p>
        </div>
        <div className="bg-white rounded-[14px] border border-[#E5DDD3] p-4">
          <p className="text-[11px] text-[#988D84] font-semibold uppercase tracking-wider">Costs</p>
          <p className="text-2xl font-extrabold text-[#2F2925] mt-1.5 font-['DM_Mono',monospace]">$46</p>
          <p className="text-[11px] text-[#988D84] mt-1">ingredients + packaging</p>
        </div>
        <div className="bg-[#FCE9E7] rounded-[14px] border border-[#B8443C]/20 p-4">
          <p className="text-[11px] text-[#B8443C] font-semibold uppercase tracking-wider">Unpaid</p>
          <p className="text-2xl font-extrabold text-[#B8443C] mt-1.5 font-['DM_Mono',monospace]">${unpaid}</p>
          <p className="text-[11px] text-[#B8443C]/70 mt-1">3 orders pending</p>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-[#E5DDD3] mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5DDD3]">
          <p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider">Best Sellers — July</p>
        </div>
        {[
          { name: "Sourdough Loaf", units: 9, revenue: 126 },
          { name: "Focaccia", units: 4, revenue: 32 },
        ].map((item, i, arr) => (
          <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-[#F0E9E0]" : ""}`}>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-['DM_Mono',monospace] text-[#988D84] w-4">{i + 1}</span>
              <p className="text-sm font-semibold text-[#2F2925]">{item.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-[#2F2925] font-['DM_Mono',monospace]">${item.revenue}</p>
              <p className="text-xs text-[#988D84]">{item.units} sold</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[14px] border border-[#E5DDD3] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5DDD3]">
          <p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider">Unpaid Balances</p>
        </div>
        {ORDERS.filter(o => o.total > o.paid).map((o, i, arr) => (
          <div key={o.id} className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-[#F0E9E0]" : ""}`}>
            <div>
              <p className="text-sm font-semibold text-[#2F2925]">{o.customer}</p>
              <p className="text-xs text-[#988D84]">{o.id} · due {o.pickup}</p>
            </div>
            <p className="text-sm font-extrabold text-[#B8443C] font-['DM_Mono',monospace]">${o.total - o.paid}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
