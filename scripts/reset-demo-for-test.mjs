/**
 * Wipe demo + seed tenants so "Set up full demo world" loads fresh data.
 * Usage: node --env-file=.env scripts/reset-demo-for-test.mjs
 */
import pg from "pg";

const SLUGS = [
  "aurora-studio",
  "aurora-mews",
  "aurora-galway",
  "conors-cut-co",
  "luxe-salon-spa",
];

const connectionString = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL or SUPABASE_DATABASE_URL required");
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

const before = await client.query(
  `SELECT slug FROM businesses WHERE slug = ANY($1::text[])`,
  [SLUGS],
);
console.log(`Found ${before.rows.length} tenant(s) to remove: ${before.rows.map((r) => r.slug).join(", ") || "(none)"}`);

if (before.rows.length > 0) {
  const del = await client.query(`DELETE FROM businesses WHERE slug = ANY($1::text[])`, [SLUGS]);
  console.log(`✓ Deleted ${del.rowCount} business row(s) (cascade: bookings, inbox, staff, etc.)`);
}

await client.end();
console.log("\nNext: start API + dashboard, open http://localhost:5173/demo, click Set up full demo world.\n");
