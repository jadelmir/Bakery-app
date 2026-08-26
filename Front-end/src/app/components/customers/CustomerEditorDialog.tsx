import React, { useState, useEffect, useId } from "react";
import { X, User, Mail, Phone, MapPin, FileText, Tag, CheckCircle } from "lucide-react";

export type CustomerType = "wholesale" | "retail";

export interface CustomerFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  address: string;
  notes: string;
}

export interface CustomerMutationResult {
  readonly ok: boolean;
  readonly data?: {
    readonly changes?: {
      readonly customers?: readonly unknown[];
    };
  };
  readonly error?: { readonly message?: string } | string;
}

export type CustomerSaveResult = void | CustomerMutationResult;

export interface CustomerEditorDialogProps {
  customer?: CustomerFormData | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave: (data: CustomerFormData) => CustomerSaveResult | Promise<CustomerSaveResult>;
}

export function CustomerEditorDialog({
  customer,
  isOpen = true,
  onClose,
  onSave,
}: CustomerEditorDialogProps) {
  const dialogId = useId();
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const typeId = useId();
  const addressId = useId();
  const notesId = useId();

  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [type, setType] = useState<CustomerType>(customer?.type ?? "retail");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [notes, setNotes] = useState(customer?.notes ?? "");

  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setName(customer.name ?? "");
      setEmail(customer.email ?? "");
      setPhone(customer.phone ?? "");
      setType(customer.type ?? "retail");
      setAddress(customer.address ?? "");
      setNotes(customer.notes ?? "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setType("retail");
      setAddress("");
      setNotes("");
    }
    setErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  }, [customer, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (!isSubmitting) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Customer name is required.";
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await onSave({
        id: customer?.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        type,
        address: address.trim(),
        notes: notes.trim(),
      });

      if (result && !result.ok) {
        const error = typeof result.error === "string" ? result.error : result.error?.message;
        throw new Error(error || "Unable to save customer. Please try again.");
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save customer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      aria-hidden={!isOpen}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2F2925]/50 backdrop-blur-xs animate-fade-in"
    >
      <div
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden bg-white rounded-[24px] shadow-2xl border border-[#E5DDD3] transform transition-all"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5DDD3] bg-[#F6F0E8]">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-white text-[#7A3E24] border border-[#E5DDD3] shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-extrabold text-[#2F2925]">
                {customer?.id ? "Edit Customer Profile" : "Add New Customer"}
              </h2>
              <p className="text-xs text-[#6F655E]">
                {customer?.id
                  ? "Update directory record and details"
                  : "Enter customer information to save in directory"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-[#988D84] hover:text-[#2F2925] rounded-[10px] hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor={nameId}
              className="block text-xs font-bold text-[#6F655E] uppercase mb-1"
            >
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#988D84]">
                <User className="w-4 h-4" />
              </div>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Golden Grain Cafe or Sarah Jenkins"
                className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-[12px] border bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24] transition-all ${
                  errors.name
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-[#E5DDD3]"
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs font-semibold text-rose-500">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={emailId}
                className="block text-xs font-bold text-[#6F655E] uppercase mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#988D84]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com (optional)"
                  className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-[12px] border bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24] transition-all ${
                    errors.email
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-[#E5DDD3]"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-semibold text-rose-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor={phoneId}
                className="block text-xs font-bold text-[#6F655E] uppercase mb-1"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#988D84]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id={phoneId}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-[12px] border border-[#E5DDD3] bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24] transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor={typeId}
              className="block text-xs font-bold text-[#6F655E] uppercase mb-1"
            >
              Customer Type
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#988D84]">
                <Tag className="w-4 h-4" />
              </div>
              <select
                id={typeId}
                value={type}
                onChange={(e) => setType(e.target.value as CustomerType)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-[12px] border border-[#E5DDD3] bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24] transition-all appearance-none"
              >
                <option value="retail">Retail Customer</option>
                <option value="wholesale">Wholesale Account</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor={addressId}
              className="block text-xs font-bold text-[#6F655E] uppercase mb-1"
            >
              Delivery / Billing Address
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-[#988D84]">
                <MapPin className="w-4 h-4" />
              </div>
              <textarea
                id={addressId}
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, city, state, zip"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-[12px] border border-[#E5DDD3] bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24] transition-all resize-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={notesId}
              className="block text-xs font-bold text-[#6F655E] uppercase mb-1"
            >
              Notes & Preferences
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-[#988D84]">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                id={notesId}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special delivery instructions, dietary preferences, or payment terms..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-[12px] border border-[#E5DDD3] bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24] transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E5DDD3]">
            {submitError && (
              <p role="alert" className="mr-auto text-xs font-semibold text-rose-500" aria-live="polite">
                {submitError}
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-[#6F655E] bg-[#F6F0E8] hover:bg-[#E5DDD3] rounded-[12px] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 text-xs font-extrabold text-white bg-[#7A3E24] hover:bg-[#934E2E] active:bg-[#60301B] rounded-[12px] shadow-sm transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : customer?.id ? "Save Changes" : "Create Customer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
