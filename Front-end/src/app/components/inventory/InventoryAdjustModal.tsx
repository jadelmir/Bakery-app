import { useEffect, useState, type FormEvent } from "react";
import { PackagePlus, X } from "lucide-react";

export interface InventoryItemOption {
  id: string;
  name: string;
  unit: string;
  current?: number;
  onHand?: number;
  kind?: "ingredient" | "packaging" | "finished_good";
  minLevel?: number;
  packageQuantity?: number;
  packagePrice?: number;
}

export type InventoryCommand =
  | { type: "receive"; itemId: string; packageCount: number; packageQuantity: number; baseQuantity: number; packagePrice?: number; invoiceRef?: string; notes?: string }
  | { type: "physical-count"; itemId: string; count: number; notes?: string }
  | { type: "relative-adjustment"; itemId: string; quantityChange: number; notes?: string }
  | { type: "edit-item"; itemId: string; name: string; kind: "ingredient" | "packaging"; unit: "g" | "ml" | "unit"; packageQuantity: number; packagePrice: number; minLevel: number }
  | { type: "delete-item"; itemId: string };

export type InventoryEntryAction = Exclude<InventoryCommand["type"], "delete-item">;

export interface InventoryAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: readonly InventoryItemOption[];
  selectedItemId?: string;
  initialAction?: InventoryEntryAction;
  onCommand?: (command: InventoryCommand) => Promise<void> | void;
  onConfirm?: (data: { itemId: string; quantityAdded: number; unitCost?: number; invoiceRef?: string; notes?: string }) => Promise<void> | void;
}

const actions = [
  ["receive", "Receive purchase"],
  ["physical-count", "Physical count"],
  ["relative-adjustment", "Relative adjustment"],
  ["edit-item", "Edit item"],
] as const;

export function InventoryAdjustModal({ isOpen, onClose, items = [], selectedItemId, initialAction = "receive", onCommand, onConfirm }: InventoryAdjustModalProps) {
  const [itemId, setItemId] = useState(selectedItemId || items[0]?.id || "");
  const [action, setAction] = useState<InventoryEntryAction>(initialAction);
  const [packageCount, setPackageCount] = useState("");
  const [packageQuantity, setPackageQuantity] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [count, setCount] = useState("");
  const [quantityChange, setQuantityChange] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"ingredient" | "packaging">("ingredient");
  const [unit, setUnit] = useState<"g" | "ml" | "unit">("g");
  const [minLevel, setMinLevel] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const setItemFields = (nextItem: InventoryItemOption | undefined) => {
    setPackageQuantity(nextItem?.packageQuantity ? String(nextItem.packageQuantity) : "");
    setPackagePrice(nextItem?.packagePrice !== undefined ? String(nextItem.packagePrice) : "");
    setName(nextItem?.name ?? "");
    setKind(nextItem?.kind === "packaging" ? "packaging" : "ingredient");
    setUnit(nextItem?.unit === "ml" || nextItem?.unit === "unit" ? nextItem.unit : "g");
    setMinLevel(nextItem?.minLevel !== undefined ? String(nextItem.minLevel) : "");
  };

  useEffect(() => {
    if (!isOpen) return;
    const initialItem = items.find(item => item.id === selectedItemId) ?? items[0];
    setItemId(selectedItemId || items[0]?.id || "");
    setAction(initialAction);
    setPackageCount("1");
    setItemFields(initialItem);
    setCount(""); setQuantityChange(""); setInvoiceRef(""); setNotes(""); setError(""); setSuccess(""); setPending(false); setDeleteConfirm(false);
  }, [isOpen, items, selectedItemId, initialAction]);

  if (!isOpen) return null;
  const selectedItem = items.find(item => item.id === itemId);
  const handleItemChange = (nextItemId: string) => {
    setItemId(nextItemId);
    setItemFields(items.find(item => item.id === nextItemId));
  };

  const deleteItem = async () => {
    setError(""); setSuccess("");
    if (!itemId) return setError("Select an inventory item.");
    if (!onCommand) return setError("Inventory commands are not connected yet. Try again after the workspace integration is available.");
    setPending(true);
    try {
      await onCommand({ type: "delete-item", itemId });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The inventory item could not be deleted. You can retry safely.");
      setPending(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setSuccess("");
    if (!itemId) return setError("Select an inventory item.");
    let command: InventoryCommand;
    if (action === "edit-item") {
      const quantity = Number(packageQuantity); const price = Number(packagePrice); const minimum = minLevel === "" ? 0 : Number(minLevel);
      if (!name.trim()) return setError("Enter an item name.");
      if (!Number.isFinite(quantity) || quantity <= 0) return setError("Enter a package quantity greater than zero.");
      if (!Number.isFinite(price) || price < 0) return setError("Enter a valid package price.");
      if (!Number.isFinite(minimum) || minimum < 0) return setError("Enter a valid minimum level.");
      command = { type: "edit-item", itemId, name: name.trim(), kind, unit, packageQuantity: quantity, packagePrice: price, minLevel: minimum };
    } else if (action === "receive") {
      const packages = Number(packageCount); const each = Number(packageQuantity); const price = packagePrice === "" ? undefined : Number(packagePrice);
      if (!Number.isFinite(packages) || packages <= 0 || !Number.isFinite(each) || each <= 0) return setError("Enter a package count and base-unit quantity greater than zero.");
      if (price !== undefined && (!Number.isFinite(price) || price < 0)) return setError("Enter a valid package price.");
      command = { type: "receive", itemId, packageCount: packages, packageQuantity: each, baseQuantity: packages * each, packagePrice: price, invoiceRef: invoiceRef.trim() || undefined, notes: notes.trim() || undefined };
    } else if (action === "physical-count") {
      const value = Number(count);
      if (count.trim() === "" || !Number.isFinite(value) || value < 0) return setError("Enter a physical count of zero or more.");
      command = { type: "physical-count", itemId, count: value, notes: notes.trim() || undefined };
    } else {
      const value = Number(quantityChange);
      if (!Number.isFinite(value) || value === 0) return setError("Enter a non-zero adjustment (for example, -500 or 500).");
      command = { type: "relative-adjustment", itemId, quantityChange: value, notes: notes.trim() || undefined };
    }
    if (!onCommand && !(action === "receive" && onConfirm)) return setError("Inventory commands are not connected yet. Try again after the workspace integration is available.");
    setPending(true);
    try {
      if (onCommand) await onCommand(command);
      else if (command.type === "receive") await onConfirm?.({ itemId, quantityAdded: command.baseQuantity, unitCost: command.packagePrice === undefined ? undefined : command.packagePrice / command.packageQuantity, invoiceRef: command.invoiceRef, notes: command.notes });
      setSuccess(action === "receive" ? "Purchase received and recorded in history." : action === "edit-item" ? "Inventory item updated." : "Adjustment recorded in history.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The inventory command failed. You can retry safely.");
    } finally { setPending(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="inventory-command-title">
    <div className="w-full max-w-md rounded-[16px] border border-[#E5DDD3] bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#E5DDD3] pb-4"><div className="flex gap-2.5"><PackagePlus className="text-[#7A3E24]" /><div><h2 id="inventory-command-title" className="font-extrabold text-[#2F2925]">{action === "edit-item" ? "Edit inventory item" : "Inventory entry"}</h2><p className="text-xs text-[#6F655E]">{action === "edit-item" ? "Update the item details or switch to a stock action." : "Every entry creates an append-only history event."}</p></div></div><button type="button" onClick={onClose} aria-label="Close inventory entry" className="p-1 text-[#6F655E]"><X /></button></div>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <fieldset><legend className="text-xs font-bold text-[#2F2925]">Action</legend><div className="mt-2 grid grid-cols-2 gap-2">{actions.map(([value, label]) => <label key={value} className={`cursor-pointer rounded-lg border p-2 text-center text-xs font-bold ${action === value ? "border-[#7A3E24] bg-[#F3DED1] text-[#7A3E24]" : "border-[#E5DDD3] text-[#6F655E]"}`}><input className="sr-only" type="radio" name="inventory-action" value={value} checked={action === value} onChange={() => setAction(value)} />{label}</label>)}</div></fieldset>
        <label className="block text-xs font-bold text-[#2F2925]">Item<select aria-label="Inventory item" value={itemId} onChange={event => handleItemChange(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] bg-white px-3 text-sm"><option value="">Select an item</option>{items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}</select></label>
        {action === "edit-item" && <><label className="block text-xs font-bold text-[#2F2925]">Item name<input aria-label="Editable inventory item name" value={name} onChange={event => setName(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3 text-sm" /></label><fieldset><legend className="text-xs font-bold text-[#2F2925]">Category</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["ingredient", "packaging"] as const).map(value => <label key={value} className={`cursor-pointer rounded-lg border p-3 text-center text-xs font-bold ${kind === value ? "border-[#7A3E24] bg-[#F3DED1] text-[#7A3E24]" : "border-[#E5DDD3] text-[#6F655E]"}`}><input className="sr-only" type="radio" name="edit-inventory-kind" value={value} checked={kind === value} onChange={() => setKind(value)} />{value === "ingredient" ? "Ingredient" : "Retail supply"}</label>)}</div></fieldset><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-[#2F2925]">Base unit<select aria-label="Editable inventory base unit" value={unit} onChange={event => setUnit(event.target.value as typeof unit)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] bg-white px-3 text-sm"><option value="g">Grams (g)</option><option value="ml">Milliliters (ml)</option><option value="unit">Each (unit)</option></select></label><label className="text-xs font-bold text-[#2F2925]">Minimum level<input aria-label="Editable inventory minimum level" type="number" min="0" step="any" value={minLevel} onChange={event => setMinLevel(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3 text-sm" /></label></div><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-[#2F2925]">Package quantity ({unit})<input aria-label="Editable inventory package quantity" type="number" min="0" step="any" value={packageQuantity} onChange={event => setPackageQuantity(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3 text-sm" /></label><label className="text-xs font-bold text-[#2F2925]">Package price ($)<input aria-label="Editable inventory package price" type="number" min="0" step="0.01" value={packagePrice} onChange={event => setPackagePrice(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3 text-sm" /></label></div></>}
        {action === "receive" && <><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-[#2F2925]">Packages<input aria-label="Package count" type="number" min="0" step="any" value={packageCount} onChange={event => setPackageCount(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label><label className="text-xs font-bold text-[#2F2925]">Quantity per package ({selectedItem?.unit ?? "base unit"})<input aria-label="Package base-unit quantity" type="number" min="0" step="any" value={packageQuantity} onChange={event => setPackageQuantity(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label></div><p className="text-xs text-[#6F655E]" aria-live="polite">Base-unit receipt: <strong>{(Number(packageCount || 0) * Number(packageQuantity || 0)).toLocaleString()} {selectedItem?.unit ?? ""}</strong></p><div className="grid grid-cols-2 gap-3"><label className="text-xs text-[#6F655E]">Package price (optional)<input aria-label="Package price" type="number" min="0" step="any" value={packagePrice} onChange={event => setPackagePrice(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label><label className="text-xs text-[#6F655E]">Invoice / reference<input aria-label="Invoice reference" value={invoiceRef} onChange={event => setInvoiceRef(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label></div></>}
        {action === "physical-count" && <label className="block text-xs font-bold text-[#2F2925]">Physical count ({selectedItem?.unit ?? "base unit"})<input aria-label="Physical count" type="number" min="0" step="any" value={count} onChange={event => setCount(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label>}
        {action === "relative-adjustment" && <label className="block text-xs font-bold text-[#2F2925]">Relative adjustment ({selectedItem?.unit ?? "base unit"})<input aria-label="Relative adjustment" type="number" step="any" placeholder="-500 or 500" value={quantityChange} onChange={event => setQuantityChange(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label>}
        {action !== "edit-item" && <label className="block text-xs text-[#6F655E]">Reason / notes (optional)<textarea aria-label="Inventory notes" rows={2} value={notes} onChange={event => setNotes(event.target.value)} className="mt-1 w-full rounded-[10px] border border-[#E5DDD3] p-3" /></label>}
        {error && <p role="alert" className="rounded-lg bg-[#FCE9E7] p-3 text-xs font-semibold text-[#B8443C]">{error}</p>}{success && <p role="status" className="rounded-lg bg-[#EBF4EC] p-3 text-xs font-semibold text-[#2D7A46]">{success}</p>}
        {action === "edit-item" && deleteConfirm && <div className="rounded-lg border border-[#B8443C]/30 bg-[#FCE9E7] p-3 text-xs text-[#7A302B]"><p className="font-bold">Remove this item from active inventory?</p><p className="mt-1">Its stock and purchase history will be preserved.</p><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setDeleteConfirm(false)} disabled={pending} className="rounded-[8px] border border-[#B8443C]/30 px-3 py-2 font-bold">Cancel</button><button type="button" onClick={deleteItem} disabled={pending} className="rounded-[8px] bg-[#B8443C] px-3 py-2 font-bold text-white disabled:opacity-50">{pending ? "Deleting…" : "Delete item"}</button></div></div>}
        <div className="flex items-center justify-between gap-3 border-t border-[#E5DDD3] pt-3"><div>{action === "edit-item" && !deleteConfirm && <button type="button" onClick={() => setDeleteConfirm(true)} disabled={pending} className="h-10 rounded-[10px] px-2 text-sm font-bold text-[#B8443C] disabled:opacity-50">Delete item</button>}</div><div className="flex justify-end gap-3"><button type="button" onClick={onClose} disabled={pending} className="h-10 rounded-[10px] border border-[#E5DDD3] px-4 text-sm font-bold">Close</button><button type="submit" disabled={pending || deleteConfirm} className="h-10 rounded-[10px] bg-[#7A3E24] px-4 text-sm font-bold text-white disabled:opacity-50">{pending ? "Saving…" : action === "edit-item" ? "Save changes" : "Record entry"}</button></div></div>
      </form>
    </div>
  </div>;
}
