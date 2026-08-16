import { useEffect, useState, type FormEvent } from "react";
import { Info, PackagePlus, X } from "lucide-react";

export type InventoryItemKind = "ingredient" | "packaging";
export type InventoryBaseUnit = "g" | "ml" | "unit";

export interface InventoryItemDraft {
  name: string;
  kind: InventoryItemKind;
  unit: InventoryBaseUnit;
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

export function InventoryItemCreateDialog({
  isOpen,
  onClose,
  onSubmit,
  title = "Add inventory item",
  description = "Create an ingredient or retail supply for this bakery.",
}: InventoryItemCreateDialogProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<InventoryItemKind>("ingredient");
  const [unit, setUnit] = useState<InventoryBaseUnit>("g");
  const [packageQuantity, setPackageQuantity] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [minLevel, setMinLevel] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setKind("ingredient");
    setUnit("g");
    setPackageQuantity("");
    setPackagePrice("");
    setMinLevel("");
    setError("");
    setPending(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const quantity = Number(packageQuantity);
    const price = Number(packagePrice);
    const minimum = minLevel === "" ? 0 : Number(minLevel);
    if (!trimmedName) return setError("Enter an item name.");
    if (!Number.isFinite(quantity) || quantity <= 0) return setError("Enter a package quantity greater than zero.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid package price.");
    if (!Number.isFinite(minimum) || minimum < 0) return setError("Enter a valid minimum level.");

    setError("");
    setPending(true);
    try {
      await onSubmit({ name: trimmedName, kind, unit, packageQuantity: quantity, packagePrice: price, minLevel: minimum });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The inventory item could not be created.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="inventory-item-create-title">
      <div className="w-full max-w-md rounded-[16px] border border-[#E5DDD3] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E5DDD3] pb-4">
          <div className="flex gap-2.5">
            <PackagePlus className="text-[#7A3E24]" />
            <div>
              <h2 id="inventory-item-create-title" className="font-extrabold text-[#2F2925]">{title}</h2>
              <p className="text-xs text-[#6F655E]">{description}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close add inventory item" className="p-1 text-[#6F655E]"><X /></button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <label className="block text-xs font-bold text-[#2F2925]">Item name
            <input aria-label="Inventory item name" autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Bread flour" className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3 text-sm" />
          </label>
          <fieldset>
            <legend className="text-xs font-bold text-[#2F2925]">Category</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["ingredient", "packaging"] as const).map(value => (
                <label key={value} className={`cursor-pointer rounded-lg border p-3 text-center text-xs font-bold ${kind === value ? "border-[#7A3E24] bg-[#F3DED1] text-[#7A3E24]" : "border-[#E5DDD3] text-[#6F655E]"}`}>
                  <input className="sr-only" type="radio" name="inventory-item-kind" value={value} checked={kind === value} onChange={() => setKind(value)} />
                  {value === "ingredient" ? "Ingredient" : "Retail supply"}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-[#2F2925]">Base unit
              <select aria-label="Inventory base unit" value={unit} onChange={event => setUnit(event.target.value as InventoryBaseUnit)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] bg-white px-3 text-sm">
                <option value="g">Grams (g)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="unit">Each (unit)</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-[#2F2925]">
              <span className="flex items-center gap-1">
                Minimum level
                <span
                  tabIndex={0}
                  title="Minimum level is your reorder alert threshold. If available stock drops below it, the item is flagged and appears on the shopping list. It does not purchase anything automatically. Leave it at 0 to disable alerts."
                  aria-label="Minimum level help"
                  className="group relative inline-flex cursor-help text-[#8B7B70] outline-none focus-visible:ring-2 focus-visible:ring-[#7A3E24] focus-visible:ring-offset-1"
                >
                  <Info size={13} aria-hidden="true" />
                  <span role="tooltip" aria-hidden="true" className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-64 rounded-lg border border-[#E5DDD3] bg-[#2F2925] p-2 text-left text-[11px] font-normal leading-4 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                    Minimum level is your reorder alert threshold. If available stock drops below it, the item is flagged and appears on the shopping list. It does not purchase anything automatically. Leave it at 0 to disable alerts.
                  </span>
                </span>
              </span>
              <input aria-label="Inventory minimum level" type="number" min="0" step="any" value={minLevel} onChange={event => setMinLevel(event.target.value)} placeholder="0" className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3 text-sm" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-[#2F2925]">Package quantity ({unit})
              <input aria-label="Inventory package quantity" type="number" min="0" step="any" value={packageQuantity} onChange={event => setPackageQuantity(event.target.value)} placeholder={unit === "g" ? "e.g. 10000 (10 kg)" : "e.g. 12"} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3 text-sm" />
            </label>
            <label className="block text-xs font-bold text-[#2F2925]">Package price ($)
              <input aria-label="Inventory package price" type="number" min="0" step="0.01" value={packagePrice} onChange={event => setPackagePrice(event.target.value)} placeholder="e.g. 17.00" className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3 text-sm" />
            </label>
          </div>
          <p className="rounded-lg border border-[#E5DDD3] bg-[#FBF8F3] p-3 text-xs text-[#6F655E]">
            Default unit cost: <strong className="text-[#7A3E24]">${packageQuantity && packagePrice && Number(packageQuantity) > 0 ? (Number(packagePrice) / Number(packageQuantity)).toFixed(4) : "0.0000"}/{unit}</strong>
          </p>
          <p className="text-xs text-[#6F655E]">New items start at zero on hand. Record a purchase separately when stock arrives.</p>
          {error && <p role="alert" className="rounded-lg bg-[#FCE9E7] p-3 text-xs font-semibold text-[#B8443C]">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-[#E5DDD3] pt-3">
            <button type="button" onClick={onClose} disabled={pending} className="h-10 rounded-[10px] border border-[#E5DDD3] px-4 text-sm font-bold">Cancel</button>
            <button type="submit" disabled={pending} className="h-10 rounded-[10px] bg-[#7A3E24] px-4 text-sm font-bold text-white disabled:opacity-50">{pending ? "Saving…" : "Add item"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
