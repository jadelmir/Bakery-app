import React from "react";
import { CheckCircle2, Calendar, Clock, MapPin, Mail, Phone, ShoppingBag, ArrowRight } from "lucide-react";
import type { PublicCartItem } from "./CartDrawer";
import type { PaymentMethodType } from "../../domain/types";

export interface OrderConfirmationProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  fulfillmentType: "pickup" | "delivery";
  fulfillmentDate: string;
  fulfillmentTimeWindow: string;
  deliveryAddress?: string;
  paymentMethodType: PaymentMethodType;
  items: readonly PublicCartItem[];
  totalCents: number;
  onReturnToStore: () => void;
}

export function OrderConfirmation({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  fulfillmentType,
  fulfillmentDate,
  fulfillmentTimeWindow,
  deliveryAddress,
  paymentMethodType,
  items,
  totalCents,
  onReturnToStore,
}: OrderConfirmationProps) {
  const paymentInstructions = (() => {
    switch (paymentMethodType) {
      case "zelle":
        return "Please send your Zelle payment to pay@earlsbakery.com with your Order ID as the memo.";
      case "paypal":
        return "Please send your PayPal payment to paypal.me/earlsbakery with your Order ID.";
      case "cash":
        return "Please have cash or check ready upon pickup/delivery.";
      case "check":
        return "Checks should be made out to Earl's Bakery.";
      default:
        return "Payment instructions will be confirmed via email.";
    }
  })();

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white rounded-[20px] border border-[#E5DDD3] shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#3F7A55] to-[#2E5E40] text-white p-8 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Order Confirmed!</h1>
          <p className="text-sm opacity-90 mt-1">
            Thank you, {customerName}. We have received your order.
          </p>
          <div className="inline-block mt-3 px-3 py-1 bg-white/20 rounded-full text-xs font-mono font-bold tracking-wide">
            ID: {orderId}
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Fulfillment details */}
          <div className="bg-[#FAF1EB] rounded-[14px] p-4 border border-[#E5DDD3] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-[#7A3E24] mt-0.5" />
              <div>
                <p className="text-[11px] font-bold uppercase text-[#988D84]">Fulfillment Date</p>
                <p className="text-sm font-extrabold text-[#2F2925]">{fulfillmentDate}</p>
                <p className="text-xs text-[#6F655E]">{fulfillmentTimeWindow}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-[#7A3E24] mt-0.5" />
              <div>
                <p className="text-[11px] font-bold uppercase text-[#988D84]">
                  {fulfillmentType === "delivery" ? "Delivery Address" : "Pickup Location"}
                </p>
                <p className="text-sm font-extrabold text-[#2F2925]">
                  {fulfillmentType === "delivery" ? deliveryAddress : "Bakery Storefront"}
                </p>
                <p className="text-xs text-[#6F655E] capitalize">{fulfillmentType} order</p>
              </div>
            </div>
          </div>

          {/* Payment instructions alert */}
          <div className="bg-[#FFF4D8] border border-[#B7791F]/30 rounded-[14px] p-4">
            <p className="text-xs font-bold uppercase text-[#B7791F] tracking-wider mb-1">
              Payment Instructions ({paymentMethodType.toUpperCase()})
            </p>
            <p className="text-xs text-[#6F655E] leading-relaxed">{paymentInstructions}</p>
          </div>

          {/* Itemized Order Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#988D84] mb-3">
              Order Items
            </h3>
            <div className="bg-[#FBF8F3] rounded-[14px] border border-[#E5DDD3] divide-y divide-[#E5DDD3] overflow-hidden">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-[#2F2925]">{product.publicName}</p>
                    <p className="text-xs text-[#6F655E]">
                      {quantity} × ${(product.onlinePriceCents / 100).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-extrabold text-sm font-['DM_Mono',monospace] text-[#2F2925]">
                    ${((product.onlinePriceCents * quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="p-4 bg-white flex justify-between items-center">
                <span className="font-extrabold text-sm text-[#2F2925]">Total</span>
                <span className="font-extrabold text-xl font-['DM_Mono',monospace] text-[#7A3E24]">
                  ${(totalCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer contact info */}
          <div className="text-xs text-[#6F655E] space-y-1">
            <p>Confirmation email sent to: <span className="font-bold text-[#2F2925]">{customerEmail}</span></p>
            {customerPhone && <p>Contact phone: <span className="font-bold text-[#2F2925]">{customerPhone}</span></p>}
          </div>

          {/* Return button */}
          <button
            onClick={onReturnToStore}
            className="w-full h-12 rounded-[12px] bg-[#7A3E24] hover:bg-[#934E2E] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            Return to Storefront <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
