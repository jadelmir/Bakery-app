/* global URL, console, fetch, process */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mailpitUrl = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

if (!publishableKey || !serviceRoleKey) {
  throw new Error(
    "Set VITE_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY before running the local invitation verifier.",
  );
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const suffix = randomUUID().slice(0, 8);
const inviterEmail = `inviter-${suffix}@example.com`;
const inviteeEmail = `invitee-${suffix}@example.com`;
const password = "Invitation1";
let inviterId;
let inviteeId;
let bakeryId;
let inviterClient;

function assertNoOpaqueToken(value) {
  assert.equal(typeof value, "object");
  assert.equal(JSON.stringify(value).includes("invitation="), false);
}

async function readInvitationLink() {
  const response = await fetch(`${mailpitUrl}/api/v1/messages?limit=100`);
  if (!response.ok) throw new Error(`Mailpit message listing failed with ${response.status}.`);
  const listing = await response.json();
  const message = (listing.messages ?? []).find(item => JSON.stringify(item).toLowerCase().includes(inviteeEmail));
  if (!message?.ID) throw new Error(`No Mailpit message was found for ${inviteeEmail}.`);

  const detailResponse = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`);
  if (!detailResponse.ok) throw new Error(`Mailpit message fetch failed with ${detailResponse.status}.`);
  const detail = await detailResponse.json();
  const content = JSON.stringify(detail).replaceAll("&amp;", "&");
  const link = content.match(/https?:\/\/[^"<>\s]+/u)?.[0];
  if (!link) throw new Error("The invitation email did not contain a usable Auth link.");
  const authUrl = new URL(decodeURIComponent(link));
  const redirectTo = authUrl.searchParams.get("redirect_to") ?? authUrl.searchParams.get("redirectTo");
  const invitationUrl = new URL(redirectTo ?? authUrl);
  assert.ok(invitationUrl.searchParams.get("invitation"), "Auth email must preserve the opaque invitation token");
  return { authLink: link, token: invitationUrl.searchParams.get("invitation") };
}

async function cleanup() {
  if (bakeryId && inviterClient) await inviterClient.from("bakeries").delete().eq("id", bakeryId);
  for (const id of [inviterId, inviteeId]) {
    if (id) await admin.auth.admin.deleteUser(id);
  }
}

try {
  const inviter = await admin.auth.admin.createUser({ email: inviterEmail, password, email_confirm: true });
  assert.ifError(inviter.error);
  inviterId = inviter.data.user.id;
  const invitee = await admin.auth.admin.createUser({ email: inviteeEmail, password, email_confirm: true });
  assert.ifError(invitee.error);
  inviteeId = invitee.data.user.id;

  inviterClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Origin: "http://127.0.0.1:5173" } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const inviteeClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const inviterSession = await inviterClient.auth.signInWithPassword({ email: inviterEmail, password });
  assert.ifError(inviterSession.error);
  assert.ok(inviterSession.data.session, "Inviter must have an authenticated session");

  const bakery = await inviterClient.rpc("create_default_bakery", { bakery_name: `Invitation Test ${suffix}` });
  assert.ifError(bakery.error);
  bakeryId = bakery.data;

  const sent = await inviterClient.functions.invoke("send-bakery-invite", {
    body: { bakeryId, email: inviteeEmail, role: "staff" },
  });
  if (sent.error) {
    const body = sent.error.context ? await sent.error.context.clone().text() : "";
    throw new Error(`Invitation function failed: ${sent.error.message}${body ? ` (${body})` : ""}`);
  }
  assert.equal(sent.data.status, "pending");
  assertNoOpaqueToken(sent.data);

  const pending = await inviterClient
    .from("bakery_invitations")
    .select("id,status,normalized_email,role")
    .eq("bakery_id", bakeryId)
    .eq("normalized_email", inviteeEmail)
    .single();
  assert.ifError(pending.error);
  assert.equal(pending.data.status, "pending");
  assert.equal(pending.data.normalized_email, inviteeEmail);
  assert.equal(pending.data.role, "staff");
  const { authLink, token } = await readInvitationLink();

  const inviteeSession = await inviteeClient.auth.signInWithPassword({ email: inviteeEmail, password });
  assert.ifError(inviteeSession.error);
  assert.ok(inviteeSession.data.session, "Invitee must have an authenticated session");

  const accepted = await inviteeClient.rpc("accept_bakery_invitation", { invitation_token: token });
  assert.ifError(accepted.error);
  assert.equal(accepted.data.status, "accepted");
  assert.equal(accepted.data.bakery_id, bakeryId);

  const memberships = await inviteeClient
    .from("bakery_memberships")
    .select("user_id,bakery_id,role")
    .eq("bakery_id", bakeryId)
    .eq("user_id", inviteeId);
  assert.ifError(memberships.error);
  assert.deepEqual(memberships.data, [{ user_id: inviteeId, bakery_id: bakeryId, role: "staff" }]);

  const replay = await inviteeClient.rpc("accept_bakery_invitation", { invitation_token: token });
  assert.ifError(replay.error);
  assert.equal(replay.data.status, "invalid");
  console.log(`Verified invitation delivery and acceptance for ${inviteeEmail}; Auth link host: ${new URL(authLink).host}`);
} finally {
  await cleanup();
}
