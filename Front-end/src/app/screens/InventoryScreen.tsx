import { useMemo, useState } from "react";
import type { InventoryItem, Task } from "../types";
import { INVENTORY } from "../constants";
import { SectionHeader } from "../components/shared/SectionHeader";
import { InventoryAdjustModal, type InventoryCommand } from "../components/inventory/InventoryAdjustModal";
import { ShoppingListDrawer, type ShoppingListItem } from "../components/inventory/ShoppingListDrawer";
import { buildStarterPlans, calculateRequirements, type InventoryTransaction, type StarterBuildOverride, type StarterProfile } from "../planning";
import type { ProductionTask } from "../production";
import { AlertTriangle, ClipboardList, Droplets, PackagePlus, ShoppingBag } from "lucide-react";

export function StarterScreen({ builds, profile, onProfile, onOverride, onBack }: { builds: ReturnType<typeof buildStarterPlans>; profile: StarterProfile; onProfile: (patch: Partial<StarterProfile>) => void; onOverride: (id: string, patch: StarterBuildOverride) => void; onBack: () => void }) {
  const [ratio, setRatio] = useState(`${profile.defaultRatio.seed}:${profile.defaultRatio.flour}:${profile.defaultRatio.water}`);
  return <div className="mx-auto max-w-2xl px-4 py-6 pb-28 lg:pb-10"><button onClick={onBack} className="mb-4 text-sm font-semibold text-[#B4643B]">Back to inventory</button><h1 className="text-xl font-extrabold text-[#2F2925]">Starter Manager</h1><label className="mt-4 block text-xs text-[#6F655E]">Feed ratio<input aria-label="Starter feeding ratio" value={ratio} onChange={event => { setRatio(event.target.value); const values = event.target.value.split(":").map(Number); if (values.length === 3 && values.every(value => value > 0)) onProfile({ defaultRatio: { seed: values[0], flour: values[1], water: values[2] } }); }} className="ml-2 h-9 rounded border border-[#E5DDD3] px-2" /></label><div className="mt-5 space-y-3">{builds.map(build => <article key={build.id} className="rounded-[14px] border border-[#E5DDD3] bg-white p-4"><strong>{build.peakWindow.replace("T", " ")}</strong><p className="mt-1 text-xs text-[#6F655E]">Seed {build.seedAmount}g · Flour {build.flourAmount}g · Water {build.waterAmount}g</p><label className="mt-3 block text-xs text-[#6F655E]">Override flour<input aria-label="Override starter flour" type="number" value={build.flourAmount} onChange={event => onOverride(build.id, { flourAmount: Number(event.target.value) })} className="ml-2 h-8 w-24 rounded border border-[#E5DDD3] px-2" /></label></article>)}</div></div>;
}

export interface InventoryOverviewItem extends InventoryItem {
  readonly kind?: "ingredient" | "packaging" | "finished_good";
  readonly onHand?: number;
  readonly reserved?: number;
  readonly required?: number;
  readonly allocated?: number;
  readonly packageQuantity?: number;
  readonly packagePrice?: number;
  readonly unitCost?: number;
}
export interface InventoryScreenProps {
  tasks: Task[];
  builds: ReturnType<typeof buildStarterPlans>;
  transactions: InventoryTransaction[];
  ingredients?: readonly InventoryItem[];
  /** Enriched display input that an inventory adapter may supply without changing shared domain contracts. */
  inventoryItems?: readonly InventoryOverviewItem[];
  onOpenStarter: () => void;
  onReceivePurchase?: (command: Extract<InventoryCommand, { type: "receive" }>) => Promise<void> | void;
  onPhysicalCount?: (command: Extract<InventoryCommand, { type: "physical-count" }>) => Promise<void> | void;
  onRelativeAdjustment?: (command: Extract<InventoryCommand, { type: "relative-adjustment" }>) => Promise<void> | void;
}

const groupLabels = { ingredient: "Raw ingredients", packaging: "Retail supplies", finished_good: "Finished goods" } as const;
const number = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });

export function InventoryScreen({ tasks, builds, transactions, ingredients, inventoryItems, onOpenStarter, onReceivePurchase, onPhysicalCount, onRelativeAdjustment }: InventoryScreenProps) {
  const [selectedOrder, setSelectedOrder] = useState("all"); const [entryOpen, setEntryOpen] = useState(false); const [selectedItemId, setSelectedItemId] = useState<string>(); const [shoppingOpen, setShoppingOpen] = useState(false);
  const items = (inventoryItems ?? ingredients ?? INVENTORY) as readonly InventoryOverviewItem[];
  const requirements = useMemo(() => calculateRequirements(tasks as unknown as ProductionTask[], builds, items.filter(item => (item.kind ?? "ingredient") !== "finished_good").map(item => ({ id: item.id, name: item.name, unit: item.unit, onHand: item.onHand ?? item.current, kind: item.kind === "packaging" ? "packaging" as const : "ingredient" as const })), undefined, selectedOrder === "all" ? undefined : selectedOrder), [tasks, builds, items, selectedOrder]);
  const plannedById = useMemo(() => requirements.reduce<Record<string, number>>((totals, line) => ({ ...totals, [line.itemId]: (totals[line.itemId] ?? 0) + line.required }), {}), [requirements]);
  const overview = items.map(item => {
    const kind = item.kind ?? "ingredient"; const onHand = item.onHand ?? item.current; const reserved = item.reserved ?? 0; const allocated = item.allocated ?? 0; const required = item.required ?? plannedById[item.id] ?? 0; const available = onHand - reserved - (kind === "finished_good" ? allocated : 0); const demandShortage = Math.max(0, required - available); const minimumShortage = Math.max(0, item.minLevel - available); const shortage = Math.max(demandShortage, minimumShortage); const shortageReason: ShoppingListItem["shortageReason"] = demandShortage > 0 && minimumShortage > 0 ? "both" : demandShortage > 0 ? "demand" : "minimum";
    return { ...item, kind, onHand, reserved, allocated, required, available, shortage, shortageReason };
  });
  const shortages = overview.filter(item => item.shortage > 0); const grouped = (["ingredient", "packaging", "finished_good"] as const).map(kind => [kind, overview.filter(item => item.kind === kind)] as const);
  const dispatch = async (command: InventoryCommand) => { if (command.type === "receive" && onReceivePurchase) return onReceivePurchase(command); if (command.type === "physical-count" && onPhysicalCount) return onPhysicalCount(command); if (command.type === "relative-adjustment" && onRelativeAdjustment) return onRelativeAdjustment(command); throw new Error("This inventory command is waiting for workspace integration."); };
  const shoppingItems: ShoppingListItem[] = overview.map(item => ({ itemId: item.id, name: item.name, unit: item.unit, onHand: item.onHand, reserved: item.reserved, available: item.available, minLevel: item.minLevel, required: item.required, shortage: item.shortage, shortageReason: item.shortageReason, packageQuantity: item.packageQuantity, packagePrice: item.packagePrice, unitCost: item.unitCost }));
  return <div className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-10"><header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-extrabold text-[#2F2925]">Inventory</h1><p className="mt-1 text-xs text-[#988D84]">On-hand stock, reservations, availability, and append-only history.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setShoppingOpen(true)} className="h-9 rounded-[10px] border border-[#2D7A46]/20 bg-[#EBF4EC] px-3 text-sm font-bold text-[#2D7A46]"><ShoppingBag className="mr-1 inline" size={14} />Shopping list {shortages.length ? `(${shortages.length})` : ""}</button><button onClick={() => { setSelectedItemId(undefined); setEntryOpen(true); }} className="h-9 rounded-[10px] bg-[#7A3E24] px-3 text-sm font-bold text-white"><PackagePlus className="mr-1 inline" size={14} />Record inventory</button><button onClick={onOpenStarter} className="h-9 rounded-[10px] border border-[#7A3E24] px-3 text-sm font-bold text-[#7A3E24]"><Droplets className="mr-1 inline" size={14} />Starter</button></div></header>
    <label className="mb-4 block text-xs text-[#6F655E]">Requirements for <select aria-label="Inventory order filter" value={selectedOrder} onChange={event => setSelectedOrder(event.target.value)} className="ml-2 h-8 rounded border border-[#E5DDD3] bg-white px-2"><option value="all">all scheduled orders</option>{[...new Set(tasks.map(task => task.orderId).filter(Boolean))].map(orderId => <option key={orderId} value={orderId}>{orderId}</option>)}</select></label>
    {shortages.length > 0 && <div className="mb-5 flex gap-2 rounded-[14px] border border-[#B8443C]/20 bg-[#FCE9E7] p-3 text-sm font-semibold text-[#B8443C]"><AlertTriangle size={16} />{shortages.length} item{shortages.length === 1 ? "" : "s"} need attention. Availability already accounts for reserved stock.</div>}
    <div className="space-y-5">{grouped.map(([kind, group]) => <section key={kind}><SectionHeader title={groupLabels[kind]} />{group.length === 0 ? <p className="rounded-[14px] border border-dashed border-[#E5DDD3] p-4 text-sm text-[#6F655E]">No {groupLabels[kind].toLowerCase()} tracked yet.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{group.map(item => <article key={item.id} className="rounded-[14px] border border-[#E5DDD3] bg-white p-4"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-[#2F2925]">{item.name}</h3><p className="text-xs text-[#6F655E]">{kind === "finished_good" ? `Allocated ${number(item.allocated)}${item.unit}` : `Required ${number(item.required)}${item.unit}`}</p></div><button onClick={() => { setSelectedItemId(item.id); setEntryOpen(true); }} className="text-xs font-bold text-[#7A3E24]">Record</button></div><dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><div><dt className="text-[#988D84]">On hand</dt><dd className="font-bold">{number(item.onHand)}{item.unit}</dd></div><div><dt className="text-[#988D84]">Reserved</dt><dd className="font-bold">{number(item.reserved)}{item.unit}</dd></div><div><dt className="text-[#988D84]">Available</dt><dd className={`font-bold ${item.available < 0 ? "text-[#B8443C]" : ""}`}>{number(item.available)}{item.unit}</dd></div><div><dt className="text-[#988D84]">Shortage</dt><dd className={`font-bold ${item.shortage ? "text-[#B8443C]" : "text-[#2D7A46]"}`}>{item.shortage ? `${number(item.shortage)}${item.unit}` : "None"}</dd></div></dl>{item.available < 0 && <p className="mt-3 flex gap-1 text-xs font-semibold text-[#B8443C]"><AlertTriangle size={13} />Negative stock: production can continue, but replenish this item.</p>}{item.shortage > 0 && <p className="mt-2 text-xs text-[#B8443C]">{item.shortageReason === "minimum" ? "Shortage is from the minimum-level rule." : item.shortageReason === "both" ? "Shortage is from scheduled demand and the minimum-level rule." : "Shortage is from scheduled demand after reservations."}</p>}</article>)}</div>}</section>)}</div>
    <section className="mt-5"><SectionHeader title="Inventory history" /><div className="rounded-[14px] border border-[#E5DDD3] bg-white">{transactions.length === 0 ? <p className="p-4 text-sm text-[#6F655E]">No inventory events recorded yet.</p> : transactions.slice().reverse().slice(0, 10).map(transaction => { const item = overview.find(candidate => candidate.id === transaction.itemId); return <div key={transaction.id} className="flex items-center justify-between border-b border-[#F0E9E0] p-3 text-sm last:border-0"><span><ClipboardList className="mr-2 inline text-[#7A3E24]" size={14} />{item?.name ?? transaction.itemId} · {transaction.reason}</span><strong className={transaction.quantityChange < 0 ? "text-[#B8443C]" : "text-[#2D7A46]"}>{transaction.quantityChange > 0 ? "+" : ""}{number(transaction.quantityChange)}{item?.unit ?? ""}</strong></div>; })}</div></section>
    <InventoryAdjustModal isOpen={entryOpen} onClose={() => setEntryOpen(false)} selectedItemId={selectedItemId} items={overview.map(item => ({ id: item.id, name: item.name, unit: item.unit, onHand: item.onHand }))} onCommand={dispatch} />
    <ShoppingListDrawer isOpen={shoppingOpen} onClose={() => setShoppingOpen(false)} items={shoppingItems} />
  </div>;
}
