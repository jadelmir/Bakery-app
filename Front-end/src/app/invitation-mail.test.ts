import { describe, expect, it, vi } from "vitest";
import { buildInvitationEmail, sendInvitationEmail } from "../../supabase/functions/send-bakery-invite/invitation-mail";

describe("invitation email delivery", () => {
  it("renders bakery context and escapes untrusted display values", () => {
    const content = buildInvitationEmail({
      recipientEmail: "invitee@example.com",
      bakeryName: "Baker & Sons <staging>",
      role: "staff",
      actionLink: "https://example.test/?invitation=secret-token",
    });

    expect(content.subject).toBe("You're invited to join Baker & Sons <staging>");
    expect(content.text).toContain("Your role: staff.");
    expect(content.html).toContain("Baker &amp; Sons &lt;staging&gt;");
    expect(content.html).toContain("https://example.test/?invitation=secret-token");
  });

  it("sends the dedicated message through the configured provider", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "email-1" }), { status: 200 }));

    await expect(sendInvitationEmail(
      {
        recipientEmail: "invitee@example.com",
        bakeryName: "J'adore",
        role: "staff",
        actionLink: "https://example.test/accept",
      },
      { apiKey: "secret", from: "Bakery App <invites@example.test>", fetchImpl },
    )).resolves.toEqual({ messageId: "email-1" });

    expect(fetchImpl).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer secret" }),
    }));
    expect(JSON.stringify(fetchImpl.mock.calls[0][1])).not.toContain("secret-token");
  });

  it("fails closed when provider configuration or delivery is unavailable", async () => {
    await expect(sendInvitationEmail(
      {
        recipientEmail: "invitee@example.com",
        bakeryName: "J'adore",
        role: "staff",
        actionLink: "https://example.test/accept",
      },
      { from: "Bakery App <invites@example.test>" },
    )).rejects.toThrow("provider is not configured");

    const fetchImpl = vi.fn(async () => new Response("rejected", { status: 403 }));
    await expect(sendInvitationEmail(
      {
        recipientEmail: "invitee@example.com",
        bakeryName: "J'adore",
        role: "staff",
        actionLink: "https://example.test/accept",
      },
      { apiKey: "secret", from: "Bakery App <invites@example.test>", fetchImpl },
    )).rejects.toThrow("provider rejected");
  });

  it("sends through local Mailpit without requiring a hosted provider secret", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ID: "mailpit-1" }), { status: 200 }));

    await expect(sendInvitationEmail(
      {
        recipientEmail: "invitee@example.com",
        bakeryName: "J'adore",
        role: "staff",
        actionLink: "http://127.0.0.1:54321/auth/confirm?token=secret-token",
      },
      { mailpitUrl: "http://127.0.0.1:54324/", fetchImpl },
    )).resolves.toEqual({ messageId: "mailpit-1" });

    expect(fetchImpl).toHaveBeenCalledWith("http://127.0.0.1:54324/api/v1/send", expect.objectContaining({
      method: "POST",
    }));
    expect(JSON.stringify(fetchImpl.mock.calls[0][1])).toContain("Bakery workspace invitation");
  });
});
