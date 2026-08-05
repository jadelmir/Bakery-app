import React, { useState } from "react";
import { X, Package, DollarSign } from "lucide-react";

export interface AddIngredientModalProps {
  onClose: () => void;
  onSave: (ingredient: {
    name: string;
    unit: string;
    packageQuantity: number;
    packagePrice: number;
    minLevel: number;
    kind: "ingredient" | "packaging";
  }) => void;
}

export function AddIngredientModal({ onClose, onSave }: AddIngredientModalProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("g");
  const [packageQuantity, setPackageQuantity] = useState(5000);
  const [packagePrice, setPackagePrice] = useState(15.0);
  const [minLevel, setMinLevel] = useState(1000);
  const [kind, setKind] = useState<"ingredient" | "packaging">("ingredient");

  const costPerUnit = packageQuantity > 0 ? (packagePrice / packageQuantity).toFixed(4) : "0.0000";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), unit, packageQuantity, packagePrice, minLevel, kind });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5DDD3]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="text-[#7A3E24]" size={20} />
            <h2 className="text-lg font-extrabold text-[#2F2925]">Add New Ingredient</h2>
          </div>
          <button onClick={onClose} className="text-[#988D84] hover:text-[#2F2925] transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#6F655E] uppercase mb-1">Ingredient Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Bread Flour"
              className="w-full h-10 px-3 border border-[#E5DDD3] rounded-lg text-sm focus:outline-none focus:border-[#7A3E24]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6F655E] uppercase mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 border border-[#E5DDD3] rounded-lg text-sm bg-white"
              >
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="l">Liters (l)</option>
                <option value="pcs">Pieces (pcs)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6F655E] uppercase mb-1">Type</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as "ingredient" | "packaging")}
                className="w-full h-10 px-3 border border-[#E5DDD3] rounded-lg text-sm bg-white"
              >
                <option value="ingredient">Ingredient</option>
                <option value="packaging">Packaging</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6F655E] uppercase mb-1">Package Quantity</label>
              <input
                type="number"
                min="1"
                value={packageQuantity}
                onChange={(e) => setPackageQuantity(Number(e.target.value))}
                className="w-full h-10 px-3 border border-[#E5DDD3] rounded-lg text-sm focus:outline-none focus:border-[#7A3E24]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6F655E] uppercase mb-1">Package Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={packagePrice}
                onChange={(e) => setPackagePrice(Number(e.target.value))}
                className="w-full h-10 px-3 border border-[#E5DDD3] rounded-lg text-sm focus:outline-none focus:border-[#7A3E24]"
              />
            </div>
          </div>

          <div className="bg-[#FBF8F3] p-3 rounded-lg border border-[#E5DDD3] flex items-center justify-between">
            <span className="text-xs font-bold text-[#6F655E]">Calculated Base-Unit Cost:</span>
            <span className="text-sm font-extrabold text-[#7A3E24]">${costPerUnit} / {unit}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6F655E] uppercase mb-1">Minimum Alert Threshold ({unit})</label>
            <input
              type="number"
              min="0"
              value={minLevel}
              onChange={(e) => setMinLevel(Number(e.target.value))}
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
              Save Ingredient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
