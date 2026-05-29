/**
 * Resolve staging vs production Postgres URL from repo-root .env.
 * Default local target: staging (`DATABASE_URL`). Prod: `DATABASE_URL_PROD`.
 */
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const repoRoot = root;
export const envFile = resolve(root, ".env");

export function loadRootEnv() {
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
}

/** @param {'staging' | 'production'} target */
export function resolveDbUrl(target) {
  loadRootEnv();
  const stagingUrl =
    process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL ?? "";
  const prodUrl = process.env.DATABASE_URL_PROD ?? "";

  if (target === "production") {
    if (!prodUrl) {
      throw new Error(
        "DATABASE_URL_PROD must be set in repo-root .env for --prod (keep DATABASE_URL on staging).",
      );
    }
    return prodUrl;
  }

  if (!stagingUrl) {
    throw new Error(
      "DATABASE_URL must be set in repo-root .env for staging (default).",
    );
  }
  return stagingUrl;
}

export function hostHint(connectionString) {
  try {
    const normalized = connectionString.replace(/^postgresql:\/\//, "postgres://");
    const u = new URL(normalized);
    const port = u.port ? `:${u.port}` : "";
    return `${u.hostname}${port}`;
  } catch {
    return "(invalid url)";
  }
}

/** @param {'staging' | 'production'} target */
export function applyDbTargetEnv(target) {
  const url = resolveDbUrl(target);
  process.env.LIVIA_DB_TARGET = target;
  process.env.DATABASE_URL = url;
  process.env.SUPABASE_DATABASE_URL = url;
  return { target, url, host: hostHint(url) };
}
