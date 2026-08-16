import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (request: Request) => Promise<Response>): void;
};

function jsonResponse(
  body: Record<string, unknown> | null,
  status: number,
  origin?: string,
) {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": origin ?? "*",
      "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
      "access-control-allow-methods": "POST, OPTIONS",
      "vary": "Origin",
    },
  });
}

export interface SendInvoiceEmailRequest {
  invoiceId?: string;
  publicToken?: string;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  customNote?: string;
  bakeryName?: string;
  invoiceNumber?: string;
  totalCents?: number;
  dueDate?: string;
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? "*";

  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    return jsonResponse(null, 204, origin);
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const appUrl = Deno.env.get("APP_URL") ?? "http://127.0.0.1:5173";

  let body: SendInvoiceEmailRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body" }, 400, origin);
  }

  const {
    invoiceId,
    publicToken: tokenInput,
    recipientEmail,
    recipientName,
    subject: customSubject,
    customNote,
    bakeryName: inputBakeryName,
    invoiceNumber: inputInvoiceNumber,
    totalCents: inputTotalCents,
    dueDate: inputDueDate,
  } = body;

  if (!recipientEmail || (!invoiceId && !tokenInput)) {
    return jsonResponse(
      { error: "recipientEmail and either invoiceId or publicToken are required." },
      400,
      origin,
    );
  }

  let publicToken = tokenInput;
  let bakeryName = inputBakeryName || "Bakery";
  let invoiceNumber = inputInvoiceNumber || "Invoice";
  let totalCents = inputTotalCents ?? 0;
  let dueDate = inputDueDate;

  // Fetch invoice details if service role client and invoiceId or publicToken is present
  if (supabaseUrl && serviceRoleKey && (invoiceId || tokenInput)) {
    try {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      let query = adminClient.from("invoices").select("*");
      if (invoiceId) {
        query = query.eq("id", invoiceId);
      } else if (tokenInput) {
        query = query.eq("public_token", tokenInput);
      }

      const { data: invoice, error } = await query.single();
      if (!error && invoice) {
        publicToken = invoice.public_token;
        invoiceNumber = invoice.invoice_number || invoiceNumber;
        totalCents = invoice.total_cents ?? totalCents;
        dueDate = invoice.due_date || dueDate;

        if (invoice.bakery_snapshot_json && invoice.bakery_snapshot_json.name) {
          bakeryName = invoice.bakery_snapshot_json.name;
        }

        // Log sent event
        await adminClient.from("invoice_events").insert({
          invoice_id: invoice.id,
          event_type: "sent",
          description: `Invoice email sent to ${recipientEmail}`,
        });

        // Update status to sent if draft
        if (invoice.status === "draft") {
          await adminClient
            .from("invoices")
            .update({ status: "sent", updated_at: new Date().toISOString() })
            .eq("id", invoice.id);
        }
      }
    } catch (e) {
      console.warn("Could not fetch invoice or record event from Supabase:", e);
    }
  }

  const invoiceUrl = `${appUrl.replace(/\/$/, "")}/invoice/${publicToken}`;
  const formattedTotal = (totalCents / 100).toFixed(2);
  const subject = customSubject || `${bakeryName}: Invoice ${invoiceNumber}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.5; padding: 20px; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
          .header { background: #111827; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
          .content { padding: 32px 24px; }
          .amount-card { background: #f3f4f6; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: center; }
          .amount { font-size: 32px; font-weight: 700; color: #111827; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; margin-top: 16px; }
          .footer { font-size: 12px; color: #6b7280; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${bakeryName}</h1>
          </div>
          <div class="content">
            <p>Hello ${recipientName || "Customer"},</p>
            <p>You have received an invoice (<strong>${invoiceNumber}</strong>) from ${bakeryName}.</p>
            ${customNote ? `<blockquote style="border-left: 4px solid #3b82f6; padding-left: 12px; margin: 16px 0; color: #4b5563; font-style: italic;">"${customNote}"</blockquote>` : ""}
            <div class="amount-card">
              <div style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Total Amount Due</div>
              <div class="amount">$${formattedTotal}</div>
              ${dueDate ? `<div style="font-size: 13px; color: #6b7280; margin-top: 4px;">Due Date: ${new Date(dueDate).toLocaleDateString()}</div>` : ""}
            </div>
            <div style="text-align: center;">
              <a href="${invoiceUrl}" class="btn" target="_blank">View & Pay Invoice</a>
            </div>
          </div>
          <div class="footer">
            <p>If you have any questions, please reach out to ${bakeryName}.</p>
            <p><a href="${invoiceUrl}" style="color: #6b7280;">${invoiceUrl}</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!resendApiKey) {
    console.log(`[SIMULATED EMAIL] To: ${recipientEmail}, Subject: ${subject}, Link: ${invoiceUrl}`);
    return jsonResponse(
      {
        success: true,
        simulated: true,
        message: "Resend API key not configured. Email simulated.",
        publicUrl: invoiceUrl,
      },
      200,
      origin,
    );
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${bakeryName} Invoices <invoices@resend.dev>`,
        to: [recipientEmail],
        subject,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      return jsonResponse(
        { error: resendData.message || "Failed to send email via Resend" },
        resendResponse.status,
        origin,
      );
    }

    return jsonResponse(
      {
        success: true,
        messageId: resendData.id,
        publicUrl: invoiceUrl,
      },
      200,
      origin,
    );
  } catch (err) {
    console.error("Failed to fetch Resend API:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500,
      origin,
    );
  }
});
