import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// When prisma.config.ts exists, Prisma does not auto-load .env for the CLI.
// Load project-root .env explicitly so migrate / studio / generate see DATABASE_URL.
const envPath = path.resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  const result = loadEnv({ path: envPath });
  if (result.error) {
    throw new Error(`Failed to load ${envPath}: ${result.error.message}`);
  }
}

// Normalize pasted values so Prisma sees valid postgres URIs (P1012 if malformed).
function normalizeDatabaseEnvVar(name: "DATABASE_URL" | "DIRECT_URL") {
  const raw = process.env[name];
  if (typeof raw !== "string") return;
  let u = raw.trim().replace(/^\uFEFF/, "");
  if (
    (u.startsWith('"') && u.endsWith('"')) ||
    (u.startsWith("'") && u.endsWith("'"))
  ) {
    u = u.slice(1, -1).trim();
  }
  process.env[name] = u;
}
normalizeDatabaseEnvVar("DATABASE_URL");
normalizeDatabaseEnvVar("DIRECT_URL");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Pooled URL (PgBouncer): add `pgbouncer=true&connection_limit=1` in `.env` — see `schema.prisma` header.
  // directUrl: non-pooled for Migrate / introspection (same DB as DATABASE_URL).
  datasource: {
    url: env("DATABASE_URL"),
    ...(process.env.DIRECT_URL && process.env.DIRECT_URL.length > 0
      ? { directUrl: process.env.DIRECT_URL }
      : {}),
  },
});
