import React, { useState } from "react";
import { X, User, Mail, Phone, MapPin, CreditCard, FileText, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { FulfillmentDatePicker } from "./FulfillmentDatePicker";
import type { PublicCartItem } from "./CartDrawer";
import type {
  DomainPickupWindow,
  DomainClosedDate,
  OnlineCheckoutInput,
  PaymentMethodType,
  AdapterResult,
  OnlineOrderResult,
} from "../../domain/types";

export interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  items: readonly PublicCartItem[];
  pickupWindows?: readonly DomainPickupWindow[];
  closedDates?: readonly DomainClosedDate[];
  minimumLeadTimeHours?: number;
  onSubmitOrder: (input: OnlineCheckoutInput) => Promise<AdapterResult<OnlineOrderResult>>;
  onOrderConfirmed: (
    result: OnlineOrderResult,
    details: {
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
    }
  ) => void;
}

export function CheckoutForm({
  isOpen,
  onClose,
  slug,
  items,
  pickupWindows = [],
  closedDates = [],
  minimumLeadTimeHours = 24,
  onSubmitOrder,
  onOrderConfirmed,
}: CheckoutFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [fulfillmentDate, setFulfillmentDate] = useState(defaultDateStr);
  const [fulfillmentTimeWindow, setFulfillmentTimeWindow] = useState("09:00 - 12:00");
  const [paymentMethodType, setPaymentMethodType] = useState<PaymentMethodType>("zelle");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalCents = items.reduce(
    (sum, item) => sum + item.product.onlinePriceCents * item.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (fulfillmentType === "delivery" && !deliveryAddress.trim()) {
      setErrorMessage("Please enter a delivery address.");
      return;
    }
    if (!fulfillmentDate) {
      setErrorMessage("Please select a fulfillment date.");
      return;
    }

    setSubmitting(true);

    try {
      const checkoutInput: OnlineCheckoutInput = {
        slug,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        fulfillmentType,
        fulfillmentDate,
        fulfillmentTimeWindow,
        deliveryAddress: fulfillmentType === "delivery" ? deliveryAddress.trim() : undefined,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          recipeId: item.product.recipeId,
          quantity: item.quantity,
          unitPriceCents: item.product.onlinePriceCents,
        })),
        paymentMethodType,
        idempotencyKey: `idempotency-${slug}-${customerEmail.trim()}-${Date.now()}`,
      };

      const result = await onSubmitOrder(checkoutInput);

      if (result.ok) {
        onOrderConfirmed(result.data, {
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          fulfillmentType,
          fulfillmentDate,
          fulfillmentTimeWindow,
          deliveryAddress: deliveryAddress || undefined,
          paymentMethodType,
          items,
          totalCents,
        });
      } else {
        setErrorMessage(result.error.message || "Failed to place online order. Please try again.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-[20px] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5DDD3] bg-[#FBF8F3] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-extrabold text-xl text-[#2F2925]">Complete Your Order</h2>
            <p className="text-xs text-[#6F655E] mt-0.5">
              Enter your details to confirm pickup or delivery
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#988D84] hover:bg-[#F6F0E8] hover:text-[#2F2925] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Contact */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#7A3E24] uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} /> Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full h-11 pl-10 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full h-11 pl-10 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                Phone Number (optional)
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full h-11 pl-10 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                />
              </div>
            </div>
          </div>

          {/* Fulfillment Option */}
          <div className="space-y-4 pt-2 border-t border-[#F0E9E0]">
            <h3 className="text-xs font-bold text-[#7A3E24] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} /> Fulfillment Method
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType("pickup")}
                className={`py-3 px-4 rounded-[12px] border text-center font-bold text-sm transition-all ${
                  fulfillmentType === "pickup"
                    ? "border-[#7A3E24] bg-[#FAF1EB] text-[#7A3E24] shadow-xs"
                    : "border-[#E5DDD3] bg-white text-[#6F655E] hover:bg-[#F6F0E8]"
                }`}
              >
                Store Pickup
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType("delivery")}
                className={`py-3 px-4 rounded-[12px] border text-center font-bold text-sm transition-all ${
                  fulfillmentType === "delivery"
                    ? "border-[#7A3E24] bg-[#FAF1EB] text-[#7A3E24] shadow-xs"
                    : "border-[#E5DDD3] bg-white text-[#6F655E] hover:bg-[#F6F0E8]"
                }`}
              >
                Local Delivery
              </button>
            </div>

            {fulfillmentType === "delivery" && (
              <div>
                <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="123 Main St, Apt 4, City"
                  className="w-full h-11 px-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                />
              </div>
            )}

            {/* Date & Time picker */}
            <FulfillmentDatePicker
              selectedDate={fulfillmentDate}
              selectedTime={fulfillmentTimeWindow}
              onChangeDate={setFulfillmentDate}
              onChangeTime={setFulfillmentTimeWindow}
              pickupWindows={pickupWindows}
              closedDates={closedDates}
              minimumLeadTimeHours={minimumLeadTimeHours}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3 pt-2 border-t border-[#F0E9E0]">
            <h3 className="text-xs font-bold text-[#7A3E24] uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={14} /> Payment Method
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: "zelle" as PaymentMethodType, label: "Zelle" },
                { type: "paypal" as PaymentMethodType, label: "PayPal" },
                { type: "cash" as PaymentMethodType, label: "Cash on Pickup" },
                { type: "check" as PaymentMethodType, label: "Check" },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPaymentMethodType(type)}
                  className={`py-2.5 px-3 rounded-[10px] border text-xs font-bold transition-all ${
                    paymentMethodType === type
                      ? "border-[#7A3E24] bg-[#7A3E24] text-white shadow-xs"
                      : "border-[#E5DDD3] bg-white text-[#6F655E] hover:bg-[#F6F0E8]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="pt-2 border-t border-[#F0E9E0]">
            <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText size={14} /> Special Instructions / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sliced loaf, extra toasted sesame..."
              className="w-full p-3 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-[#FAF1EB] rounded-[14px] p-4 space-y-2 border border-[#E5DDD3]">
            <p className="text-xs font-bold text-[#7A3E24] uppercase tracking-wider">Order Summary</p>
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-xs text-[#6F655E]">
                <span>
                  {quantity}× {product.publicName}
                </span>
                <span className="font-['DM_Mono',monospace]">
                  ${((product.onlinePriceCents * quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-[#E5DDD3] flex justify-between items-center">
              <span className="font-bold text-sm text-[#2F2925]">Total Due</span>
              <span className="font-extrabold text-lg font-['DM_Mono',monospace] text-[#7A3E24]">
                ${(totalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#FCE9E7] border border-[#B8443C]/30 rounded-[10px] flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#B8443C] flex-shrink-0" />
              <p className="text-xs font-semibold text-[#B8443C]">{errorMessage}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-[12px] border border-[#E5DDD3] text-[#6F655E] font-semibold text-sm hover:bg-[#F6F0E8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-12 rounded-[12px] bg-[#7A3E24] hover:bg-[#934E2E] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-md"
            >
              {submitting ? "Placing Order..." : "Confirm & Place Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
