import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { handleInviteRequest } from "./invite-core.ts";

function response(
  body: Record<string, unknown> | null,
  status: number,
  origin?: string,
) {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": origin ?? "null",
      "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
      "access-control-allow-methods": "POST, OPTIONS",
      "vary": "Origin",
    },
  });
}

Deno.serve(async request => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const appUrl = Deno.env.get("APP_URL") ?? "http://127.0.0.1:5173";
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return response({ error: "Invitation service is not configured." }, 500);
  }

  const authorization = request.headers.get("authorization") ?? "";
  let body: unknown;
  if (request.method === "POST") {
    try {
      body = await request.json();
    } catch {
      return response({ error: "A JSON request body is required." }, 400, request.headers.get("origin") ?? undefined);
    }
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const result = await handleInviteRequest(
    {
      method: request.method,
      origin: request.headers.get("origin") ?? "",
      authorization,
      body,
    },
    {
      appUrl,
      async verifyUser(accessToken) {
        const { data, error } = await userClient.auth.getUser(accessToken);
        return error || !data.user ? null : { id: data.user.id };
      },
      async createInvitation(input) {
        const { data, error } = await adminClient.rpc("create_bakery_invitation", {
          inviter_user_id: input.inviterUserId,
          target_bakery_id: input.bakeryId,
          invite_email: input.email,
          invite_role: input.role,
          invite_token_hash: input.tokenHash,
          invitation_expires_at: input.expiresAt,
        });
        if (error) throw error;
        return { id: data.id };
      },
      async sendEmail(email, redirectTo) {
        const { error } = await userClient.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
        });
        if (error) throw error;
      },
      async revokeInvitation(invitationId) {
        await adminClient
          .from("bakery_invitations")
          .update({ status: "revoked", revoked_at: new Date().toISOString() })
          .eq("id", invitationId);
      },
    },
  );

  return response(result.body, result.status, result.origin);
});
