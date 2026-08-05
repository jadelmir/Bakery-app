import { type FormEvent, useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";

export interface DeleteBakeryDialogProps {
  isOpen: boolean;
  bakeryName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteBakeryDialog({
  isOpen,
  bakeryName,
  onClose,
  onConfirm,
}: DeleteBakeryDialogProps) {
  const [typedName, setTypedName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isConfirmed = typedName.trim().toLowerCase() === bakeryName.trim().toLowerCase();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isConfirmed) return;
    setPending(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete bakery store.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl overflow-hidden border border-[#E5DDD3]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCE9E7] text-[#B8443C]">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F0E8] text-[#6F655E] hover:bg-[#EDE6DC]"
          >
            <X size={16} />
          </button>
        </div>

        <h2 className="mt-4 text-xl font-extrabold text-[#2F2925]">Delete Bakery Store</h2>
        <p className="mt-2 text-xs text-[#6F655E] leading-relaxed">
          This will permanently delete <strong className="text-[#2F2925]">{bakeryName}</strong>, including all recipes, orders, inventory logs, and customer invoices. This action cannot be undone.
        </p>

        <form onSubmit={handleSubmit} className="mt-5">
          <label htmlFor="confirm-bakery-name" className="block text-xs font-bold text-[#403832] uppercase tracking-wider">
            Type <span className="font-extrabold text-[#B8443C]">{bakeryName}</span> to confirm
          </label>
          <input
            id="confirm-bakery-name"
            aria-label="Confirm bakery name"
            value={typedName}
            onChange={e => setTypedName(e.target.value)}
            placeholder={bakeryName}
            className="mt-1.5 h-11 w-full rounded-xl border border-[#D9CEC4] bg-white px-4 text-sm font-semibold text-[#2F2925] outline-none focus:border-[#B8443C] focus:ring-2 focus:ring-[#B8443C]/15"
          />

          {error && <p role="alert" className="mt-3 text-xs font-semibold text-[#B8443C]">{error}</p>}

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-[#D9CEC4] bg-white px-4 text-xs font-bold text-[#6F655E] hover:bg-[#F6F0E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || pending}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#B8443C] px-5 text-xs font-bold text-white hover:bg-[#9E3932] disabled:opacity-50 transition-colors"
            >
              {pending ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                  Deleting store…
                </>
              ) : (
                <>
                  <Trash2 size={15} aria-hidden="true" />
                  Permanently Delete Bakery
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
