import { describe, expect, it, vi } from "vitest";
import {
  handleInviteRequest,
  randomToken,
  sha256Hex,
  type InviteDependencies,
} from "../../supabase/functions/send-bakery-invite/invite-core";

function dependencies(overrides: Partial<InviteDependencies> = {}): InviteDependencies {
  return {
    appUrl: "http://127.0.0.1:5173",
    verifyUser: async () => ({ id: "user-1" }),
    createInvitation: async () => ({ id: "invite-1" }),
    sendEmail: async () => undefined,
    revokeInvitation: async () => undefined,
    now: () => Date.UTC(2026, 6, 29),
    ...overrides,
  };
}

const validRequest = {
  method: "POST",
  origin: "http://127.0.0.1:5173",
  authorization: "Bearer valid-token",
  body: { bakeryId: "bakery-1", email: " Person@Example.com ", role: "staff" },
};

describe("invitation Edge Function core", () => {
  it("generates high-entropy opaque tokens and stable hashes", async () => {
    const first = randomToken();
    const second = randomToken();
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
    expect(await sha256Hex("token")).toHaveLength(64);
  });

  it("rejects missing authentication and unapproved origins", async () => {
    expect((await handleInviteRequest({ ...validRequest, authorization: "" }, dependencies())).status).toBe(401);
    expect((await handleInviteRequest({ ...validRequest, origin: "https://evil.example" }, dependencies())).status).toBe(403);
  });

  it("normalizes email and never returns the opaque token", async () => {
    const createInvitation = vi.fn(async () => ({ id: "invite-1" }));
    const sendEmail = vi.fn(async () => undefined);
    const result = await handleInviteRequest(validRequest, dependencies({ createInvitation, sendEmail }));
    expect(result).toMatchObject({ status: 201, body: { invitationId: "invite-1", status: "pending" } });
    expect(JSON.stringify(result.body)).not.toContain("invitation=");
    expect(createInvitation.mock.calls[0][0].email).toBe("person@example.com");
    expect(sendEmail.mock.calls[0][1]).toContain("?invitation=");
  });

  it("keeps the local invitation callback on the browser's active localhost origin", async () => {
    const sendEmail = vi.fn(async () => undefined);
    await handleInviteRequest(
      { ...validRequest, origin: "http://localhost:5173" },
      dependencies({ sendEmail }),
    );
    expect(sendEmail.mock.calls[0][1]).toMatch(/^http:\/\/localhost:5173\/\?invitation=/);
  });

  it("preserves the hosted application base path while validating only its origin", async () => {
    const sendEmail = vi.fn(async () => undefined);
    await handleInviteRequest(
      { ...validRequest, origin: "https://jadelmir.github.io" },
      dependencies({ appUrl: "https://jadelmir.github.io/Bakery-app/", sendEmail }),
    );

    expect(sendEmail.mock.calls[0][1]).toMatch(/^https:\/\/jadelmir\.github\.io\/Bakery-app\/\?invitation=/);
  });

  it.each([
    ["23505", 409, "already exists"],
    ["P0001", 429, "rate limit"],
    ["42501", 403, "permission"],
  ])("maps database authorization outcome %s without leaking details", async (code, status, message) => {
    const result = await handleInviteRequest(
      validRequest,
      dependencies({
        createInvitation: async () => { throw { code, message: "sensitive database detail" }; },
      }),
    );
    expect(result.status).toBe(status);
    expect(result.body?.error).toContain(message);
    expect(JSON.stringify(result.body)).not.toContain("sensitive");
  });

  it("revokes the pending record when email delivery fails", async () => {
    const revokeInvitation = vi.fn(async () => undefined);
    const result = await handleInviteRequest(
      validRequest,
      dependencies({
        sendEmail: async () => { throw new Error("mail unavailable"); },
        revokeInvitation,
      }),
    );
    expect(result.status).toBe(502);
    expect(revokeInvitation).toHaveBeenCalledWith("invite-1");
  });
});
