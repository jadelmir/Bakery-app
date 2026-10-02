import { useEffect, useState, type FormEvent } from "react";
import { Info, PackagePlus, X } from "lucide-react";

export type InventoryItemKind = "ingredient" | "packaging";
export type InventoryBaseUnit = "g" | "ml" | "unit";

export interface InventoryItemDraft {
  name: string;
  kind: InventoryItemKind;
  unit: InventoryBaseUnit;
  initialOnHand: number;
  packageQuantity: number;
  packagePrice: number;
  minLevel: number;
}

export interface InventoryItemCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (draft: InventoryItemDraft) => Promise<void> | void;
  title?: string;
  description?: string;
}

const inputClass = "mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3 text-sm focus:border-[#7A3E24] focus:outline-none focus:ring-2 focus:ring-[#7A3E24]/15";

export function InventoryItemCreateDialog({ isOpen, onClose, onSubmit, title = "Add inventory item", description = "Create an ingredient or retail supply for this bakery." }: InventoryItemCreateDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<InventoryItemKind>("ingredient");
  const [unit, setUnit] = useState<InventoryBaseUnit>("g");
  const [initialOnHand, setInitialOnHand] = useState("0");
  const [packageQuantity, setPackageQuantity] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [minLevel, setMinLevel] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1); setName(""); setKind("ingredient"); setUnit("g"); setInitialOnHand("0");
    setPackageQuantity(""); setPackagePrice(""); setMinLevel(""); setError(""); setPending(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const validateIdentity = () => {
    if (!name.trim()) { setError("Enter an item name."); return false; }
    return true;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (step === 1) { if (validateIdentity()) setStep(2); return; }
    if (!validateIdentity()) return;
    const opening = initialOnHand === "" ? 0 : Number(initialOnHand);
    const quantity = Number(packageQuantity); const price = Number(packagePrice); const minimum = minLevel === "" ? 0 : Number(minLevel);
    if (!Number.isFinite(opening) || opening < 0) return setError("Enter an initial quantity of zero or greater.");
    if (!Number.isFinite(quantity) || quantity <= 0) return setError("Enter a package quantity greater than zero.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid package price.");
    if (!Number.isFinite(minimum) || minimum < 0) return setError("Enter a valid minimum level.");
    setPending(true);
    try {
      await onSubmit({ name: name.trim(), kind, unit, initialOnHand: opening, packageQuantity: quantity, packagePrice: price, minLevel: minimum });
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The inventory item could not be created."); }
    finally { setPending(false); }
  };

  const unitCost = packageQuantity && packagePrice && Number(packageQuantity) > 0 ? (Number(packagePrice) / Number(packageQuantity)).toFixed(4) : "0.0000";

  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="inventory-item-create-title">
    <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[18px] border border-[#E5DDD3] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[16px]">
      <div className="flex items-start justify-between border-b border-[#E5DDD3] pb-4"><div className="flex gap-2.5"><PackagePlus className="text-[#7A3E24]" /><div><h2 id="inventory-item-create-title" className="font-extrabold text-[#2F2925]">{title}</h2><p className="text-xs text-[#6F655E]">{description}</p></div></div><button type="button" onClick={onClose} aria-label="Close add inventory item" className="min-h-10 min-w-10 p-1 text-[#6F655E]"><X /></button></div>
      <div className="flex items-center gap-2 py-4" aria-label="Inventory item creation progress">{[{ value: 1, label: "Item details" }, { value: 2, label: "Stock & pricing" }].map(({ value, label }) => <div key={value} className="flex flex-1 items-center gap-2"><span aria-current={step === value ? "step" : undefined} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${step >= value ? "bg-[#7A3E24] text-white" : "bg-[#F6F0E8] text-[#988D84]"}`}>{value}</span><span className={`text-xs font-bold ${step === value ? "text-[#7A3E24]" : "text-[#988D84]"}`}>{label}</span>{value === 1 && <span className="h-px flex-1 bg-[#E5DDD3]" />}</div>)}</div>
      <form onSubmit={submit} className="space-y-4">
        {step === 1 ? <>
          <label className="block text-xs font-bold text-[#2F2925]">Item name<input aria-label="Inventory item name" autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Bread flour" className={inputClass} /></label>
          <fieldset><legend className="text-xs font-bold text-[#2F2925]">Category</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["ingredient", "packaging"] as const).map(value => <label key={value} className={`cursor-pointer rounded-lg border p-3 text-center text-xs font-bold ${kind === value ? "border-[#7A3E24] bg-[#F3DED1] text-[#7A3E24]" : "border-[#E5DDD3] text-[#6F655E]"}`}><input className="sr-only" type="radio" name="inventory-item-kind" value={value} checked={kind === value} onChange={() => setKind(value)} />{value === "ingredient" ? "Ingredient" : "Retail supply"}</label>)}</div></fieldset>
          <label className="block text-xs font-bold text-[#2F2925]">Base unit<select aria-label="Inventory base unit" value={unit} onChange={event => setUnit(event.target.value as InventoryBaseUnit)} className={`${inputClass} bg-white`}><option value="g">Grams (g)</option><option value="ml">Milliliters (ml)</option><option value="unit">Each (unit)</option></select></label>
          <p className="rounded-lg border border-[#E5DDD3] bg-[#FBF8F3] p-3 text-xs text-[#6F655E]">Next: set opening stock, package pricing, and reorder alerts.</p>
        </> : <>
          <label className="block text-xs font-bold text-[#2F2925]">Initial quantity on hand ({unit})<input aria-label="Inventory initial on-hand quantity" type="number" min="0" step="any" value={initialOnHand} onChange={event => setInitialOnHand(event.target.value)} placeholder="0" className={inputClass} /></label>
          <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-bold text-[#2F2925]">Minimum level <span className="ml-1 inline-flex" title="Minimum level is your reorder alert threshold." aria-label="Minimum level help"><Info size={13} className="text-[#8B7B70]" /></span><input aria-label="Inventory minimum level" type="number" min="0" step="any" value={minLevel} onChange={event => setMinLevel(event.target.value)} placeholder="0" className={inputClass} /></label><label className="block text-xs font-bold text-[#2F2925]">Package quantity ({unit})<input aria-label="Inventory package quantity" type="number" min="0" step="any" value={packageQuantity} onChange={event => setPackageQuantity(event.target.value)} placeholder={unit === "g" ? "e.g. 10000" : "e.g. 12"} className={inputClass} /></label></div>
          <label className="block text-xs font-bold text-[#2F2925]">Package price ($)<input aria-label="Inventory package price" type="number" min="0" step="0.01" value={packagePrice} onChange={event => setPackagePrice(event.target.value)} placeholder="e.g. 17.00" className={inputClass} /></label>
          <div className="grid gap-2 rounded-lg border border-[#E5DDD3] bg-[#FBF8F3] p-3 text-xs text-[#6F655E] sm:grid-cols-2"><p>Default unit cost: <strong className="text-[#7A3E24]">${unitCost}/{unit}</strong></p><p>{Number(initialOnHand || 0) > 0 ? `Opening stock: ${Number(initialOnHand).toLocaleString()} ${unit}` : "Starts at zero on hand"}</p></div>
          <p className="text-xs text-[#6F655E]">Opening stock is recorded for history, not as a purchase. Use Record inventory for later receipts.</p>
        </>}
        {error && <p role="alert" className="rounded-lg bg-[#FCE9E7] p-3 text-xs font-semibold text-[#B8443C]">{error}</p>}
        <div className="sticky bottom-0 flex justify-between gap-3 border-t border-[#E5DDD3] bg-white pt-3"><div>{step === 2 && <button type="button" onClick={() => { setError(""); setStep(1); }} disabled={pending} className="min-h-10 rounded-[10px] border border-[#E5DDD3] px-4 text-sm font-bold">Back</button>}</div><div className="flex gap-3"><button type="button" onClick={onClose} disabled={pending} className="min-h-10 rounded-[10px] border border-[#E5DDD3] px-4 text-sm font-bold">Cancel</button><button type="submit" disabled={pending} className="min-h-10 rounded-[10px] bg-[#7A3E24] px-4 text-sm font-bold text-white disabled:opacity-50">{pending ? "Saving…" : step === 1 ? "Continue" : "Add item"}</button></div></div>
      </form>
    </div>
  </div>;
}
