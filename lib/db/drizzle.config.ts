import { defineConfig } from "drizzle-kit";

// Prefer pooler URLs (resolve on Windows). DIRECT (db.*.supabase.co) often ENOTFOUND locally.
// Session pooler (5432) supports DDL; transaction pooler (6543) does not.
const url =
  process.env.SUPABASE_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DATABASE_URL_DIRECT;

if (!url) {
  throw new Error(
    "SUPABASE_DATABASE_URL_DIRECT (preferred for migrations) or " +
      "SUPABASE_DATABASE_URL or DATABASE_URL must be set.",
  );
}

export default defineConfig({
  // Folder globs (not index.ts barrels) — drizzle-kit must see pgTable definitions directly.
  schema: [
    "./src/schema",
    "../audit-log/src/schema.ts",
    "../eval/src/schema.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl: { rejectUnauthorized: false },
  },
});
