import React from "react";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import type { DomainStorefrontProduct } from "../../domain/types";

export interface PublicCartItem {
  product: DomainStorefrontProduct;
  quantity: number;
}

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: readonly PublicCartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const totalCents = items.reduce(
    (sum, item) => sum + item.product.onlinePriceCents * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E5DDD3] flex items-center justify-between bg-[#FBF8F3]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#7A3E24] text-white flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
              <h2 className="font-extrabold text-lg text-[#2F2925]">Your Order Cart</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#988D84] hover:bg-[#F6F0E8] hover:text-[#2F2925] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#988D84]">
                <ShoppingBag size={48} strokeWidth={1.5} className="mb-3 opacity-40" />
                <p className="font-bold text-base text-[#2F2925]">Your cart is empty</p>
                <p className="text-xs mt-1 max-w-xs">
                  Browse our fresh baked goods and add items to your online order.
                </p>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const lineTotal = ((product.onlinePriceCents * quantity) / 100).toFixed(2);
                const unitPrice = (product.onlinePriceCents / 100).toFixed(2);

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3.5 bg-[#FBF8F3] rounded-[12px] border border-[#E5DDD3]"
                  >
                    {/* Image / Fallback */}
                    <div className="w-14 h-14 rounded-[8px] bg-gradient-to-br from-[#7A3E24] to-[#B4643B] text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
                      {product.publicName.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#2F2925] truncate">
                        {product.publicName}
                      </p>
                      <p className="text-xs text-[#6F655E] mt-0.5">${unitPrice} each</p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-[#E5DDD3] rounded-[6px] bg-white">
                          <button
                            onClick={() => onUpdateQuantity(product.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-[#6F655E] hover:bg-[#F6F0E8] transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-xs font-bold font-['DM_Mono',monospace] text-[#2F2925]">
                            {quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(product.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#6F655E] hover:bg-[#F6F0E8] transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(product.id)}
                          className="p-1 text-[#988D84] hover:text-[#B8443C] transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-extrabold text-sm font-['DM_Mono',monospace] text-[#2F2925]">
                        ${lineTotal}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#E5DDD3] bg-[#FBF8F3] space-y-4">
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-[#6F655E]">Subtotal</span>
                <span className="font-extrabold text-xl font-['DM_Mono',monospace] text-[#2F2925]">
                  ${(totalCents / 100).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full h-12 rounded-[12px] bg-[#7A3E24] hover:bg-[#934E2E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
