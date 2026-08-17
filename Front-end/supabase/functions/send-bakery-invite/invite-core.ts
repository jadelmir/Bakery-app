export type BakeryRole = "owner" | "manager" | "staff";

export interface InvitationEmailRequest {
  email: string;
  redirectTo: string;
  actionLink: string;
  bakeryName: string;
  role: BakeryRole;
}

export interface InviteDependencies {
  appUrl: string;
  verifyUser(accessToken: string): Promise<{ id: string } | null>;
  createInvitation(input: {
    inviterUserId: string;
    bakeryId: string;
    email: string;
    role: BakeryRole;
    tokenHash: string;
    expiresAt: string;
  }): Promise<{ id: string }>;
  getBakeryName(bakeryId: string): Promise<string>;
  createAuthLink(input: { email: string; redirectTo: string }): Promise<string>;
  sendEmail(input: InvitationEmailRequest): Promise<void>;
  revokeInvitation(invitationId: string): Promise<void>;
  now?: () => number;
}

export interface InviteRequest {
  method: string;
  origin: string;
  authorization: string;
  body?: unknown;
}

export interface InviteResult {
  status: number;
  body: Record<string, unknown> | null;
  origin?: string;
}

export function resolveAllowedOrigin(origin: string, appUrl: string) {
  const allowed = new Set([
    new URL(appUrl).origin,
    "http://127.0.0.1:5173",
    "http://localhost:5173",
  ]);
  return allowed.has(origin) ? origin : undefined;
}

function resolveRedirectOrigin(requestOrigin: string, appUrl: string) {
  const app = new URL(appUrl);
  if (requestOrigin === "http://localhost:5173" || requestOrigin === "http://127.0.0.1:5173") {
    return requestOrigin;
  }
  const applicationPath = app.pathname === "/" ? "" : app.pathname.replace(/\/+$/, "");
  return `${app.origin}${applicationPath}`;
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function handleInviteRequest(
  request: InviteRequest,
  dependencies: InviteDependencies,
): Promise<InviteResult> {
  const origin = resolveAllowedOrigin(request.origin, dependencies.appUrl);
  if (request.method === "OPTIONS") {
    return origin
      ? { status: 204, body: null, origin }
      : { status: 403, body: { error: "Origin not allowed." } };
  }
  if (request.method !== "POST") return { status: 405, body: { error: "Method not allowed." }, origin };
  if (!origin) return { status: 403, body: { error: "Origin not allowed." } };
  if (!request.authorization.startsWith("Bearer ")) {
    return { status: 401, body: { error: "Authentication required." }, origin };
  }

  const user = await dependencies.verifyUser(request.authorization.slice("Bearer ".length));
  if (!user) return { status: 401, body: { error: "Your session is no longer valid." }, origin };

  const body = request.body as { bakeryId?: unknown; email?: unknown; role?: unknown } | undefined;
  const bakeryId = typeof body?.bakeryId === "string" ? body.bakeryId.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role;
  if (
    !bakeryId
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !["owner", "manager", "staff"].includes(role as string)
  ) {
    return { status: 400, body: { error: "Bakery, email, and a valid role are required." }, origin };
  }

  const token = randomToken();
  const now = dependencies.now?.() ?? Date.now();
  let invitation: { id: string };
  try {
    invitation = await dependencies.createInvitation({
      inviterUserId: user.id,
      bakeryId,
      email,
      role: role as BakeryRole,
      tokenHash: await sha256Hex(token),
      expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (reason) {
    const error = reason as { code?: string; message?: string };
    const duplicate = error.code === "23505";
    return {
      status: duplicate ? 409 : error.code === "P0001" ? 429 : 403,
      body: {
        error: duplicate
          ? "A pending invitation already exists for this email."
          : error.code === "P0001"
            ? "Invitation rate limit reached."
            : "You do not have permission to send this invitation.",
      },
      origin,
    };
  }

  const redirectOrigin = resolveRedirectOrigin(request.origin, dependencies.appUrl);
  const redirectTo = `${redirectOrigin}/?invitation=${encodeURIComponent(token)}`;
  try {
    const [bakeryName, actionLink] = await Promise.all([
      dependencies.getBakeryName(bakeryId),
      dependencies.createAuthLink({ email, redirectTo }),
    ]);
    await dependencies.sendEmail({
      email,
      redirectTo,
      actionLink,
      bakeryName,
      role: role as BakeryRole,
    });
  } catch {
    await dependencies.revokeInvitation(invitation.id);
    return {
      status: 502,
      body: { error: "The invitation email could not be sent. Please try again." },
      origin,
    };
  }

  return {
    status: 201,
    body: { invitationId: invitation.id, status: "pending" },
    origin,
  };
}
