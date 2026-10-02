import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardList, Package, ShoppingBag } from "lucide-react";
import { localDateKey } from "../constants";
import type { BakeryDomainSnapshot } from "../domain/types";
import { buildPrepList, listPrepDates, type PrepListMaterialRow } from "../prepList";

function number(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function DateLabel({ value }: { value: string }) {
  const date = new Date(`${value}T12:00:00`);
  return <span>{Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>;
}

function MaterialRow({ material }: { material: PrepListMaterialRow }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-[#F0E9E0] px-4 py-3 last:border-0">
      <span className="truncate text-sm font-bold text-[#2F2925]">{material.name}</span>
      <span className="text-right text-sm font-semibold text-[#2F2925]">{number(material.required)}{material.unit}<span className="ml-1 text-xs font-medium text-[#988D84]">needed</span></span>
      <span className="text-right text-sm font-semibold text-[#6F655E]">{number(material.available)}{material.unit}<span className="ml-1 text-xs font-medium text-[#988D84]">available</span></span>
      <span className={`col-span-3 justify-self-end rounded-full px-2.5 py-1 text-xs font-extrabold sm:col-span-1 ${material.shortage > 0 ? "bg-[#FCE9E7] text-[#B8443C]" : "bg-[#E8F3EB] text-[#2D7A46]"}`}>
        {material.shortage > 0 ? `Short ${number(material.shortage)}${material.unit}` : "Covered"}
      </span>
    </div>
  );
}

function MaterialsSection({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: readonly PrepListMaterialRow[] }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#2F2925]">{icon}{title}<span className="text-xs font-semibold text-[#988D84]">{rows.length}</span></h2>
      <div className="overflow-hidden rounded-[14px] border border-[#E5DDD3] bg-white">
        {rows.length === 0 ? <p className="p-4 text-sm text-[#6F655E]">Nothing listed for this date.</p> : rows.map(row => <MaterialRow key={row.key} material={row} />)}
      </div>
    </section>
  );
}

export function PrepListScreen({ snapshot, initialDate }: { snapshot?: BakeryDomainSnapshot; initialDate?: string }) {
  const [selectedDate, setSelectedDate] = useState(() => initialDate ?? localDateKey());
  const prepDates = useMemo(() => snapshot ? listPrepDates(snapshot) : [], [snapshot]);
  const model = useMemo(() => snapshot ? buildPrepList(snapshot, selectedDate) : undefined, [snapshot, selectedDate]);
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
      return;
    }
    setSelectedDate(currentDate => prepDates.length > 0 && !prepDates.some(option => option.date === currentDate) ? prepDates[0].date : currentDate);
  }, [initialDate, prepDates]);
  if (!model) return <div className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-10"><div className="rounded-[14px] border border-[#E5DDD3] bg-white p-6 text-sm text-[#6F655E]" role="status">Loading prep list…</div></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-10">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="flex items-center gap-2 text-xl font-extrabold text-[#2F2925]"><ClipboardList size={21} className="text-[#7A3E24]" />Prep List</h1><p className="mt-1 text-xs text-[#988D84]">Ingredients and packaging to prepare before pickup.</p></div>
        <div className="text-xs font-semibold text-[#988D84]">{prepDates.length} prep day{prepDates.length === 1 ? "" : "s"} scheduled</div>
      </header>
      <section className="mb-5"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-extrabold text-[#2F2925]">Prep days</h2><span className="text-xs text-[#988D84]">Only days with scheduled prep</span></div>{prepDates.length === 0 ? <div className="rounded-[12px] border border-dashed border-[#D9CEC4] bg-[#FBF8F3] p-3 text-sm text-[#6F655E]">No prep days scheduled yet.</div> : <div className="flex gap-2 overflow-x-auto pb-1">{prepDates.map(option => { const active = option.date === selectedDate; return <button key={option.date} type="button" onClick={() => setSelectedDate(option.date)} aria-label={`View prep for ${option.date}`} className={`min-w-[118px] shrink-0 rounded-[12px] border px-3 py-2 text-left transition-colors ${active ? "border-[#7A3E24] bg-[#7A3E24] text-white" : "border-[#E5DDD3] bg-white text-[#2F2925] hover:bg-[#FBF8F3]"}`}><span className={`block text-xs font-bold ${active ? "text-[#F9E8DC]" : "text-[#6F655E]"}`}><DateLabel value={option.date} /></span><span className={`mt-1 block text-xs font-semibold ${active ? "text-white" : "text-[#988D84]"}`}>{number(option.productCount)} product{option.productCount === 1 ? "" : "s"} · {option.orderCount} order{option.orderCount === 1 ? "" : "s"}</span></button>; })}</div>}</section>
      <div className="mb-5 grid max-w-xl grid-cols-2 gap-2"><div className="rounded-[12px] border border-[#E5DDD3] bg-white px-3 py-2.5"><p className="text-[10px] font-bold uppercase tracking-wide text-[#988D84]">Prep date</p><p className="mt-0.5 text-sm font-extrabold text-[#2F2925]"><DateLabel value={model.prepDate} /></p></div><div className="rounded-[12px] border border-[#E5DDD3] bg-white px-3 py-2.5"><p className="text-[10px] font-bold uppercase tracking-wide text-[#988D84]">Products</p><p className="mt-0.5 text-sm font-extrabold text-[#2F2925]">{model.products.length}</p></div></div>
      {model.warnings.length > 0 && <section className="mb-5 rounded-[14px] border border-[#D8A84E]/40 bg-[#FFF8E8] p-3"><div className="flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#A66A00]" /><div><h2 className="text-sm font-extrabold text-[#7A4D00]">Needs attention <span className="ml-1 rounded-full bg-[#F6E2AF] px-1.5 py-0.5 text-xs">{model.warnings.length}</span></h2><p className="mt-0.5 text-xs text-[#8B6A2C]">Some prep quantities need review before you start.</p></div></div><div className="mt-3 space-y-2">{model.warnings.map(item => <div key={item.key} className="rounded-[10px] bg-white/70 p-2.5 text-sm text-[#7C5520]"><strong>{item.product}</strong><span className="mx-1">·</span>{item.message}<span className="ml-2 text-xs opacity-75">{item.customerName}</span></div>)}</div></section>}
      {model.products.length === 0 && <div className="mb-5 rounded-[14px] border border-dashed border-[#D9CEC4] bg-[#FBF8F3] p-5 text-sm text-[#6F655E]">No confirmed, in-production, or ready orders need prep on <DateLabel value={model.prepDate} />.</div>}
      <div className="grid gap-6 lg:grid-cols-2"><MaterialsSection title="Ingredients" icon={<ShoppingBag size={16} className="text-[#7A3E24]" />} rows={model.ingredients} /><MaterialsSection title="Packaging & supplies" icon={<Package size={16} className="text-[#7A3E24]" />} rows={model.packaging} /></div>
      {model.products.length > 0 && <section className="mt-6"><h2 className="mb-2 text-sm font-extrabold text-[#2F2925]">Products to prepare</h2><div className="grid gap-3 md:grid-cols-2">{model.products.map(product => <article key={product.key} className="rounded-[14px] border border-[#E5DDD3] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-[#2F2925]">{product.product}</h3><p className="mt-1 text-xs text-[#6F655E]">{number(product.quantity)} ordered · prepare {product.prepLeadDays === 0 ? "same day" : `${product.prepLeadDays} day${product.prepLeadDays === 1 ? "" : "s"} before pickup`}</p></div><span className="rounded-full bg-[#F3DED1] px-2 py-1 text-xs font-extrabold text-[#7A3E24]">{number(product.quantity)}</span></div></article>)}</div></section>}
    </div>
  );
}
