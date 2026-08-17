export type InvitationRole = "owner" | "manager" | "staff";

export interface InvitationEmailInput {
  recipientEmail: string;
  bakeryName: string;
  role: InvitationRole;
  actionLink: string;
  expiresInDays?: number;
}

export interface InvitationMailTransport {
  apiKey?: string;
  from?: string;
  mailpitUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface InvitationEmailContent {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export function buildInvitationEmail({
  recipientEmail,
  bakeryName,
  role,
  actionLink,
  expiresInDays = 7,
}: InvitationEmailInput): InvitationEmailContent {
  const safeBakeryName = escapeHtml(bakeryName);
  const safeRole = escapeHtml(role);
  const safeRecipientEmail = escapeHtml(recipientEmail);
  const safeActionLink = escapeHtml(actionLink);
  const subject = `You're invited to join ${bakeryName}`;

  return {
    subject,
    text: [
      `You're invited to join ${bakeryName}.`,
      `Your role: ${role}.`,
      `Accept the invitation and finish signing in: ${actionLink}`,
      `This invitation expires in ${expiresInDays} days.`,
      `If you were not expecting this invitation, you can ignore this email.`,
    ].join("\n\n"),
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#fffaf3;color:#3b271f;font-family:Arial,sans-serif;line-height:1.5">
    <main style="max-width:560px;margin:0 auto;padding:40px 24px">
      <p style="margin:0 0 12px;color:#8b5e3c;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Bakery workspace invitation</p>
      <h1 style="margin:0 0 16px;font-size:30px;line-height:1.15">You're invited to join ${safeBakeryName}</h1>
      <p style="margin:0 0 8px">This invitation is for <strong>${safeRecipientEmail}</strong>.</p>
      <p style="margin:0 0 24px">Your role: <strong>${safeRole}</strong>.</p>
      <p style="margin:0 0 28px">
        <a href="${safeActionLink}" style="display:inline-block;background:#8b5e3c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Accept invitation and finish signing in</a>
      </p>
      <p style="margin:0 0 8px;font-size:14px">This invitation expires in ${expiresInDays} days.</p>
      <p style="margin:0;font-size:14px;color:#6d5549">If you were not expecting this invitation, you can ignore this email.</p>
    </main>
  </body>
</html>`,
  };
}

export async function sendInvitationEmail(
  input: InvitationEmailInput,
  { apiKey, from, mailpitUrl, fetchImpl = fetch }: InvitationMailTransport,
): Promise<{ messageId?: string }> {
  const content = buildInvitationEmail(input);

  if (mailpitUrl) {
    const response = await fetchImpl(`${mailpitUrl.replace(/\/+$/, "")}/api/v1/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: { Email: from ?? "no-reply@example.test", Name: "Bakery App" },
        To: [{ Email: input.recipientEmail }],
        Subject: content.subject,
        Text: content.text,
        HTML: content.html,
      }),
    });

    if (!response.ok) {
      throw new Error("Invitation email provider rejected the message.");
    }

    const body = await response.json().catch(() => ({})) as { ID?: unknown; id?: unknown };
    const messageId = typeof body.ID === "string" ? body.ID : body.id;
    return { messageId: typeof messageId === "string" ? messageId : undefined };
  }

  if (!apiKey || !from) {
    throw new Error("Invitation email provider is not configured.");
  }

  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.recipientEmail],
      subject: content.subject,
      text: content.text,
      html: content.html,
    }),
  });

  if (!response.ok) {
    throw new Error("Invitation email provider rejected the message.");
  }

  const body = await response.json().catch(() => ({})) as { id?: unknown };
  return { messageId: typeof body.id === "string" ? body.id : undefined };
}
