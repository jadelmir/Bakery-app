export interface InvoicePdfLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
}

export interface InvoicePdfBakery {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

export interface InvoicePdfCustomer {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface InvoicePdfPaymentMethod {
  methodType: string;
  instructions?: string;
  accountDetails?: Record<string, unknown>;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  createdAt: string;
  dueDate?: string | null;
  status: string;
  bakery: InvoicePdfBakery;
  customer: InvoicePdfCustomer;
  items: InvoicePdfLineItem[];
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceCents: number;
  paymentInstructions?: string | null;
  paymentMethods?: InvoicePdfPaymentMethod[];
  notes?: string | null;
}

export function formatCents(cents: number): string {
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function generateInvoiceHtml(data: InvoicePdfData): string {
  const statusFormatted = data.status.replace("_", " ").toUpperCase();
  let statusBadgeBg = "#6b7280";
  const statusBadgeColor = "#ffffff";

  switch (data.status.toLowerCase()) {
    case "paid":
      statusBadgeBg = "#10b981";
      break;
    case "partially_paid":
      statusBadgeBg = "#f59e0b";
      break;
    case "sent":
    case "viewed":
      statusBadgeBg = "#3b82f6";
      break;
    case "overdue":
      statusBadgeBg = "#ef4444";
      break;
    case "cancelled":
      statusBadgeBg = "#9ca3af";
      break;
    default:
      statusBadgeBg = "#6b7280";
  }

  const itemsRows = data.items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${idx + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: #111827;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${formatCents(item.unitPriceCents)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">${formatCents(item.totalPriceCents)}</td>
      </tr>
    `,
    )
    .join("");

  const paymentMethodsHtml =
    data.paymentMethods && data.paymentMethods.length > 0
      ? data.paymentMethods
          .map(
            pm => `
        <div style="margin-bottom: 10px; padding: 10px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #f3f4f6;">
          <strong style="text-transform: capitalize; color: #1f2937;">${pm.methodType}:</strong>
          ${pm.instructions ? `<div style="margin-top: 4px; color: #4b5563; font-size: 13px;">${pm.instructions}</div>` : ""}
          ${
            pm.accountDetails && Object.keys(pm.accountDetails).length > 0
              ? `<div style="margin-top: 4px; color: #6b7280; font-size: 12px; font-family: monospace;">${JSON.stringify(pm.accountDetails)}</div>`
              : ""
          }
        </div>
      `,
          )
          .join("")
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 32px;
      font-size: 14px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #f3f4f6;
    }
    .bakery-info h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }
    .bakery-info p {
      margin: 2px 0;
      color: #4b5563;
      font-size: 13px;
    }
    .invoice-badge-block {
      text-align: right;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: 800;
      color: #1f2937;
      letter-spacing: 0.05em;
      margin: 0 0 8px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      background-color: ${statusBadgeBg};
      color: ${statusBadgeColor};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 32px;
      gap: 24px;
    }
    .meta-box {
      flex: 1;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
    }
    .meta-box h3 {
      margin: 0 0 8px 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
    }
    .meta-box p {
      margin: 2px 0;
      color: #1f2937;
      font-size: 13px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    .items-table th {
      background: #f9fafb;
      padding: 12px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4b5563;
      border-bottom: 2px solid #e5e7eb;
    }
    .summary-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 32px;
      gap: 32px;
    }
    .payment-instructions-box {
      flex: 1;
    }
    .payment-instructions-box h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 700;
      color: #111827;
    }
    .totals-table {
      width: 280px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 8px 0;
      font-size: 14px;
    }
    .totals-table tr.total-row td {
      font-size: 16px;
      font-weight: 700;
      border-top: 2px solid #111827;
      padding-top: 12px;
    }
    .totals-table tr.balance-row td {
      font-size: 16px;
      font-weight: 700;
      color: #dc2626;
      padding-top: 8px;
    }
    .notes-block {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 32px;
      font-size: 13px;
      color: #6b7280;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header-row">
      <div class="bakery-info">
        <h1>${data.bakery.name}</h1>
        ${data.bakery.address ? `<p>${data.bakery.address}</p>` : ""}
        ${data.bakery.email ? `<p>Email: ${data.bakery.email}</p>` : ""}
        ${data.bakery.phone ? `<p>Phone: ${data.bakery.phone}</p>` : ""}
      </div>
      <div class="invoice-badge-block">
        <div class="invoice-title">INVOICE</div>
        <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #374151;">${data.invoiceNumber}</p>
        <span class="badge">${statusFormatted}</span>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h3>Billed To</h3>
        <p style="font-weight: 600; font-size: 15px;">${data.customer.name}</p>
        ${data.customer.email ? `<p>${data.customer.email}</p>` : ""}
        ${data.customer.phone ? `<p>${data.customer.phone}</p>` : ""}
        ${data.customer.address ? `<p>${data.customer.address}</p>` : ""}
      </div>
      <div class="meta-box">
        <h3>Invoice Details</h3>
        <p><strong>Issued:</strong> ${formatDate(data.createdAt)}</p>
        <p><strong>Due Date:</strong> ${formatDate(data.dueDate)}</p>
        <p><strong>Status:</strong> ${statusFormatted}</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: center; width: 40px;">#</th>
          <th style="text-align: left;">Item Description</th>
          <th style="text-align: right; width: 70px;">Qty</th>
          <th style="text-align: right; width: 110px;">Unit Price</th>
          <th style="text-align: right; width: 110px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="summary-section">
      <div class="payment-instructions-box">
        ${
          paymentMethodsHtml || data.paymentInstructions
            ? `
          <h3>Payment Instructions</h3>
          ${data.paymentInstructions ? `<p style="margin-bottom: 12px; color: #374151; font-size: 13px;">${data.paymentInstructions}</p>` : ""}
          ${paymentMethodsHtml}
        `
            : ""
        }
      </div>

      <table class="totals-table">
        <tr>
          <td style="color: #6b7280;">Subtotal</td>
          <td style="text-align: right; font-weight: 500;">${formatCents(data.subtotalCents)}</td>
        </tr>
        ${
          data.taxCents > 0
            ? `
        <tr>
          <td style="color: #6b7280;">Tax</td>
          <td style="text-align: right; font-weight: 500;">${formatCents(data.taxCents)}</td>
        </tr>
        `
            : ""
        }
        ${
          data.discountCents > 0
            ? `
        <tr>
          <td style="color: #6b7280;">Discount</td>
          <td style="text-align: right; font-weight: 500; color: #059669;">-${formatCents(data.discountCents)}</td>
        </tr>
        `
            : ""
        }
        <tr class="total-row">
          <td>Total</td>
          <td style="text-align: right;">${formatCents(data.totalCents)}</td>
        </tr>
        <tr>
          <td style="color: #6b7280;">Amount Paid</td>
          <td style="text-align: right; font-weight: 500; color: #059669;">${formatCents(data.amountPaidCents)}</td>
        </tr>
        <tr class="balance-row">
          <td>Balance Due</td>
          <td style="text-align: right;">${formatCents(data.balanceCents)}</td>
        </tr>
      </table>
    </div>

    ${
      data.notes
        ? `
      <div class="notes-block">
        <strong style="color: #374151;">Notes & Terms:</strong>
        <p style="margin: 4px 0 0 0;">${data.notes}</p>
      </div>
    `
        : ""
    }
  </div>
</body>
</html>
  `.trim();
}

export function printInvoicePdf(data: InvoicePdfData): void {
  const htmlContent = generateInvoiceHtml(data);
  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (!printWindow) {
    console.error("Failed to open print window for invoice PDF generation.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
