/**
 * Apply lib/db/migrations/sql/*.sql in order (Windows-friendly; no psql required).
 * Usage: node --env-file=.env scripts/apply-sql-migrations.mjs
 */
import pg from "pg";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { Client } = pg;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sqlDir = resolve(root, "lib/db/migrations/sql");

const connectionString = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("SUPABASE_DATABASE_URL or DATABASE_URL must be set");
  process.exit(1);
}

const files = readdirSync(sqlDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new Client({ connectionString });
await client.connect();

for (const file of files) {
  const sql = readFileSync(resolve(sqlDir, file), "utf8");
  console.log(`▶ ${file}`);
  try {
    await client.query(sql);
    console.log(`  ✓ ${file}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/already exists|duplicate/i.test(msg)) {
      console.log(`  ⊘ ${file} (already applied)`);
      continue;
    }
    console.error(`  ✗ ${file}: ${msg}`);
    process.exitCode = 1;
  }
}

await client.end();
console.log("\nDone. Run: pnpm run db:push && pnpm run db:seed");
