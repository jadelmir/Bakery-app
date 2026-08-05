import React, { useState } from "react";
import { X, RefreshCw } from "lucide-react";

export interface RecordMovementModalProps {
  ingredientName: string;
  unit: string;
  onClose: () => void;
  onSave: (movement: {
    quantityChange: number;
    reason: "restock" | "waste" | "adjustment" | "task-deduction";
    notes?: string;
  }) => void;
}

export function RecordMovementModal({ ingredientName, unit, onClose, onSave }: RecordMovementModalProps) {
  const [quantityChange, setQuantityChange] = useState(1000);
  const [reason, setReason] = useState<"restock" | "waste" | "adjustment" | "task-deduction">("restock");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalChange = reason === "waste" ? -Math.abs(quantityChange) : quantityChange;
    onSave({ quantityChange: finalChange, reason, notes: notes.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5DDD3]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="text-[#7A3E24]" size={20} />
            <h2 className="text-lg font-extrabold text-[#2F2925]">Record Movement</h2>
          </div>
          <button onClick={onClose} className="text-[#988D84] hover:text-[#2F2925] transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-[#6F655E] mb-4">Ingredient: <span className="font-bold text-[#2F2925]">{ingredientName}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#6F655E] uppercase mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as "restock" | "waste" | "adjustment")}
              className="w-full h-10 px-3 border border-[#E5DDD3] rounded-lg text-sm bg-white"
            >
              <option value="restock">Restock (+)</option>
              <option value="waste">Waste / Damaged (-)</option>
              <option value="adjustment">Manual Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6F655E] uppercase mb-1">Quantity Change ({unit})</label>
            <input
              type="number"
              required
              value={quantityChange}
              onChange={(e) => setQuantityChange(Number(e.target.value))}
              className="w-full h-10 px-3 border border-[#E5DDD3] rounded-lg text-sm focus:outline-none focus:border-[#7A3E24]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6F655E] uppercase mb-1">Notes (Optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivered by Sysco"
              className="w-full h-10 px-3 border border-[#E5DDD3] rounded-lg text-sm focus:outline-none focus:border-[#7A3E24]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-[#E5DDD3] rounded-lg text-xs font-bold text-[#6F655E] hover:bg-[#F6F0E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-10 bg-[#7A3E24] text-white rounded-lg text-xs font-bold hover:bg-[#934E2E]"
            >
              Record Movement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
