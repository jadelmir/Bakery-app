import assert from "node:assert/strict";
import pg from "pg";
import process from "node:process";

const { Client } = pg;
const fallbackOtherBakeryId = "b2222222-2222-2222-2222-222222222222";

const client = new Client({
  host: "127.0.0.1",
  port: 54322,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});

const flow = {
  id: "local-round-trip-flow",
  name: "Local round trip",
  recipe: "Sourdough",
  isDefault: false,
  steps: [
    {
      id: "mix",
      name: "Mix",
      instructions: "Combine ingredients.",
      dayOffset: 0,
      time: "08:00",
      duration: 20,
      category: "prep",
      enabled: true,
      groupable: false,
    },
    {
      id: "proof",
      name: "Proof",
      instructions: "Rest until doubled.",
      dayOffset: 0,
      time: "08:30",
      duration: 90,
      category: "fermentation",
      enabled: true,
      groupable: true,
      dependsOn: "mix",
    },
  ],
};

try {
  await client.connect();
  const membership = await client.query(
    `select bakery_id, user_id
     from public.bakery_memberships
     order by created_at
     limit 1`,
  );
  assert.equal(membership.rowCount, 1, "The local database must contain an authenticated bakery member");
  const bakeryId = membership.rows[0].bakery_id;
  const userId = membership.rows[0].user_id;
  const otherBakery = await client.query(
    "select id from public.bakeries where id <> $1 order by created_at limit 1",
    [bakeryId],
  );
  const otherBakeryId = otherBakery.rows[0]?.id ?? fallbackOtherBakeryId;
  await client.query("begin");
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
  const identity = await client.query("select auth.uid() as uid, private.is_bakery_member($1) as member", [bakeryId]);
  assert.equal(identity.rows[0].uid, userId, "The local JWT subject must resolve through auth.uid()");
  assert.equal(identity.rows[0].member, true, "The seeded user must be a member of the seeded bakery");

  const isolatedRows = await client.query(
    "select id from public.production_flows where bakery_id = $1",
    [otherBakeryId],
  );
  assert.equal(isolatedRows.rowCount, 0, "A member must not see another bakery's flows");

  const saved = await client.query(
    "select public.save_production_flow($1, $2::jsonb) as flow",
    [bakeryId, JSON.stringify(flow)],
  );
  assert.equal(saved.rows[0].flow.id, flow.id);
  assert.equal(saved.rows[0].flow.steps.length, 2);
  assert.equal(saved.rows[0].flow.steps[1].dependsOn, "mix");

  const firstCount = await client.query(
    "select count(*)::integer as count from public.production_flow_steps where bakery_id = $1 and flow_id = $2",
    [bakeryId, flow.id],
  );
  assert.equal(firstCount.rows[0].count, 2, "The first save must persist every step");

  const invalidDependency = { ...flow, steps: [{ ...flow.steps[0], dependsOn: "missing-step" }] };
  await client.query("savepoint invalid_dependency");
  await assert.rejects(
    () => client.query("select public.save_production_flow($1, $2::jsonb)", [bakeryId, JSON.stringify(invalidDependency)]),
    /production_flow_steps_dependency|foreign key/i,
  );
  await client.query("rollback to savepoint invalid_dependency");

  const replacement = { ...flow, steps: [flow.steps[0]] };
  const replaced = await client.query(
    "select public.save_production_flow($1, $2::jsonb) as flow",
    [bakeryId, JSON.stringify(replacement)],
  );
  assert.equal(replaced.rows[0].flow.steps.length, 1);

  const replacementCount = await client.query(
    "select count(*)::integer as count from public.production_flow_steps where bakery_id = $1 and flow_id = $2",
    [bakeryId, flow.id],
  );
  assert.equal(replacementCount.rows[0].count, 1, "A replacement save must remove stale steps atomically");

  await client.query("savepoint cross_bakery");
  await assert.rejects(
    () => client.query("select public.save_production_flow($1, $2::jsonb)", [otherBakeryId, JSON.stringify(flow)]),
    /not a member|42501/i,
  );
  await client.query("rollback to savepoint cross_bakery");

  await client.query("savepoint anonymous_access");
  await client.query("set local role anon");
  await assert.rejects(
    () => client.query("select id from public.production_flows"),
    /permission denied/i,
  );
  await client.query("rollback to savepoint anonymous_access");
  const deleted = await client.query(
    "select public.delete_production_flow($1, $2) as deleted",
    [bakeryId, flow.id],
  );
  assert.equal(deleted.rows[0].deleted, true);

  await client.query("rollback");
  process.stdout.write("Local production-flow schema/RLS/RPC verification passed.\n");
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  throw error;
} finally {
  await client.end().catch(() => undefined);
}
