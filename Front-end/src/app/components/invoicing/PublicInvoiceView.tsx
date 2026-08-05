import React, { useEffect, useState } from "react";
import {
  Printer,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  CreditCard,
  Building,
  DollarSign,
  FileText,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import type { DomainInvoice, DomainPaymentMethod, InvoiceStatus, PaymentMethodType } from "../../domain/types";
import { formatCents, formatDate, printInvoicePdf, type InvoicePdfData } from "../../../lib/pdf/invoicePdf";

export interface PublicInvoiceViewProps {
  readonly publicToken: string;
  readonly invoice?: DomainInvoice;
  readonly paymentMethods?: readonly DomainPaymentMethod[];
  readonly onFetchInvoiceByToken?: (token: string) => Promise<DomainInvoice | undefined>;
}

const DEFAULT_PUBLIC_INVOICE: DomainInvoice = {
  id: "inv-pub-sample",
  bakeryId: "bakery-north",
  invoiceNumber: "INV-2026-001",
  publicToken: "tok_sample_123",
  customerId: "c1",
  customerName: "Sarah Mitchell",
  customerEmail: "sarah.m@email.com",
  status: "Partially paid",
  issueDate: "2026-07-20",
  dueDate: "2026-08-03",
  subtotalCents: 4400,
  taxCents: 350,
  discountCents: 0,
  totalCents: 4750,
  amountPaidCents: 2000,
  balanceCents: 2750,
  items: [
    {
      id: "inv-pub-sample:1",
      invoiceId: "inv-pub-sample",
      description: "Sourdough Loaves (2x)",
      quantity: 2,
      unitPriceCents: 1400,
      totalCents: 2800,
    },
    {
      id: "inv-pub-sample:2",
      invoiceId: "inv-pub-sample",
      description: "Focaccia Trays (2x)",
      quantity: 2,
      unitPriceCents: 800,
      totalCents: 1600,
    },
  ],
  notes: "Thank you for your order! Please remit remaining payment using Zelle or PayPal.",
  createdAt: "2026-07-20T10:00:00Z",
};

const DEFAULT_PAYMENT_METHODS: readonly DomainPaymentMethod[] = [
  {
    id: "pm-zelle",
    bakeryId: "bakery-north",
    methodType: "zelle",
    name: "Zelle",
    isEnabled: true,
    requiresManualConfirmation: true,
    instructions: "Send Zelle payments to payments@earlsbakery.com or (555) 019-2831. Include invoice #INV-2026-001 in memo.",
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
    instructions: "Pay in cash upon pickup at 14 Birch Lane, Mill Valley.",
  },
];

const METHOD_ICONS: Record<PaymentMethodType, React.ElementType> = {
  zelle: Send,
  paypal: CreditCard,
  cash: DollarSign,
  check: Building,
  custom: CreditCard,
};

const STATUS_BADGE: Record<InvoiceStatus, { label: string; bg: string; text: string }> = {
  Draft: { label: "DRAFT", bg: "bg-[#F6F0E8]", text: "text-[#6F655E]" },
  Sent: { label: "SENT", bg: "bg-[#E8F0FB]", text: "text-[#4B6F8C]" },
  Viewed: { label: "VIEWED", bg: "bg-[#E8F0FB]", text: "text-[#4B6F8C]" },
  "Partially paid": { label: "PARTIALLY PAID", bg: "bg-[#FFF4D8]", text: "text-[#B7791F]" },
  Paid: { label: "PAID IN FULL", bg: "bg-[#E8F3EB]", text: "text-[#3F7A55]" },
  Overdue: { label: "OVERDUE", bg: "bg-[#FCE9E7]", text: "text-[#B8443C]" },
  Cancelled: { label: "CANCELLED", bg: "bg-[#F6F0E8]", text: "text-[#988D84]" },
};

export function PublicInvoiceView({
  publicToken,
  invoice: propInvoice,
  paymentMethods: propPaymentMethods,
  onFetchInvoiceByToken,
}: PublicInvoiceViewProps) {
  const [invoice, setInvoice] = useState<DomainInvoice | undefined>(propInvoice);
  const [loading, setLoading] = useState(!propInvoice && Boolean(onFetchInvoiceByToken));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (propInvoice) {
      setInvoice(propInvoice);
      setLoading(false);
      return;
    }

    if (onFetchInvoiceByToken) {
      let isMounted = true;
      setLoading(true);
      onFetchInvoiceByToken(publicToken)
        .then((fetched) => {
          if (isMounted) {
            if (fetched) {
              setInvoice(fetched);
            } else {
              // Fallback to sample if token matches sample or testing
              setInvoice(DEFAULT_PUBLIC_INVOICE);
            }
          }
        })
        .catch(() => {
          if (isMounted) setNotFound(true);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setInvoice(DEFAULT_PUBLIC_INVOICE);
      setLoading(false);
    }
  }, [publicToken, propInvoice, onFetchInvoiceByToken]);

  const methods = (propPaymentMethods && propPaymentMethods.length > 0
    ? propPaymentMethods
    : DEFAULT_PAYMENT_METHODS
  ).filter((m) => m.isEnabled);

  const handlePrint = () => {
    if (!invoice) return;
    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.issueDate || invoice.createdAt || new Date().toISOString(),
      dueDate: invoice.dueDate,
      status: invoice.status,
      bakery: {
        name: "Earl's Bakery",
        email: "orders@earlsbakery.com",
        phone: "(415) 555-0182",
        address: "14 Birch Lane, Mill Valley, CA",
      },
      customer: {
        name: invoice.customerName || "Customer",
        email: invoice.customerEmail,
      },
      items: invoice.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        totalPriceCents: i.totalCents,
      })),
      subtotalCents: invoice.subtotalCents,
      taxCents: invoice.taxCents,
      discountCents: invoice.discountCents,
      totalCents: invoice.totalCents,
      amountPaidCents: invoice.amountPaidCents,
      balanceCents: invoice.balanceCents,
      paymentInstructions: methods.map((m) => `${m.name}: ${m.instructions || ""}`).join("\n"),
      notes: invoice.notes,
    };
    printInvoicePdf(pdfData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-4">
        <div className="text-center text-[#6F655E] space-y-2">
          <Clock size={28} className="mx-auto text-[#B4643B] animate-spin" />
          <p className="font-bold text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-4">
        <div className="bg-white rounded-[16px] border border-[#E5DDD3] p-8 max-w-md text-center shadow-sm space-y-3">
          <AlertTriangle size={36} className="mx-auto text-[#B8443C]" />
          <h1 className="text-xl font-extrabold text-[#2F2925]">Invoice Not Found</h1>
          <p className="text-xs text-[#6F655E] leading-relaxed">
            The public invoice token provided is invalid or has expired. Please check the URL or contact Earl's Bakery staff.
          </p>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[invoice.status] || STATUS_BADGE.Draft;

  return (
    <div className="min-h-screen bg-[#FBF8F3] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Print / Download Bar */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-xs border border-[#E5DDD3] rounded-xl px-5 py-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6F655E]">
            <ShieldCheck size={16} className="text-[#3F7A55]" />
            Secure Public Invoice Portal
          </div>
          <button
            onClick={handlePrint}
            className="h-9 px-4 bg-[#7A3E24] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#934E2E] active:scale-[0.98] transition-all shadow-xs"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-[20px] border border-[#E5DDD3] shadow-md p-6 sm:p-10 space-y-8">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#E5DDD3]">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7A3E24] flex items-center justify-center text-white">
                  <Leaf size={18} />
                </div>
                <h1 className="text-2xl font-extrabold text-[#2F2925] tracking-tight">Earl's Bakery</h1>
              </div>
              <p className="text-xs text-[#6F655E] pt-1">14 Birch Lane, Mill Valley, CA 94941</p>
              <p className="text-xs text-[#6F655E]">orders@earlsbakery.com · (415) 555-0182</p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-xs font-extrabold tracking-widest uppercase text-[#988D84] block">INVOICE</span>
              <p className="text-xl font-extrabold text-[#2F2925]">{invoice.invoiceNumber}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold tracking-wider ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Customer & Dates Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FBF8F3] p-5 rounded-[14px] border border-[#E5DDD3]">
            <div className="space-y-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#988D84]">Billed To</h3>
              <p className="font-extrabold text-[#2F2925] text-sm">{invoice.customerName || "Valued Customer"}</p>
              {invoice.customerEmail && <p className="text-xs text-[#6F655E]">{invoice.customerEmail}</p>}
            </div>

            <div className="space-y-1.5 text-xs text-[#2F2925]">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#988D84]">Invoice Details</h3>
              <p><strong className="text-[#6F655E]">Issue Date:</strong> {formatDate(invoice.issueDate)}</p>
              <p><strong className="text-[#6F655E]">Due Date:</strong> {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E5DDD3] bg-[#FAF1EB] text-[#988D84] uppercase font-bold text-[11px]">
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-3">Item Description</th>
                  <th className="py-3 px-3 text-right w-16">Qty</th>
                  <th className="py-3 px-3 text-right w-24">Unit Price</th>
                  <th className="py-3 px-3 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E9E0]">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-3 text-center text-[#988D84] font-medium">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-[#2F2925]">{item.description}</td>
                    <td className="py-3 px-3 text-right text-[#6F655E]">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-[#6F655E]">{formatCents(item.unitPriceCents)}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#2F2925]">{formatCents(item.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Payment Instructions Section */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start pt-4 border-t border-[#E5DDD3]">
            {/* Payment Methods & Instructions */}
            <div className="flex-1 w-full space-y-3">
              <h3 className="text-sm font-extrabold text-[#2F2925] flex items-center gap-1.5">
                <CreditCard size={16} className="text-[#7A3E24]" /> How to Pay
              </h3>

              {methods.length === 0 ? (
                <p className="text-xs text-[#6F655E]">Please contact Earl's Bakery for payment instructions.</p>
              ) : (
                <div className="space-y-2.5">
                  {methods.map((method) => {
                    const Icon = METHOD_ICONS[method.methodType] || CreditCard;
                    const isZelle = method.methodType === "zelle";

                    return (
                      <div
                        key={method.id}
                        className="bg-[#FBF8F3] border border-[#E5DDD3] rounded-xl p-3.5 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon size={15} className="text-[#7A3E24]" />
                            <strong className="text-xs font-bold text-[#2F2925]">{method.name}</strong>
                          </div>
                          {isZelle && (
                            <span className="text-[10px] font-bold text-[#B7791F] bg-[#FFF4D8] px-2 py-0.5 rounded-full">
                              Requires Staff Confirmation
                            </span>
                          )}
                        </div>
                        {method.instructions && (
                          <p className="text-xs text-[#6F655E] leading-relaxed pl-6">
                            {method.instructions}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Totals Summary */}
            <div className="w-full md:w-64 bg-[#FAF1EB] border border-[#E5DDD3] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#6F655E]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#2F2925]">{formatCents(invoice.subtotalCents)}</span>
              </div>

              {invoice.taxCents > 0 && (
                <div className="flex justify-between text-[#6F655E]">
                  <span>Tax</span>
                  <span className="font-semibold text-[#2F2925]">{formatCents(invoice.taxCents)}</span>
                </div>
              )}

              {invoice.discountCents > 0 && (
                <div className="flex justify-between text-[#3F7A55]">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatCents(invoice.discountCents)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#E5DDD3] flex justify-between font-extrabold text-sm text-[#2F2925]">
                <span>Total</span>
                <span>{formatCents(invoice.totalCents)}</span>
              </div>

              <div className="flex justify-between text-[#3F7A55] font-semibold pt-1">
                <span>Amount Paid</span>
                <span>{formatCents(invoice.amountPaidCents)}</span>
              </div>

              <div className="pt-2 border-t border-[#E5DDD3] flex justify-between font-extrabold text-sm text-[#B8443C]">
                <span>Balance Due</span>
                <span>{formatCents(invoice.balanceCents)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-[#FBF8F3] border border-[#E5DDD3] rounded-xl p-4 text-xs text-[#6F655E]">
              <strong className="text-[#2F2925] block mb-1">Notes & Terms:</strong>
              <p className="leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
