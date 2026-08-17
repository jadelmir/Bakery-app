import { useState } from "react";
import { Search, X, Plus, Check } from "lucide-react";
import type { Customer } from "../../types";
import { CUSTOMERS, RECIPES } from "../../constants";
import { localDateKey } from "../../constants";
import { useBakeryDomain } from "../../state/provider";
import { CustomerEditorDialog, type CustomerFormData } from "../customers/CustomerEditorDialog";

type OrderStep = 1 | 2 | 3 | 4 | 5;
type OrderItemDraft = { product: string; qty: number; price: number; recipeId?: string };
type OrderRecipeOption = { id: string; name: string; yield: string; sellingPrice: number };

export function AddOrderModal({ onClose, onCreatePlan, customers = CUSTOMERS, recipes = RECIPES }: {
  onClose: () => void;
  onCreatePlan: (items: OrderItemDraft[], date: string, time: string, customer: Customer, paid: number, notes: string) => void | Promise<void>;
  customers?: Customer[];
  recipes?: OrderRecipeOption[];
}) {
  const { bakeryId, commands } = useBakeryDomain();
  const [step, setStep] = useState<OrderStep>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [createdCustomers, setCreatedCustomers] = useState<Customer[]>([]);
  const [customerEditorOpen, setCustomerEditorOpen] = useState(false);
  const [items, setItems] = useState<OrderItemDraft[]>([]);
  const [pickupDate, setPickupDate] = useState(() => localDateKey());
  const [pickupTime, setPickupTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [deposit, setDeposit] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const STEP_LABELS = ["Customer", "Products", "Pickup", "Payment", "Confirm"];
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const availableCustomers = [
    ...createdCustomers,
    ...customers.filter(customer => !createdCustomers.some(created => created.id === customer.id)),
  ];

  const addItem = (product: string, price: number, recipeId?: string) =>
    setItems(prev => {
      const existing = prev.find(item => item.product === product);
      if (existing) return prev.map(item => item.product === product ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { product, qty: 1, price, recipeId }];
    });

  const changeQty = (product: string, delta: number) =>
    setItems(prev => prev
      .map(item => item.product === product ? { ...item, qty: Math.max(0, item.qty + delta) } : item)
      .filter(item => item.qty > 0));

  const canContinue = step === 1 ? !!selectedCustomer : step === 2 ? items.length > 0 : true;

  const handleCreateCustomer = async (data: CustomerFormData) => {
    const operationId = `create-cust-from-order-${Date.now()}`;
    const result = await commands.createCustomer({
      bakeryId,
      operationId,
      customerId: globalThis.crypto?.randomUUID?.() ?? `c-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      type: data.type || "retail",
      address: data.address,
      notes: data.notes,
    });

    if (!result.ok) throw new Error(result.error.message);
    const created = result.data.changes.customers?.[0];
    if (!created) throw new Error("Customer creation returned no customer result.");

    const createdCustomer: Customer = {
      id: created.id,
      name: created.name,
      phone: created.phone ?? "",
      email: created.email,
      address: created.address ?? "",
      notes: created.notes ?? "",
      orders: 0,
      totalSpent: 0,
      balance: 0,
      favorites: [],
    };

    setCreatedCustomers(current => [
      createdCustomer,
      ...current.filter(customer => customer.id !== createdCustomer.id),
    ]);
    setSelectedCustomer(createdCustomer);
    setCustomerEditorOpen(false);
  };

  const submitOrder = async () => {
    if (!selectedCustomer || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onCreatePlan(items, pickupDate, pickupTime, selectedCustomer, deposit, notes);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not save this order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <>
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full lg:max-w-lg bg-white lg:rounded-[18px] rounded-t-[18px] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5DDD3]">
          <div>
            <p className="text-[11px] text-[#988D84] font-semibold uppercase tracking-wider">Step {step} of 5 — {STEP_LABELS[step - 1]}</p>
            <h2 className="font-extrabold text-[#2F2925] text-lg mt-0.5">New Order</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close new order" className="w-9 h-9 rounded-full bg-[#F6F0E8] flex items-center justify-center hover:bg-[#EDE6DC] transition-colors">
            <X size={16} className="text-[#6F655E]" />
          </button>
        </div>

        <div className="flex px-5 py-3 gap-1.5 border-b border-[#E5DDD3]">
          {[1, 2, 3, 4, 5].map(value => <div key={value} className={`flex-1 h-1 rounded-full transition-colors duration-300 ${value <= step ? "bg-[#7A3E24]" : "bg-[#E5DDD3]"}`} />)}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          {step === 1 && <>
            <p className="text-sm text-[#6F655E]">Select a customer or add a new one.</p>
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
              <input placeholder="Search customers…" className="w-full h-11 pl-9 pr-4 bg-[#F6F0E8] border border-[#E5DDD3] rounded-[10px] text-sm placeholder:text-[#988D84] focus:outline-none focus:border-[#B4643B] transition-colors" />
            </div>
            {availableCustomers.map(customer => (
              <button key={customer.id} type="button" onClick={() => setSelectedCustomer(customer)} aria-pressed={selectedCustomer?.id === customer.id}
                className={`w-full text-left flex items-center gap-3 p-3.5 rounded-[12px] border cursor-pointer transition-all ${selectedCustomer?.id === customer.id ? "border-[#7A3E24] bg-[#FAF1EB]" : "border-[#E5DDD3] bg-white hover:bg-[#F6F0E8]"}`}>
                <div className="w-9 h-9 rounded-full bg-[#F3DED1] flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-extrabold text-[#7A3E24]">{customer.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#2F2925]">{customer.name}</p>
                  <p className="text-xs text-[#988D84]">{customer.email}</p>
                </div>
                {selectedCustomer?.id === customer.id && <Check size={16} className="text-[#7A3E24]" />}
              </button>
            ))}
            <button type="button" onClick={() => setCustomerEditorOpen(true)} className="w-full h-11 border-2 border-dashed border-[#E5DDD3] rounded-[12px] text-sm text-[#988D84] font-semibold flex items-center justify-center gap-2 hover:border-[#B4643B] hover:text-[#B4643B] transition-colors">
              <Plus size={14} /> Add new customer
            </button>
          </>}

          {step === 2 && <>
            <p className="text-sm text-[#6F655E]">Add products to this order.</p>
            {recipes.map(recipe => {
              const inOrder = items.find(item => item.product === recipe.name);
              return <div key={recipe.id} className="flex items-center justify-between p-3.5 bg-white border border-[#E5DDD3] rounded-[12px]">
                <div>
                  <p className="text-sm font-bold text-[#2F2925]">{recipe.name}</p>
                  <p className="text-xs text-[#988D84]">{recipe.yield} · <span className="font-['DM_Mono',monospace]">${recipe.sellingPrice}</span></p>
                </div>
                {inOrder ? <div className="flex items-center gap-2">
                  <button type="button" onClick={() => changeQty(recipe.name, -1)} className="w-8 h-8 rounded-full bg-[#F6F0E8] flex items-center justify-center text-[#7A3E24] font-bold text-lg hover:bg-[#EDE6DC] transition-colors">−</button>
                  <span className="text-sm font-extrabold text-[#2F2925] w-5 text-center font-['DM_Mono',monospace]">{inOrder.qty}</span>
                  <button type="button" onClick={() => addItem(recipe.name, recipe.sellingPrice)} className="w-8 h-8 rounded-full bg-[#7A3E24] flex items-center justify-center text-white font-bold text-lg hover:bg-[#934E2E] transition-colors">+</button>
                </div> : <button type="button" onClick={() => addItem(recipe.name, recipe.sellingPrice, recipe.id)} className="h-8 px-3 bg-[#F3DED1] text-[#7A3E24] rounded-[8px] text-xs font-bold hover:bg-[#EDD4C4] transition-colors">Add</button>}
              </div>;
            })}
            {total > 0 && <div className="bg-[#F6F0E8] rounded-[12px] p-3.5 flex justify-between items-center">
              <span className="text-sm text-[#6F655E] font-semibold">Order total</span>
              <span className="text-lg font-extrabold text-[#2F2925] font-['DM_Mono',monospace]">${total}</span>
            </div>}
          </>}

          {step === 3 && <>
            <p className="text-sm text-[#6F655E]">When and how should this order be ready?</p>
            {[
              { label: "Pickup Date", type: "date", val: pickupDate, set: setPickupDate },
              { label: "Pickup Time", type: "time", val: pickupTime, set: setPickupTime },
            ].map(({ label, type, val, set }) => <div key={label}>
              <label className="text-[11px] font-bold text-[#6F655E] uppercase tracking-wider block mb-1.5">{label}</label>
              <input type={type} value={val} onChange={event => set(event.target.value)} className="w-full h-11 px-3.5 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#B4643B] transition-colors" />
            </div>)}
            <div>
              <label className="text-[11px] font-bold text-[#6F655E] uppercase tracking-wider block mb-1.5">Notes</label>
              <textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Sliced loaves, gift wrapping, dietary notes…" rows={3} className="w-full px-3.5 py-3 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] placeholder:text-[#988D84] resize-none focus:outline-none focus:border-[#B4643B] transition-colors" />
            </div>
          </>}

          {step === 4 && <>
            <p className="text-sm text-[#6F655E]">Set payment method and deposit amount.</p>
            <div className="bg-[#F6F0E8] rounded-[12px] p-3.5 flex justify-between">
              <span className="text-sm text-[#6F655E] font-semibold">Order total</span>
              <span className="font-extrabold text-[#2F2925] font-['DM_Mono',monospace]">${total}</span>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#6F655E] uppercase tracking-wider block mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {["Cash", "Venmo", "Zelle"].map(method => <button type="button" key={method} onClick={() => setPaymentMethod(method.toLowerCase())} className={`h-10 rounded-[10px] text-sm font-bold border transition-colors ${paymentMethod === method.toLowerCase() ? "bg-[#7A3E24] text-white border-[#7A3E24]" : "bg-white text-[#6F655E] border-[#E5DDD3] hover:bg-[#F6F0E8]"}`}>{method}</button>)}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#6F655E] uppercase tracking-wider block mb-1.5">Deposit Received ($)</label>
              <input type="number" value={deposit || ""} onChange={event => setDeposit(Number(event.target.value))} placeholder="0.00" className="w-full h-11 px-3.5 bg-white border border-[#E5DDD3] rounded-[10px] text-sm font-['DM_Mono',monospace] text-[#2F2925] placeholder:text-[#988D84] focus:outline-none focus:border-[#B4643B] transition-colors" />
            </div>
            {deposit > 0 && <div className="bg-[#FFF4D8] border border-[#B7791F]/20 rounded-[12px] p-3.5 flex justify-between">
              <span className="text-sm text-[#B7791F] font-semibold">Balance at pickup</span>
              <span className="font-extrabold text-[#B7791F] font-['DM_Mono',monospace]">${Math.max(0, total - deposit)}</span>
            </div>}
          </>}

          {step === 5 && <>
            <div className="bg-[#F6F0E8] rounded-[14px] p-4 space-y-2.5">
              {[
                ["Customer", selectedCustomer?.name || "—"],
                ["Pickup", `${pickupDate} · ${pickupTime}`],
                ["Payment", paymentMethod],
                ["Total", `$${total}`],
                ...(deposit > 0 ? [["Deposit", `$${deposit} paid`]] : []),
                ...(notes ? [["Notes", notes]] : []),
              ].map(([key, value]) => <div key={key} className="flex justify-between gap-4">
                <span className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider">{key}</span>
                <span className="text-sm font-semibold text-[#2F2925] text-right">{value}</span>
              </div>)}
            </div>
            {items.length > 0 && <div className="bg-white rounded-[14px] border border-[#E5DDD3] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F0E9E0]"><p className="text-[11px] font-bold text-[#988D84] uppercase tracking-wider">Items</p></div>
              {items.map((item, index) => <div key={index} className={`flex justify-between px-4 py-3 ${index < items.length - 1 ? "border-b border-[#F0E9E0]" : ""}`}>
                <span className="text-sm text-[#2F2925]">{item.qty}× {item.product}</span>
                <span className="text-sm font-bold font-['DM_Mono',monospace] text-[#2F2925]">${item.qty * item.price}</span>
              </div>)}
            </div>}
            <div className="bg-[#EAF2F8] rounded-[12px] p-3.5">
              <p className="text-xs font-bold text-[#4B6F8C] mb-1">Ready to create</p>
              <p className="text-xs text-[#4B6F8C]/80 leading-relaxed">The order will be saved to this bakery and a production plan will be generated for the selected pickup time.</p>
            </div>
            {submitError && <p role="alert" className="rounded-[10px] bg-[#FCE9E7] px-3.5 py-3 text-xs font-semibold text-[#B8443C]">{submitError}</p>}
          </>}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-[#E5DDD3]">
          {step > 1 && <button type="button" onClick={() => setStep(current => (current - 1) as OrderStep)} className="flex-1 h-11 rounded-[10px] border border-[#E5DDD3] text-[#6F655E] font-semibold text-sm hover:bg-[#F6F0E8] transition-colors">Back</button>}
          {step < 5 ? <button type="button" onClick={() => setStep(current => (current + 1) as OrderStep)} disabled={!canContinue} className="flex-1 h-11 rounded-[10px] bg-[#7A3E24] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#934E2E] transition-colors">{step === 4 ? "Review Order" : "Continue"}</button>
            : <button type="button" onClick={() => void submitOrder()} disabled={isSubmitting} className="flex-1 h-11 rounded-[10px] bg-[#7A3E24] text-white font-bold text-sm disabled:opacity-50 hover:bg-[#934E2E] transition-colors">{isSubmitting ? "Saving Order…" : "Create Order"}</button>}
        </div>
      </div>
    </div>
    <CustomerEditorDialog
      isOpen={customerEditorOpen}
      onClose={() => setCustomerEditorOpen(false)}
      onSave={handleCreateCustomer}
    />
  </>;
}
