import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Save,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
  DollarSign,
  Send,
  Building,
  Check,
} from "lucide-react";
import type { DomainPaymentMethod, PaymentMethodType } from "../../domain/types";

export interface PaymentSettingsProps {
  readonly paymentMethods?: readonly DomainPaymentMethod[];
  readonly onSave?: (methods: DomainPaymentMethod[]) => void;
  readonly onBack?: () => void;
}

const DEFAULT_METHODS: readonly DomainPaymentMethod[] = [
  {
    id: "pm-zelle",
    bakeryId: "bakery-north",
    methodType: "zelle",
    name: "Zelle",
    isEnabled: true,
    requiresManualConfirmation: true,
    instructions: "Send Zelle payments to payments@earlsbakery.com or (555) 019-2831. Include your invoice number in the memo.",
  },
  {
    id: "pm-paypal",
    bakeryId: "bakery-north",
    methodType: "paypal",
    name: "PayPal",
    isEnabled: true,
    requiresManualConfirmation: false,
    instructions: "Pay via PayPal to @earlsbakery or payments@earlsbakery.com.",
  },
  {
    id: "pm-cash",
    bakeryId: "bakery-north",
    methodType: "cash",
    name: "Cash",
    isEnabled: true,
    requiresManualConfirmation: false,
    instructions: "Pay in cash upon pickup or delivery.",
  },
  {
    id: "pm-check",
    bakeryId: "bakery-north",
    methodType: "check",
    name: "Check",
    isEnabled: true,
    requiresManualConfirmation: false,
    instructions: "Make checks payable to Earl's Bakery LLC. Mail or present at pickup.",
  },
  {
    id: "pm-custom",
    bakeryId: "bakery-north",
    methodType: "custom",
    name: "Bank Wire / ACH",
    isEnabled: false,
    requiresManualConfirmation: true,
    instructions: "Direct ACH / Wire Transfer. Contact staff for routing and account numbers.",
  },
];

const METHOD_ICONS: Record<PaymentMethodType, React.ElementType> = {
  zelle: Send,
  paypal: CreditCard,
  cash: DollarSign,
  check: Building,
  custom: CreditCard,
};

export function PaymentSettings({ paymentMethods, onSave, onBack }: PaymentSettingsProps) {
  const [methods, setMethods] = useState<DomainPaymentMethod[]>(() =>
    paymentMethods && paymentMethods.length > 0 ? [...paymentMethods] : [...DEFAULT_METHODS]
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isEnabled: !m.isEnabled } : m))
    );
  };

  const handleInstructionChange = (id: string, text: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, instructions: text } : m))
    );
  };

  const handleNameChange = (id: string, name: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name } : m))
    );
  };

  const handleSave = () => {
    onSave?.(methods);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg border border-[#E5DDD3] bg-white text-[#6F655E] hover:bg-[#F6F0E8] transition-colors"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-[#2F2925] tracking-tight">Payment Settings</h1>
            <p className="text-xs text-[#6F655E] mt-0.5">
              Configure payment methods and payment instructions shown to customers on invoices
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="h-10 px-4 bg-[#7A3E24] text-white rounded-[10px] text-sm font-bold flex items-center gap-2 hover:bg-[#934E2E] active:scale-[0.98] transition-all shadow-sm"
        >
          {savedSuccess ? <Check size={16} /> : <Save size={16} />}
          {savedSuccess ? "Saved!" : "Save Settings"}
        </button>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 bg-[#E8F3EB] border border-[#3F7A55]/30 rounded-[12px] flex items-center gap-3 text-[#3F7A55]">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">Payment settings have been saved successfully.</span>
        </div>
      )}

      {/* Info Card */}
      <div className="mb-6 bg-[#F6F0E8] border border-[#E5DDD3] rounded-[14px] p-4 flex items-start gap-3">
        <HelpCircle size={18} className="text-[#B4643B] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#6F655E] leading-relaxed">
          <p className="font-semibold text-[#2F2925] mb-1">How Customer Payments Work</p>
          Enabled payment methods will be displayed on the public invoice view (<code className="bg-white/80 px-1 py-0.5 rounded border border-[#E5DDD3] text-[#7A3E24]">/invoice/:publicToken</code>) and exported PDF invoices. Customers use your specified instructions to complete payments.
        </div>
      </div>

      {/* Methods List */}
      <div className="space-y-4">
        {methods.map((method) => {
          const Icon = METHOD_ICONS[method.methodType] || CreditCard;
          const isZelle = method.methodType === "zelle";

          return (
            <div
              key={method.id}
              className={`bg-white rounded-[14px] border p-5 transition-all ${
                method.isEnabled
                  ? "border-[#E5DDD3] shadow-sm"
                  : "border-[#E5DDD3]/60 bg-gray-50/50 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      method.isEnabled
                        ? "bg-[#FAF1EB] text-[#7A3E24]"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <input
                        type="text"
                        value={method.name}
                        onChange={(e) => handleNameChange(method.id, e.target.value)}
                        className="font-bold text-[#2F2925] text-base bg-transparent border-b border-transparent hover:border-[#E5DDD3] focus:border-[#B4643B] focus:outline-none transition-colors"
                      />

                      {/* Zelle / Manual Confirmation Badge */}
                      {(isZelle || method.requiresManualConfirmation) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF4D8] text-[#B7791F] border border-[#B7791F]/30">
                          <AlertTriangle size={12} />
                          Requires Manual Staff Confirmation
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#988D84] mt-1 capitalize">
                      Type: {method.methodType}
                    </p>

                    {/* Instruction input */}
                    <div className="mt-3">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#988D84] mb-1">
                        Instructions / Account Details
                      </label>
                      <textarea
                        rows={2}
                        value={method.instructions || ""}
                        onChange={(e) => handleInstructionChange(method.id, e.target.value)}
                        placeholder={`Enter ${method.name} payment instructions (e.g. account email, phone, handle, or memo details)...`}
                        className="w-full text-xs text-[#2F2925] bg-[#FBF8F3] border border-[#E5DDD3] rounded-lg p-2.5 focus:outline-none focus:border-[#B4643B] focus:bg-white transition-colors leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-[#6F655E]">
                    {method.isEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={method.isEnabled}
                    onClick={() => handleToggle(method.id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      method.isEnabled ? "bg-[#7A3E24]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        method.isEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
