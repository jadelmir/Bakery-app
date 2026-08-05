import { useState } from "react";
import type { Customer } from "../types";
import { CUSTOMERS } from "../constants";
import { Plus, Phone, Mail, MapPin, Search } from "lucide-react";

// ─── Customers Screen ────────────────────────────────────────────────────────

export function CustomersScreen() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = CUSTOMERS.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
  });

  if (selected) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto pb-28 lg:pb-10">
        <button onClick={() => setSelected(null)} className="text-[#B4643B] text-sm font-semibold mb-5 block hover:underline">← Customers</button>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-extrabold text-[#2F2925]">{selected.name}</h1>
            {selected.balance > 0 && <span className="inline-block mt-1 text-xs bg-[#FCE9E7] text-[#B8443C] font-bold px-2.5 py-0.5 rounded-full">${selected.balance} balance owed</span>}
          </div>
          <div className="w-12 h-12 rounded-full bg-[#F3DED1] flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-extrabold text-[#7A3E24]">{selected.name[0]}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-white rounded-[14px] border border-[#E5DDD3] p-4 space-y-3">
            {[{ Icon: Phone, val: selected.phone }, { Icon: Mail, val: selected.email }, { Icon: MapPin, val: selected.address }].map(({ Icon, val }, i) => (
              <div key={i} className="flex items-start gap-3">
                <Icon size={14} className="text-[#B4643B] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[#2F2925]">{val}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[14px] border border-[#E5DDD3] p-4">
            <p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-[#6F655E] italic">"{selected.notes}"</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Orders", val: String(selected.orders), cls: "bg-white border border-[#E5DDD3]", vCls: "text-[#2F2925]" },
              { label: "Spent", val: `$${selected.totalSpent}`, cls: "bg-white border border-[#E5DDD3]", vCls: "text-[#2F2925]" },
              { label: "Balance", val: `$${selected.balance}`, cls: selected.balance > 0 ? "bg-[#FCE9E7] border border-[#B8443C]/20" : "bg-[#E8F3EB] border border-[#3F7A55]/20", vCls: selected.balance > 0 ? "text-[#B8443C]" : "text-[#3F7A55]" },
            ].map(({ label, val, cls, vCls }) => (
              <div key={label} className={`rounded-[12px] p-3 text-center ${cls}`}>
                <p className={`text-lg font-extrabold ${vCls} font-['DM_Mono',monospace]`}>{val}</p>
                <p className="text-[11px] text-[#988D84] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[14px] border border-[#E5DDD3] p-4">
            <p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider mb-3">Frequently Orders</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.favorites.map(fav => (
                <span key={fav} className="text-xs bg-[#F3DED1] text-[#7A3E24] font-bold px-2.5 py-1 rounded-full">{fav}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-28 lg:pb-10">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-extrabold text-[#2F2925]">Customers</h1>
        <button className="h-9 px-3.5 bg-[#7A3E24] text-white rounded-[10px] text-sm font-bold flex items-center gap-1.5 hover:bg-[#934E2E] transition-colors">
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or email…"
          className="w-full h-11 pl-9 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] placeholder:text-[#988D84] focus:outline-none focus:border-[#B4643B] transition-colors" />
      </div>
      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} onClick={() => setSelected(c)}
            className="bg-white rounded-[14px] border border-[#E5DDD3] p-4 cursor-pointer hover:shadow-md transition-all flex items-center gap-3 active:scale-[0.99]">
            <div className="w-10 h-10 rounded-full bg-[#F3DED1] flex items-center justify-center flex-shrink-0">
              <span className="font-extrabold text-[#7A3E24] text-sm">{c.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#2F2925] text-sm">{c.name}</p>
              <p className="text-xs text-[#988D84] truncate">{c.email}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-extrabold text-[#2F2925] font-['DM_Mono',monospace]">${c.totalSpent}</p>
              {c.balance > 0 && <p className="text-xs text-[#B8443C] font-bold">${c.balance} owed</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
