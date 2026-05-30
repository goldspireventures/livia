/**
 * One-shot prep before local E2E / Gate 3 testing.
 * Usage: node scripts/e2e-prep.mjs [--skip-db] [--skip-browsers]
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { clerkAlignmentEnv } from "./lib/clerk-env-alignment.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const args = new Set(process.argv.slice(2));
const skipDb = args.has("--skip-db");
const skipBrowsers = args.has("--skip-browsers");

function loadEnv() {
  if (!existsSync(envPath)) return false;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return true;
}

function run(cmd, cmdArgs, label) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, cmdArgs, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`✗ ${label} failed (exit ${r.status})`);
    process.exitCode = 1;
    return false;
  }
  return true;
}

console.log("\n══ Livia E2E prep ══\n");

const hasEnv = loadEnv();
clerkAlignmentEnv();
run("node", ["scripts/ensure-clerk-keys-aligned.mjs"], "Clerk key alignment check");
if (!hasEnv) {
  console.warn("⚠ No repo-root .env — copy .env.example to .env and fill DATABASE_URL + Clerk keys.\n");
} else if (!process.env.DATABASE_URL && !process.env.SUPABASE_DATABASE_URL) {
  console.warn("⚠ DATABASE_URL not set in .env\n");
}

if (!skipDb) {
  const conn = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (conn) {
    run("node", ["--env-file=.env", "scripts/apply-sql-migrations.mjs"], "SQL migrations (006 messaging, etc.)");
    run("pnpm", ["run", "db:push"], "Drizzle schema push");
    run("pnpm", ["run", "demo:provision"], "Provision full demo world (all verticals)");
  } else {
    console.log("⊘ Skipping DB — no DATABASE_URL");
  }
} else {
  console.log("⊘ Skipping DB (--skip-db)");
  run("node", ["scripts/provision-demo-if-needed.mjs"], "Ensure demo provisioned");
  run(
    "node",
    ["-e", "fetch('http://127.0.0.1:3000/api/demo/sync-clerk',{method:'POST'}).then(r=>r.json()).then(j=>console.log('sync-clerk',j)).catch(()=>console.warn('sync-clerk skipped — start API first'))"],
    "Sync demo Clerk users",
  );
}

run("pnpm", ["run", "typecheck:libs"], "Typecheck shared libs");
run("pnpm", ["--filter", "@workspace/api-server", "run", "test"], "API unit tests");

if (!skipBrowsers) {
  run(
    "pnpm",
    ["--filter", "@workspace/e2e", "exec", "playwright", "install", "chromium"],
    "Install Playwright Chromium",
  );
}

console.log(`
✓ Prep finished (exit ${process.exitCode ?? 0})

Next — open 2 terminals:
  1) pnpm dev:api          → http://127.0.0.1:3001
  2) pnpm dev:dashboard    → http://127.0.0.1:5173

Then run:
  pnpm smoke:gate3
  pnpm test:e2e:api
  pnpm test:e2e

E2E runbook: docs/testing/E2E-RUNBOOK.md
`);
