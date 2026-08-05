import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import pg from "pg";

const { Client } = pg;
const connectionString =
  process.env.SUPABASE_TEST_DB_URL
  ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const ids = {
  userA: "91000000-0000-0000-0000-000000000001",
  userB: "91000000-0000-0000-0000-000000000002",
};
const clients = [];
const token = "concurrent-invitation-token";
const tokenHash = createHash("sha256").update(token).digest("hex");

async function connect() {
  const client = new Client({ connectionString });
  await client.connect();
  clients.push(client);
  return client;
}

async function beginAs(client, userId, email) {
  await client.query("begin");
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: userId, email, role: "authenticated" }),
  ]);
}

async function cleanup(admin) {
  await admin.query("set session_replication_role = replica");
  await admin.query(
    "delete from public.bakery_invitations where invited_by = any($1::uuid[])",
    [[ids.userA, ids.userB]],
  );
  await admin.query(
    "delete from public.bakery_memberships where user_id = any($1::uuid[])",
    [[ids.userA, ids.userB]],
  );
  await admin.query(
    "delete from public.bakeries where created_by = any($1::uuid[])",
    [[ids.userA, ids.userB]],
  );
  await admin.query("delete from public.profiles where id = any($1::uuid[])", [
    [ids.userA, ids.userB],
  ]);
  await admin.query("delete from auth.users where id = any($1::uuid[])", [
    [ids.userA, ids.userB],
  ]);
  await admin.query("set session_replication_role = origin");
}

const admin = await connect();
try {
  await cleanup(admin);
  await admin.query(
    `insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data
    ) values
      ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'concurrent-owner@example.com', crypt('password1', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
      ($2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'concurrent-invitee@example.com', crypt('password1', gen_salt('bf')), now(), now(), now(), '{}', '{}')`,
    [ids.userA, ids.userB],
  );

  const onboardingA = await connect();
  const onboardingB = await connect();
  await beginAs(onboardingA, ids.userA, "concurrent-owner@example.com");
  const firstOnboarding = await onboardingA.query(
    "select public.create_default_bakery('Concurrency Bakery') as bakery_id",
  );
  await beginAs(onboardingB, ids.userA, "concurrent-owner@example.com");
  const secondOnboardingPromise = onboardingB.query(
    "select public.create_default_bakery('Duplicate Retry') as bakery_id",
  );
  await delay(100);
  await onboardingA.query("commit");
  const secondOnboarding = await secondOnboardingPromise;
  await onboardingB.query("commit");
  const bakeryId = firstOnboarding.rows[0].bakery_id;
  assert.equal(secondOnboarding.rows[0].bakery_id, bakeryId);
  assert.equal(
    Number((await admin.query(
      "select count(*) from public.bakery_memberships where user_id = $1",
      [ids.userA],
    )).rows[0].count),
    1,
  );

  const inviteA = await connect();
  const inviteB = await connect();
  await inviteA.query("begin");
  const firstInvite = await inviteA.query(
    `select (public.create_bakery_invitation(
      $1, $2, 'concurrent-invitee@example.com', 'staff', $3, now() + interval '7 days'
    )).id as invitation_id`,
    [ids.userA, bakeryId, tokenHash],
  );
  await inviteB.query("begin");
  const duplicateInvitePromise = inviteB
    .query(
      `select public.create_bakery_invitation(
        $1, $2, 'concurrent-invitee@example.com', 'staff', $3, now() + interval '7 days'
      )`,
      [ids.userA, bakeryId, createHash("sha256").update(`${token}-duplicate`).digest("hex")],
    )
    .then(() => null, error => error);
  await delay(100);
  await inviteA.query("commit");
  const duplicateInviteError = await duplicateInvitePromise;
  await inviteB.query("rollback");
  assert.equal(duplicateInviteError?.code, "23505");

  const acceptA = await connect();
  const acceptB = await connect();
  await beginAs(acceptA, ids.userB, "concurrent-invitee@example.com");
  const firstAcceptance = await acceptA.query(
    "select public.accept_bakery_invitation($1) as result",
    [token],
  );
  await beginAs(acceptB, ids.userB, "concurrent-invitee@example.com");
  const secondAcceptancePromise = acceptB.query(
    "select public.accept_bakery_invitation($1) as result",
    [token],
  );
  await delay(100);
  await acceptA.query("commit");
  const secondAcceptance = await secondAcceptancePromise;
  await acceptB.query("commit");
  assert.equal(firstAcceptance.rows[0].result.status, "accepted");
  assert.equal(secondAcceptance.rows[0].result.status, "invalid");
  assert.equal(
    Number((await admin.query(
      "select count(*) from public.bakery_memberships where bakery_id = $1 and user_id = $2",
      [bakeryId, ids.userB],
    )).rows[0].count),
    1,
  );

  await admin.query(
    "update public.bakery_memberships set role = 'owner' where bakery_id = $1 and user_id = $2",
    [bakeryId, ids.userB],
  );
  const membershipRows = await admin.query(
    "select id, user_id from public.bakery_memberships where bakery_id = $1",
    [bakeryId],
  );
  const membershipA = membershipRows.rows.find(row => row.user_id === ids.userA).id;
  const membershipB = membershipRows.rows.find(row => row.user_id === ids.userB).id;
  const removalA = await connect();
  const removalB = await connect();
  await beginAs(removalA, ids.userA, "concurrent-owner@example.com");
  await removalA.query("select public.remove_bakery_member($1)", [membershipB]);
  await beginAs(removalB, ids.userB, "concurrent-invitee@example.com");
  const competingRemovalPromise = removalB
    .query("select public.remove_bakery_member($1)", [membershipA])
    .then(() => null, error => error);
  await delay(100);
  await removalA.query("commit");
  const competingRemovalError = await competingRemovalPromise;
  await removalB.query("rollback");
  assert.equal(competingRemovalError?.code, "42501");
  assert.equal(
    Number((await admin.query(
      "select count(*) from public.bakery_memberships where bakery_id = $1 and role = 'owner'",
      [bakeryId],
    )).rows[0].count),
    1,
  );
  assert.ok(firstInvite.rows[0].invitation_id);

  process.stdout.write("Workspace concurrency verification passed.\n");
} finally {
  await cleanup(admin).catch(() => undefined);
  await Promise.all(clients.map(client => client.end().catch(() => undefined)));
}
