import { defineConfig } from "drizzle-kit";
import path from "path";

// Migrations always go through the session pooler (5432) — the transaction
// pooler (6543) does not support DDL session state.
const url =
  process.env.SUPABASE_DATABASE_URL_DIRECT ??
  process.env.SUPABASE_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "SUPABASE_DATABASE_URL_DIRECT (preferred for migrations) or " +
      "SUPABASE_DATABASE_URL or DATABASE_URL must be set.",
  );
}

export default defineConfig({
  schema: [
    path.join(__dirname, "./src/schema/index.ts"),
    path.join(__dirname, "../audit-log/src/schema.ts"),
    path.join(__dirname, "../eval/src/schema.ts"),
  ],
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl: { rejectUnauthorized: false },
  },
});
