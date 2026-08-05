import { useEffect, useState, type FormEvent } from "react";
import { PackagePlus, X } from "lucide-react";

export interface InventoryItemOption {
  id: string;
  name: string;
  unit: string;
  current?: number;
  onHand?: number;
}

export type InventoryCommand =
  | { type: "receive"; itemId: string; packageCount: number; packageQuantity: number; baseQuantity: number; packagePrice?: number; invoiceRef?: string; notes?: string }
  | { type: "physical-count"; itemId: string; count: number; notes?: string }
  | { type: "relative-adjustment"; itemId: string; quantityChange: number; notes?: string };

export interface InventoryAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: readonly InventoryItemOption[];
  selectedItemId?: string;
  /** Preferred command boundary for the inventory integration owner. */
  onCommand?: (command: InventoryCommand) => Promise<void> | void;
  /** Legacy restock boundary kept for existing callers. */
  onConfirm?: (data: { itemId: string; quantityAdded: number; unitCost?: number; invoiceRef?: string; notes?: string }) => Promise<void> | void;
}

const actions = [
  ["receive", "Receive purchase"],
  ["physical-count", "Physical count"],
  ["relative-adjustment", "Relative adjustment"],
] as const;

export function InventoryAdjustModal({ isOpen, onClose, items = [], selectedItemId, onCommand, onConfirm }: InventoryAdjustModalProps) {
  const [itemId, setItemId] = useState(selectedItemId || items[0]?.id || "");
  const [action, setAction] = useState<InventoryCommand["type"]>("receive");
  const [packageCount, setPackageCount] = useState("");
  const [packageQuantity, setPackageQuantity] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [count, setCount] = useState("");
  const [quantityChange, setQuantityChange] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setItemId(selectedItemId || items[0]?.id || "");
    setAction("receive"); setPackageCount(""); setPackageQuantity(""); setPackagePrice(""); setCount(""); setQuantityChange(""); setInvoiceRef(""); setNotes(""); setError(""); setSuccess(""); setPending(false);
  }, [isOpen, items, selectedItemId]);

  if (!isOpen) return null;
  const selectedItem = items.find(item => item.id === itemId);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setSuccess("");
    if (!itemId) return setError("Select an inventory item.");
    let command: InventoryCommand;
    if (action === "receive") {
      const packages = Number(packageCount); const each = Number(packageQuantity); const price = packagePrice === "" ? undefined : Number(packagePrice);
      if (!Number.isFinite(packages) || packages <= 0 || !Number.isFinite(each) || each <= 0) return setError("Enter a package count and base-unit quantity greater than zero.");
      if (price !== undefined && (!Number.isFinite(price) || price < 0)) return setError("Enter a valid package price.");
      command = { type: "receive", itemId, packageCount: packages, packageQuantity: each, baseQuantity: packages * each, packagePrice: price, invoiceRef: invoiceRef.trim() || undefined, notes: notes.trim() || undefined };
    } else if (action === "physical-count") {
      const value = Number(count);
      if (!Number.isFinite(value) || value < 0) return setError("Enter a physical count of zero or more.");
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
      setSuccess(action === "receive" ? "Purchase received and recorded in history." : "Adjustment recorded in history.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The inventory command failed. You can retry safely.");
    } finally { setPending(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="inventory-command-title">
    <div className="w-full max-w-md rounded-[16px] border border-[#E5DDD3] bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#E5DDD3] pb-4"><div className="flex gap-2.5"><PackagePlus className="text-[#7A3E24]" /><div><h2 id="inventory-command-title" className="font-extrabold text-[#2F2925]">Inventory entry</h2><p className="text-xs text-[#6F655E]">Every entry creates an append-only history event.</p></div></div><button type="button" onClick={onClose} aria-label="Close inventory entry" className="p-1 text-[#6F655E]"><X /></button></div>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <fieldset><legend className="text-xs font-bold text-[#2F2925]">Action</legend><div className="mt-2 grid grid-cols-3 gap-2">{actions.map(([value, label]) => <label key={value} className={`cursor-pointer rounded-lg border p-2 text-center text-xs font-bold ${action === value ? "border-[#7A3E24] bg-[#F3DED1] text-[#7A3E24]" : "border-[#E5DDD3] text-[#6F655E]"}`}><input className="sr-only" type="radio" name="inventory-action" value={value} checked={action === value} onChange={() => setAction(value)} />{label}</label>)}</div></fieldset>
        <label className="block text-xs font-bold text-[#2F2925]">Item<select aria-label="Inventory item" value={itemId} onChange={event => setItemId(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] bg-white px-3 text-sm"><option value="">Select an item</option>{items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}</select></label>
        {action === "receive" && <><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-[#2F2925]">Packages<input aria-label="Package count" type="number" min="0" step="any" value={packageCount} onChange={event => setPackageCount(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label><label className="text-xs font-bold text-[#2F2925]">Quantity per package ({selectedItem?.unit ?? "base unit"})<input aria-label="Package base-unit quantity" type="number" min="0" step="any" value={packageQuantity} onChange={event => setPackageQuantity(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label></div><p className="text-xs text-[#6F655E]" aria-live="polite">Base-unit receipt: <strong>{(Number(packageCount || 0) * Number(packageQuantity || 0)).toLocaleString()} {selectedItem?.unit ?? ""}</strong></p><div className="grid grid-cols-2 gap-3"><label className="text-xs text-[#6F655E]">Package price (optional)<input aria-label="Package price" type="number" min="0" step="any" value={packagePrice} onChange={event => setPackagePrice(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label><label className="text-xs text-[#6F655E]">Invoice / reference<input aria-label="Invoice reference" value={invoiceRef} onChange={event => setInvoiceRef(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label></div></>}
        {action === "physical-count" && <label className="block text-xs font-bold text-[#2F2925]">Physical count ({selectedItem?.unit ?? "base unit"})<input aria-label="Physical count" type="number" min="0" step="any" value={count} onChange={event => setCount(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label>}
        {action === "relative-adjustment" && <label className="block text-xs font-bold text-[#2F2925]">Relative adjustment ({selectedItem?.unit ?? "base unit"})<input aria-label="Relative adjustment" type="number" step="any" placeholder="-500 or 500" value={quantityChange} onChange={event => setQuantityChange(event.target.value)} className="mt-1 h-10 w-full rounded-[10px] border border-[#E5DDD3] px-3" /></label>}
        <label className="block text-xs text-[#6F655E]">Reason / notes (optional)<textarea aria-label="Inventory notes" rows={2} value={notes} onChange={event => setNotes(event.target.value)} className="mt-1 w-full rounded-[10px] border border-[#E5DDD3] p-3" /></label>
        {error && <p role="alert" className="rounded-lg bg-[#FCE9E7] p-3 text-xs font-semibold text-[#B8443C]">{error}</p>}{success && <p role="status" className="rounded-lg bg-[#EBF4EC] p-3 text-xs font-semibold text-[#2D7A46]">{success}</p>}
        <div className="flex justify-end gap-3 border-t border-[#E5DDD3] pt-3"><button type="button" onClick={onClose} disabled={pending} className="h-10 rounded-[10px] border border-[#E5DDD3] px-4 text-sm font-bold">Cancel</button><button type="submit" disabled={pending} className="h-10 rounded-[10px] bg-[#7A3E24] px-4 text-sm font-bold text-white disabled:opacity-50">{pending ? "Saving…" : "Record entry"}</button></div>
      </form>
    </div>
  </div>;
}
