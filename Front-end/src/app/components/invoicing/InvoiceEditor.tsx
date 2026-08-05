import React, { useState } from "react";
import { X, Plus, Trash2, Calendar, User, FileText, ShoppingBag, DollarSign } from "lucide-react";
import type {
  CreateInvoiceInput,
  CreateInvoiceItemInput,
  DomainCustomer,
  DomainInvoice,
  DomainOrder,
  UpdateInvoiceInput,
} from "../../domain/types";
import { formatCents } from "../../../lib/pdf/invoicePdf";

export interface OrderItemSummary {
  readonly product: string;
  readonly qty: number;
  readonly price: number;
}

export interface OrderSummary {
  readonly id: string;
  readonly customer?: string;
  readonly customerId?: string;
  readonly total: number;
  readonly items?: readonly OrderItemSummary[];
}

export interface InvoiceEditorProps {
  readonly invoice?: DomainInvoice;
  readonly customers?: readonly DomainCustomer[];
  readonly orders?: readonly (DomainOrder | OrderSummary)[];
  readonly bakeryId?: string;
  readonly onClose: () => void;
  readonly onSave: (input: CreateInvoiceInput | UpdateInvoiceInput) => void | Promise<void>;
}

interface EditableLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceDollarsStr: string;
  recipeId?: string;
}

export function InvoiceEditor({
  invoice,
  customers = [],
  orders = [],
  bakeryId = "bakery-north",
  onClose,
  onSave,
}: InvoiceEditorProps) {
  const isEditing = Boolean(invoice);

  const [customerId, setCustomerId] = useState<string>(
    invoice?.customerId || (customers[0]?.id ?? "")
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string>(invoice?.orderId || "");

  const todayStr = new Date().toISOString().split("T")[0];
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [issueDate, setIssueDate] = useState<string>(invoice?.issueDate || todayStr);
  const [dueDate, setDueDate] = useState<string>(invoice?.dueDate || defaultDueDate);

  const [items, setItems] = useState<EditableLineItem[]>(() => {
    if (invoice && invoice.items.length > 0) {
      return invoice.items.map((item, idx) => ({
        id: item.id || `item-${idx}`,
        description: item.description,
        quantity: item.quantity,
        unitPriceDollarsStr: (item.unitPriceCents / 100).toFixed(2),
        recipeId: item.recipeId,
      }));
    }
    return [
      {
        id: `item-${Date.now()}`,
        description: "Standard Sourdough Loaves",
        quantity: 2,
        unitPriceDollarsStr: "14.00",
      },
    ];
  });

  const [taxPercentStr, setTaxPercentStr] = useState<string>(
    invoice && invoice.subtotalCents > 0
      ? ((invoice.taxCents / invoice.subtotalCents) * 100).toFixed(1)
      : "0.0"
  );
  const [discountDollarsStr, setDiscountDollarsStr] = useState<string>(
    invoice ? (invoice.discountCents / 100).toFixed(2) : "0.00"
  );
  const [notes, setNotes] = useState<string>(invoice?.notes || "Thank you for your order!");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Populate items from order if selected
  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (!orderId) return;

    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const orderCustomerId = "customerId" in order ? order.customerId : undefined;
      if (orderCustomerId) setCustomerId(orderCustomerId);

      const orderItems = "items" in order ? order.items || [] : [];
      if (orderItems.length > 0) {
        setItems(
          orderItems.map((item: OrderItemSummary, idx: number) => ({
            id: `item-ord-${idx}-${Date.now()}`,
            description: item.product,
            quantity: item.qty,
            unitPriceDollarsStr: item.price.toFixed(2),
          }))
        );
      }
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length}`,
        description: "",
        quantity: 1,
        unitPriceDollarsStr: "0.00",
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof EditableLineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Calculations
  const calculatedItems = items.map((item) => {
    const qty = Math.max(0, item.quantity);
    const unitPriceCents = Math.round((parseFloat(item.unitPriceDollarsStr) || 0) * 100);
    const totalCents = qty * unitPriceCents;
    return { ...item, qty, unitPriceCents, totalCents };
  });

  const subtotalCents = calculatedItems.reduce((sum, item) => sum + item.totalCents, 0);
  const taxPercent = Math.max(0, parseFloat(taxPercentStr) || 0);
  const taxCents = Math.round((subtotalCents * taxPercent) / 100);
  const discountCents = Math.round((parseFloat(discountDollarsStr) || 0) * 100);
  const totalCents = Math.max(0, subtotalCents + taxCents - discountCents);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMsg("Please select a customer.");
      return;
    }
    if (calculatedItems.some((item) => !item.description.trim())) {
      setErrorMsg("All line items must have a description.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    const inputItems: CreateInvoiceItemInput[] = calculatedItems.map((item) => ({
      description: item.description.trim(),
      quantity: item.qty,
      unitPriceCents: item.unitPriceCents,
      recipeId: item.recipeId,
    }));

    try {
      if (isEditing && invoice) {
        const updateInput: UpdateInvoiceInput = {
          bakeryId: invoice.bakeryId || bakeryId,
          operationId: `update-invoice-${invoice.id}-${Date.now()}`,
          invoiceId: invoice.id,
          dueDate,
          items: inputItems,
          taxCents,
          discountCents,
          notes: notes.trim() || undefined,
        };
        await onSave(updateInput);
      } else {
        const createInput: CreateInvoiceInput = {
          bakeryId,
          operationId: `create-invoice-${Date.now()}`,
          invoiceId: `inv-${Date.now()}`,
          customerId,
          orderId: selectedOrderId || undefined,
          issueDate,
          dueDate,
          items: inputItems,
          taxCents,
          discountCents,
          notes: notes.trim() || undefined,
        };
        await onSave(createInput);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-[16px] border border-[#E5DDD3] shadow-xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDD3] bg-[#FAF1EB] flex-shrink-0">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#988D84]">
              {isEditing ? "Edit Invoice" : "Create New Invoice"}
            </span>
            <h2 className="text-lg font-extrabold text-[#2F2925]">
              {invoice ? invoice.invoiceNumber : "Draft Invoice"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#988D84] hover:text-[#2F2925] hover:bg-white/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-[#FCE9E7] border border-[#B8443C]/20 rounded-[10px] text-xs font-semibold text-[#B8443C]">
              {errorMsg}
            </div>
          )}

          {/* Customer & Order Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inv-customer" className="block text-xs font-bold text-[#2F2925] mb-1">
                Customer *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#988D84]" />
                <select
                  id="inv-customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#B4643B]"
                  required
                >
                  <option value="" disabled>Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="inv-order" className="block text-xs font-bold text-[#2F2925] mb-1">
                Link Existing Order (Optional)
              </label>
              <div className="relative">
                <ShoppingBag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#988D84]" />
                <select
                  id="inv-order"
                  value={selectedOrderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#B4643B]"
                >
                  <option value="">No linked order (Custom Invoice)</option>
                  {orders.map((o) => {
                    const custName = "customer" in o && o.customer ? o.customer : o.customerId || "Order";
                    return (
                      <option key={o.id} value={o.id}>
                        {o.id} - {custName} (${o.total})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inv-issue-date" className="block text-xs font-bold text-[#2F2925] mb-1">
                Issue Date
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#988D84]" />
                <input
                  id="inv-issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#B4643B]"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="inv-due-date" className="block text-xs font-bold text-[#2F2925] mb-1">
                Due Date *
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#988D84]" />
                <input
                  id="inv-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#B4643B]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#2F2925]">
                Line Items
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-[#7A3E24] font-bold flex items-center gap-1 hover:underline"
              >
                <Plus size={13} /> Add Line Item
              </button>
            </div>

            <div className="border border-[#E5DDD3] rounded-[12px] overflow-hidden bg-white">
              <div className="grid grid-cols-12 gap-2 bg-[#FAF1EB] px-3 py-2 text-[11px] font-bold text-[#988D84] uppercase tracking-wider">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit ($)</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              <div className="divide-y divide-[#F0E9E0]">
                {calculatedItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs">
                    <div className="col-span-6 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                        placeholder="Item description (e.g., Sourdough Loaf)"
                        className="w-full h-8 px-2 border border-[#E5DDD3] rounded-md text-xs text-[#2F2925] focus:outline-none focus:border-[#B4643B]"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 0)}
                        className="w-full h-8 px-2 border border-[#E5DDD3] rounded-md text-xs text-right font-medium text-[#2F2925] focus:outline-none focus:border-[#B4643B]"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPriceDollarsStr}
                        onChange={(e) => handleItemChange(item.id, "unitPriceDollarsStr", e.target.value)}
                        className="w-full h-8 px-2 border border-[#E5DDD3] rounded-md text-xs text-right font-medium text-[#2F2925] focus:outline-none focus:border-[#B4643B]"
                        required
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between pl-1">
                      <span className="font-bold text-[#2F2925]">
                        {formatCents(item.totalCents)}
                      </span>
                      {calculatedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-[#B8443C] transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calculations Summary Section */}
          <div className="bg-[#FBF8F3] border border-[#E5DDD3] rounded-[12px] p-4 flex flex-col sm:flex-row gap-4 items-start justify-between">
            <div className="space-y-2 flex-1 w-full">
              <label htmlFor="inv-notes" className="block text-[11px] font-bold text-[#988D84] uppercase tracking-wider">
                Notes & Terms
              </label>
              <textarea
                id="inv-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes shown on customer invoice..."
                className="w-full p-2.5 bg-white border border-[#E5DDD3] rounded-lg text-xs text-[#2F2925] focus:outline-none focus:border-[#B4643B]"
              />
            </div>

            <div className="w-full sm:w-56 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#6F655E]">
                <span>Subtotal</span>
                <span className="font-bold text-[#2F2925]">{formatCents(subtotalCents)}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-[#6F655E]">Tax (%)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={taxPercentStr}
                  onChange={(e) => setTaxPercentStr(e.target.value)}
                  className="w-16 h-7 px-1.5 border border-[#E5DDD3] rounded text-right text-xs font-medium focus:outline-none focus:border-[#B4643B]"
                />
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-[#6F655E]">Discount ($)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountDollarsStr}
                  onChange={(e) => setDiscountDollarsStr(e.target.value)}
                  className="w-20 h-7 px-1.5 border border-[#E5DDD3] rounded text-right text-xs font-medium focus:outline-none focus:border-[#B4643B]"
                />
              </div>

              <div className="pt-2 border-t border-[#E5DDD3] flex justify-between items-center text-sm font-extrabold text-[#2F2925]">
                <span>Total</span>
                <span className="text-[#7A3E24] text-base">{formatCents(totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5DDD3]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-[10px] border border-[#E5DDD3] bg-white text-xs font-bold text-[#6F655E] hover:bg-[#F6F0E8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedItems.length === 0}
              className="h-10 px-5 rounded-[10px] bg-[#7A3E24] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#934E2E] active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
            >
              <FileText size={14} />
              {isSubmitting ? "Saving..." : isEditing ? "Update Invoice" : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
