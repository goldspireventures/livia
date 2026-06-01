/**
 * Apply a single SQL migration file (non-interactive). Usage:
 *   node --env-file=.env scripts/apply-sql-migration.mjs lib/db/migrations/sql/032-public-featured-services.sql
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rel = process.argv[2];
if (!rel) {
  console.error("Usage: node --env-file=.env scripts/apply-sql-migration.mjs <path-to.sql>");
  process.exit(1);
}

const url = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL / SUPABASE_DATABASE_URL");
  process.exit(1);
}

const sql = readFileSync(resolve(root, rel), "utf8");
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
  console.log(`Applied ${rel}`);
} finally {
  await client.end();
}
