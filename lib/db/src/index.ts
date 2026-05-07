import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as coreSchema from "./schema";
import * as auditLogSchema from "@workspace/audit-log/schema";
import * as evalSchema from "@workspace/eval/schema";

const { Pool } = pg;

// Prefer SUPABASE_DATABASE_URL (Supabase EU pooler, ADR 0018 EU residency).
// Fall back to DATABASE_URL for legacy environments.
const connectionString =
  process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DATABASE_URL (preferred) or DATABASE_URL must be set. " +
      "Did you forget to provision the Supabase project?",
  );
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export const schema = {
  ...coreSchema,
  ...auditLogSchema,
  ...evalSchema,
};

export const db = drizzle(pool, { schema });

export * from "./schema";
export * from "@workspace/audit-log/schema";
export * from "@workspace/eval/schema";
