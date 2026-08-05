import React, { useState } from "react";
import { X, DollarSign, Calendar, CreditCard, FileText, AlertTriangle } from "lucide-react";
import type { DomainInvoice, DomainPaymentMethod, PaymentMethodType, RecordPaymentInput } from "../../domain/types";
import { formatCents } from "../../../lib/pdf/invoicePdf";

export interface RecordPaymentDialogProps {
  readonly invoice: DomainInvoice;
  readonly paymentMethods?: readonly DomainPaymentMethod[];
  readonly onClose: () => void;
  readonly onRecordPayment: (input: RecordPaymentInput) => void | Promise<void>;
}

const DEFAULT_METHODS: { type: PaymentMethodType; label: string }[] = [
  { type: "zelle", label: "Zelle" },
  { type: "paypal", label: "PayPal" },
  { type: "cash", label: "Cash" },
  { type: "check", label: "Check" },
  { type: "custom", label: "Custom / Bank Transfer" },
];

export function RecordPaymentDialog({
  invoice,
  paymentMethods,
  onClose,
  onRecordPayment,
}: RecordPaymentDialogProps) {
  const initialAmountDollars = (invoice.balanceCents / 100).toFixed(2);
  const [amountDollarsStr, setAmountDollarsStr] = useState(initialAmountDollars);
  const [paymentMethodType, setPaymentMethodType] = useState<PaymentMethodType>("zelle");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const amountCents = Math.round((parseFloat(amountDollarsStr) || 0) * 100);
  const remainingCentsAfterPayment = invoice.balanceCents - amountCents;
  const isFullPayment = remainingCentsAfterPayment <= 0 && invoice.balanceCents > 0;
  const isOverpayment = remainingCentsAfterPayment < 0;

  const availableMethods = paymentMethods
    ? paymentMethods.filter((pm) => pm.isEnabled).map((pm) => ({ type: pm.methodType, label: pm.name, id: pm.id }))
    : DEFAULT_METHODS.map((m) => ({ type: m.type, label: m.label, id: undefined }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountCents <= 0) {
      setErrorMsg("Payment amount must be greater than zero.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const selectedMethod = availableMethods.find((m) => m.type === paymentMethodType);
      const input: RecordPaymentInput = {
        bakeryId: invoice.bakeryId,
        operationId: `record-payment-${invoice.id}-${Date.now()}`,
        paymentId: `pay-${Date.now()}`,
        invoiceId: invoice.id,
        paymentMethodType,
        paymentMethodId: selectedMethod?.id,
        amountCents,
        paymentDate,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await onRecordPayment(input);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-[16px] border border-[#E5DDD3] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDD3] bg-[#FAF1EB]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#988D84]">Record Payment</span>
            <h2 className="text-lg font-extrabold text-[#2F2925]">{invoice.invoiceNumber}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#988D84] hover:text-[#2F2925] hover:bg-white/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Invoice Summary Pill */}
        <div className="px-6 py-3 bg-[#FBF8F3] border-b border-[#E5DDD3] grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="block text-[#988D84] font-medium">Total</span>
            <span className="block font-bold text-[#2F2925]">{formatCents(invoice.totalCents)}</span>
          </div>
          <div>
            <span className="block text-[#988D84] font-medium">Paid</span>
            <span className="block font-bold text-[#3F7A55]">{formatCents(invoice.amountPaidCents)}</span>
          </div>
          <div>
            <span className="block text-[#988D84] font-medium">Balance</span>
            <span className="block font-bold text-[#B8443C]">{formatCents(invoice.balanceCents)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#FCE9E7] border border-[#B8443C]/20 rounded-[10px] text-xs font-semibold text-[#B8443C]">
              {errorMsg}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label htmlFor="payment-amount" className="block text-xs font-bold text-[#2F2925] mb-1">
              Payment Amount ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84] font-bold text-sm">$</span>
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amountDollarsStr}
                onChange={(e) => setAmountDollarsStr(e.target.value)}
                className="w-full h-11 pl-8 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] font-bold text-base text-[#2F2925] focus:outline-none focus:border-[#B4643B]"
                required
              />
            </div>

            {/* Dynamic Balance Preview */}
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-[#6F655E]">
                Remaining after payment:
              </span>
              <span className={`font-bold ${isOverpayment ? "text-[#B7791F]" : remainingCentsAfterPayment === 0 ? "text-[#3F7A55]" : "text-[#2F2925]"}`}>
                {formatCents(Math.max(0, remainingCentsAfterPayment))}
                {isFullPayment && " (Full Payment)"}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="payment-method-select" className="block text-xs font-bold text-[#2F2925] mb-1">
              Payment Method
            </label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#988D84]" />
              <select
                id="payment-method-select"
                value={paymentMethodType}
                onChange={(e) => setPaymentMethodType(e.target.value as PaymentMethodType)}
                className="w-full h-10 pl-9 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#B4643B] font-medium"
              >
                {availableMethods.map((m) => (
                  <option key={m.type} value={m.type}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            {paymentMethodType === "zelle" && (
              <p className="text-[11px] text-[#B7791F] mt-1 flex items-center gap-1">
                <AlertTriangle size={11} /> Zelle payments require manual staff confirmation.
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label htmlFor="payment-date" className="block text-xs font-bold text-[#2F2925] mb-1">
              Payment Date
            </label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#988D84]" />
              <input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#B4643B]"
                required
              />
            </div>
          </div>

          {/* Reference / Transaction ID */}
          <div>
            <label htmlFor="payment-ref" className="block text-xs font-bold text-[#2F2925] mb-1">
              Reference / Confirmation # (Optional)
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#988D84]" />
              <input
                id="payment-ref"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. Zelle Txn #9281, Check #1042"
                className="w-full h-10 pl-9 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] placeholder:text-[#988D84] focus:outline-none focus:border-[#B4643B]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="payment-notes" className="block text-xs font-bold text-[#2F2925] mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="payment-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal memo or payment notes..."
              className="w-full p-2.5 bg-white border border-[#E5DDD3] rounded-[10px] text-xs text-[#2F2925] placeholder:text-[#988D84] focus:outline-none focus:border-[#B4643B]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E5DDD3]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-[10px] border border-[#E5DDD3] bg-white text-xs font-bold text-[#6F655E] hover:bg-[#F6F0E8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amountCents <= 0}
              className="h-10 px-5 rounded-[10px] bg-[#7A3E24] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#934E2E] active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
            >
              <DollarSign size={14} />
              {isSubmitting ? "Recording..." : `Record Payment (${formatCents(amountCents)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
