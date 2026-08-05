import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { RECIPES } from "../constants";
import type { Recipe } from "../types";

export function RecipesScreen() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);

  const filtered = RECIPES.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  const margin = (r: Recipe) => Math.round((r.profit / r.sellingPrice) * 100);

  if (selected) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto pb-28 lg:pb-10">
        <button onClick={() => setSelected(null)} className="text-[#B4643B] text-sm font-semibold mb-5 block hover:underline">← Recipes</button>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#2F2925]">{selected.name}</h1>
            <p className="text-sm text-[#988D84] mt-0.5">{selected.yield}</p>
          </div>
          <button className="h-8 px-3 border border-[#E5DDD3] rounded-[8px] text-xs text-[#6F655E] font-semibold hover:bg-[#F6F0E8] transition-colors">Edit</button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-[12px] border border-[#E5DDD3] p-3 text-center">
            <p className="text-[11px] text-[#988D84] font-semibold uppercase tracking-wider">Cost</p>
            <p className="text-lg font-extrabold text-[#2F2925] mt-1 font-['DM_Mono',monospace]">{selected.batchCost.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-[12px] border border-[#E5DDD3] p-3 text-center">
            <p className="text-[11px] text-[#988D84] font-semibold uppercase tracking-wider">Price</p>
            <p className="text-lg font-extrabold text-[#2F2925] mt-1 font-['DM_Mono',monospace]">{selected.sellingPrice}</p>
          </div>
          <div className="bg-[#E8F3EB] rounded-[12px] p-3 text-center">
            <p className="text-[11px] text-[#3F7A55] font-semibold uppercase tracking-wider">Margin</p>
            <p className="text-lg font-extrabold text-[#3F7A55] mt-1">{margin(selected)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E5DDD3] overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-[#E5DDD3]">
            <p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider">Ingredients</p>
          </div>
          {selected.ingredients.map((ing, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[#F0E9E0] last:border-0">
              <div>
                <p className="text-sm text-[#2F2925]">{ing.name}</p>
                <p className="text-xs text-[#988D84]">{ing.qty}</p>
              </div>
              <p className="text-sm font-['DM_Mono',monospace] text-[#6F655E]">{ing.cost.toFixed(2)}</p>
            </div>
          ))}
          <div className="px-4 py-3 bg-[#F6F0E8] flex justify-between">
            <p className="text-sm font-semibold text-[#2F2925]">Total ingredient cost</p>
            <p className="text-sm font-extrabold font-['DM_Mono',monospace] text-[#2F2925]">{selected.batchCost.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E5DDD3] p-4">
          <p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider mb-2">Production Flow</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7A3E24]" />
            <p className="text-sm font-semibold text-[#2F2925]">{selected.flow}</p>
          </div>
          <button className="mt-2.5 text-xs text-[#B4643B] font-semibold hover:underline">View flow →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-28 lg:pb-10">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-extrabold text-[#2F2925]">Recipes</h1>
        <button className="h-9 px-3.5 bg-[#7A3E24] text-white rounded-[10px] text-sm font-bold flex items-center gap-1.5 hover:bg-[#934E2E] transition-colors">
          <Plus size={14} /> New Recipe
        </button>
      </div>
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes..."
          className="w-full h-11 pl-9 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] placeholder:text-[#988D84] focus:outline-none focus:border-[#B4643B] transition-colors" />
      </div>
      <div className="space-y-2.5">
        {filtered.map(r => (
          <div key={r.id} onClick={() => setSelected(r)}
            className="bg-white rounded-[14px] border border-[#E5DDD3] p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-[#2F2925]">{r.name}</p>
                <p className="text-xs text-[#988D84] mt-0.5">{r.yield} · {r.flow}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-[#2F2925]">{r.sellingPrice}</p>
                <p className="text-xs text-[#3F7A55] font-bold mt-0.5">{margin(r)}% margin</p>
              </div>
            </div>
            <div className="flex gap-5 pt-3 border-t border-[#F0E9E0]">
              <div>
                <p className="text-[11px] text-[#988D84] font-semibold uppercase tracking-wider">Batch cost</p>
                <p className="text-sm font-bold text-[#2F2925] mt-0.5 font-['DM_Mono',monospace]">{r.batchCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#988D84] font-semibold uppercase tracking-wider">Profit</p>
                <p className="text-sm font-bold text-[#3F7A55] mt-0.5 font-['DM_Mono',monospace]">{r.profit.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
