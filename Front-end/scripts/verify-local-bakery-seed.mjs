import assert from "node:assert/strict";
import pg from "pg";
import process from "node:process";

const { Client } = pg;
const seededAdminEmail = "admin@jadorebakery.com";
const expectedBakeryName = "J'adore Bakery";
const runtimeCheckBakeryName = "Runtime Check Bakery";

const client = new Client({
  host: "127.0.0.1",
  port: 54322,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});

try {
  await client.connect();

  const memberships = await client.query(
    `select b.name
     from public.bakery_memberships as bm
     join public.bakeries as b on b.id = bm.bakery_id
     join auth.users as u on u.id = bm.user_id
     where u.email = $1
     order by b.name`,
    [seededAdminEmail],
  );
  const bakeryNames = memberships.rows.map(row => row.name);

  assert.deepEqual(
    bakeryNames,
    [expectedBakeryName],
    `Expected ${seededAdminEmail} to have only ${expectedBakeryName}, found: ${bakeryNames.join(", ") || "none"}`,
  );

  const runtimeCheckRows = await client.query(
    "select id from public.bakeries where name = $1",
    [runtimeCheckBakeryName],
  );
  assert.equal(
    runtimeCheckRows.rowCount,
    0,
    `${runtimeCheckBakeryName} must not exist in the local database`,
  );

  process.stdout.write(
    `Local bakery seed verification passed: ${seededAdminEmail} can access ${expectedBakeryName}.\n`,
  );
} finally {
  await client.end().catch(() => undefined);
}
