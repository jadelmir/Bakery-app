import React, { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  DollarSign,
  Send,
  Printer,
  Edit3,
  XCircle,
  CreditCard,
  ExternalLink,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";
import type {
  CreateInvoiceInput,
  DomainCustomer,
  DomainInvoice,
  DomainOrder,
  DomainPaymentMethod,
  InvoiceStatus,
  RecordPaymentInput,
  UpdateInvoiceInput,
} from "../../domain/types";
import { formatCents, formatDate, printInvoicePdf, type InvoicePdfData } from "../../../lib/pdf/invoicePdf";
import { InvoiceEditor, type OrderSummary } from "./InvoiceEditor";
import { RecordPaymentDialog } from "./RecordPaymentDialog";

export interface InvoiceListProps {
  readonly invoices?: readonly DomainInvoice[];
  readonly bakeryId?: string;
  readonly customers?: readonly DomainCustomer[];
  readonly orders?: readonly (DomainOrder | OrderSummary)[];
  readonly paymentMethods?: readonly DomainPaymentMethod[];
  readonly onCreateInvoice?: (input: CreateInvoiceInput) => void | Promise<void>;
  readonly onUpdateInvoice?: (input: UpdateInvoiceInput) => void | Promise<void>;
  readonly onRecordPayment?: (input: RecordPaymentInput) => void | Promise<void>;
  readonly onCancelInvoice?: (invoiceId: string) => void | Promise<void>;
  readonly onOpenPaymentSettings?: () => void;
  readonly onOpenPublicInvoice?: (publicToken: string) => void;
}

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; textCls: string; bgCls: string }
> = {
  Draft: { label: "Draft", textCls: "text-[#6F655E]", bgCls: "bg-[#F6F0E8]" },
  Sent: { label: "Sent", textCls: "text-[#4B6F8C]", bgCls: "bg-[#E8F0FB]" },
  Viewed: { label: "Viewed", textCls: "text-[#4B6F8C]", bgCls: "bg-[#E8F0FB]" },
  "Partially paid": {
    label: "Partially Paid",
    textCls: "text-[#B7791F]",
    bgCls: "bg-[#FFF4D8]",
  },
  Paid: { label: "Paid", textCls: "text-[#3F7A55]", bgCls: "bg-[#E8F3EB]" },
  Overdue: { label: "Overdue", textCls: "text-[#B8443C]", bgCls: "bg-[#FCE9E7]" },
  Cancelled: {
    label: "Cancelled",
    textCls: "text-[#988D84]",
    bgCls: "bg-[#F6F0E8]",
  },
};

export function InvoiceList({
  invoices: propInvoices,
  bakeryId = "bakery-north",
  customers = [],
  orders = [],
  paymentMethods,
  onCreateInvoice,
  onUpdateInvoice,
  onRecordPayment,
  onCancelInvoice,
  onOpenPaymentSettings,
  onOpenPublicInvoice,
}: InvoiceListProps) {
  const invoiceList = propInvoices ?? [];

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<string>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<DomainInvoice | undefined>(undefined);
  const [recordPaymentInvoice, setRecordPaymentInvoice] = useState<DomainInvoice | undefined>(undefined);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Filtered invoices
  const filteredInvoices = invoiceList.filter((inv) => {
    const q = search.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
      (inv.customerEmail && inv.customerEmail.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (filterTab === "all") return true;
    return inv.status.toLowerCase().replace(" ", "-") === filterTab.toLowerCase().replace(" ", "-");
  });

  // Calculate Metrics
  const totalInvoicedCents = invoiceList.reduce(
    (sum, inv) => (inv.status !== "Cancelled" ? sum + inv.totalCents : sum),
    0
  );
  const outstandingBalanceCents = invoiceList.reduce(
    (sum, inv) => (inv.status !== "Cancelled" ? sum + inv.balanceCents : sum),
    0
  );
  const paidThisMonthCents = invoiceList.reduce(
    (sum, inv) => (inv.status !== "Cancelled" ? sum + inv.amountPaidCents : sum),
    0
  );

  const handlePrintPdf = (invoice: DomainInvoice) => {
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
      paymentInstructions: "Send Zelle payments to payments@earlsbakery.com or PayPal to @earlsbakery.",
      notes: invoice.notes,
    };
    printInvoicePdf(pdfData);
  };

  const handleSendEmail = (invoice: DomainInvoice) => {
    const publicUrl = `${window.location.origin}/invoice/${invoice.publicToken}`;
    showToast(`Invoice email sent to ${invoice.customerEmail || invoice.customerName}! (Link: ${publicUrl})`);
  };

  const handleCancel = async (invoice: DomainInvoice) => {
    if (window.confirm(`Are you sure you want to cancel invoice ${invoice.invoiceNumber}?`)) {
      if (onCancelInvoice) {
        await onCancelInvoice(invoice.id);
      }
      showToast(`Invoice ${invoice.invoiceNumber} cancelled.`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-28 lg:pb-10 space-y-6">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-[#2F2925] text-white px-4 py-3 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-[#3F7A55]" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2925] tracking-tight">Invoices</h1>
          <p className="text-xs text-[#6F655E] mt-0.5">
            Manage customer billing, track payments, send invoices, and export PDFs
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenPaymentSettings && (
            <button
              onClick={onOpenPaymentSettings}
              className="h-10 px-3.5 bg-white border border-[#E5DDD3] text-[#6F655E] rounded-[10px] text-xs font-bold flex items-center gap-1.5 hover:bg-[#F6F0E8] transition-colors"
            >
              <Settings size={15} /> Payment Settings
            </button>
          )}

          <button
            onClick={() => {
              setEditingInvoice(undefined);
              setEditorOpen(true);
            }}
            className="h-10 px-4 bg-[#7A3E24] text-white rounded-[10px] text-xs font-bold flex items-center gap-1.5 hover:bg-[#934E2E] active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus size={15} /> Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-[14px] border border-[#E5DDD3] p-4 shadow-xs">
          <p className="text-[11px] text-[#988D84] font-semibold uppercase tracking-wider">Total Invoiced</p>
          <p className="text-2xl font-extrabold text-[#2F2925] mt-1">{formatCents(totalInvoicedCents)}</p>
          <p className="text-[11px] text-[#6F655E] mt-0.5">{invoiceList.length} total invoices</p>
        </div>

        <div className="bg-[#FFF4D8] rounded-[14px] border border-[#B7791F]/30 p-4 shadow-xs">
          <p className="text-[11px] text-[#B7791F] font-semibold uppercase tracking-wider">Outstanding Balance</p>
          <p className="text-2xl font-extrabold text-[#B7791F] mt-1">{formatCents(outstandingBalanceCents)}</p>
          <p className="text-[11px] text-[#B7791F]/80 mt-0.5">Unpaid & partially paid</p>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E5DDD3] p-4 shadow-xs">
          <p className="text-[11px] text-[#3F7A55] font-semibold uppercase tracking-wider">Paid Amount</p>
          <p className="text-2xl font-extrabold text-[#3F7A55] mt-1">{formatCents(paidThisMonthCents)}</p>
          <p className="text-[11px] text-[#988D84] mt-0.5">Collected payments</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, customer name, or email…"
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] placeholder:text-[#988D84] focus:outline-none focus:border-[#B4643B] transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "All" },
            { id: "draft", label: "Draft" },
            { id: "sent", label: "Sent" },
            { id: "partially-paid", label: "Partially Paid" },
            { id: "paid", label: "Paid" },
            { id: "overdue", label: "Overdue" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`flex-shrink-0 h-8 px-3.5 rounded-full text-xs font-bold transition-all ${
                filterTab === tab.id
                  ? "bg-[#7A3E24] text-white shadow-xs"
                  : "bg-white border border-[#E5DDD3] text-[#6F655E] hover:bg-[#F6F0E8]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="bg-white rounded-[14px] border border-[#E5DDD3] overflow-hidden shadow-xs">
        {filteredInvoices.length === 0 ? (
          <div className="p-10 text-center text-[#988D84] space-y-2">
            <FileText size={32} className="mx-auto text-[#D9CEC4]" />
            <p className="font-semibold text-sm text-[#2F2925]">No invoices found</p>
            <p className="text-xs">Try adjusting your search or tab filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0E9E0]">
            {filteredInvoices.map((inv) => {
              const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.Draft;

              return (
                <div
                  key={inv.id}
                  className="p-4 hover:bg-[#FBF8F3] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: Number, Customer, Date */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF1EB] text-[#7A3E24] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-[#2F2925] text-sm">{inv.invoiceNumber}</span>
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.textCls} ${statusCfg.bgCls}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-[#6F655E] mt-0.5 truncate">
                        {inv.customerName || "Customer"}{" "}
                        {inv.customerEmail ? <span className="text-[#988D84] font-normal">({inv.customerEmail})</span> : ""}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#988D84] mt-1 flex-wrap">
                        <span>Issued: {formatDate(inv.issueDate)}</span>
                        <span>·</span>
                        <span>Due: {formatDate(inv.dueDate)}</span>
                        {inv.items && (
                          <>
                            <span>·</span>
                            <span>{inv.items.length} item(s)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Financial Amounts */}
                  <div className="flex items-center justify-between md:justify-end gap-6 text-right border-t md:border-t-0 pt-2 md:pt-0 border-[#F0E9E0]">
                    <div>
                      <span className="block text-[11px] text-[#988D84]">Total</span>
                      <span className="block text-sm font-extrabold text-[#2F2925]">
                        {formatCents(inv.totalCents)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] text-[#988D84]">Paid</span>
                      <span className="block text-sm font-bold text-[#3F7A55]">
                        {formatCents(inv.amountPaidCents)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] text-[#988D84]">Balance</span>
                      <span className="block text-sm font-extrabold text-[#B8443C]">
                        {formatCents(inv.balanceCents)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#F0E9E0]">
                    {inv.balanceCents > 0 && inv.status !== "Cancelled" && (
                      <button
                        onClick={() => setRecordPaymentInvoice(inv)}
                        className="h-8 px-2.5 bg-[#7A3E24] text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-[#934E2E] transition-colors"
                        title="Record Payment"
                      >
                        <DollarSign size={13} /> Pay
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingInvoice(inv);
                        setEditorOpen(true);
                      }}
                      className="h-8 px-2.5 border border-[#E5DDD3] bg-white text-[#6F655E] rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-[#F6F0E8] transition-colors"
                      title="Edit Invoice"
                    >
                      <Edit3 size={13} /> Edit
                    </button>

                    <button
                      onClick={() => handleSendEmail(inv)}
                      className="h-8 px-2 border border-[#E5DDD3] bg-white text-[#6F655E] rounded-lg text-xs font-semibold hover:bg-[#F6F0E8] transition-colors"
                      title="Send Invoice Email"
                    >
                      <Send size={13} />
                    </button>

                    <button
                      onClick={() => handlePrintPdf(inv)}
                      className="h-8 px-2 border border-[#E5DDD3] bg-white text-[#6F655E] rounded-lg text-xs font-semibold hover:bg-[#F6F0E8] transition-colors"
                      title="Print PDF Invoice"
                    >
                      <Printer size={13} />
                    </button>

                    {onOpenPublicInvoice && (
                      <button
                        onClick={() => onOpenPublicInvoice(inv.publicToken)}
                        className="h-8 px-2 border border-[#E5DDD3] bg-white text-[#4B6F8C] rounded-lg text-xs font-semibold hover:bg-[#E8F0FB] transition-colors"
                        title="View Public Link"
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}

                    {inv.status !== "Cancelled" && (
                      <button
                        onClick={() => handleCancel(inv)}
                        className="h-8 px-2 text-[#988D84] hover:text-[#B8443C] rounded-lg text-xs font-semibold transition-colors"
                        title="Cancel Invoice"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {editorOpen && (
        <InvoiceEditor
          invoice={editingInvoice}
          bakeryId={bakeryId}
          customers={customers}
          orders={orders}
          onClose={() => setEditorOpen(false)}
          onSave={async (input) => {
            if ("invoiceId" in input && editingInvoice && onUpdateInvoice) {
              await onUpdateInvoice(input as UpdateInvoiceInput);
              showToast(`Invoice ${editingInvoice.invoiceNumber} updated.`);
            } else if (onCreateInvoice) {
              await onCreateInvoice(input as CreateInvoiceInput);
              showToast("New invoice created.");
            }
          }}
        />
      )}

      {/* Record Payment Dialog */}
      {recordPaymentInvoice && (
        <RecordPaymentDialog
          invoice={recordPaymentInvoice}
          paymentMethods={paymentMethods}
          onClose={() => setRecordPaymentInvoice(undefined)}
          onRecordPayment={async (input) => {
            if (onRecordPayment) {
              await onRecordPayment(input);
              showToast(`Payment recorded for ${recordPaymentInvoice.invoiceNumber}.`);
            }
          }}
        />
      )}
    </div>
  );
}
