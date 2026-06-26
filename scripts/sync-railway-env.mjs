#!/usr/bin/env node
/**
 * Push env vars from a local file to Railway (does not pull secrets from git).
 *
 * Setup once:
 *   npm i -g @railway/cli   OR   npx @railway/cli login
 *   railway link            # pick goldspireventures/livia → livia-api
 *   cp railway.production.env.example railway.production.env
 *   # edit railway.production.env with real values (never commit)
 *
 * Usage:
 *   node scripts/sync-railway-env.mjs --dry-run
 *   node scripts/sync-railway-env.mjs
 *   node scripts/sync-railway-env.mjs --prune-legacy
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envFile = resolve(root, "railway.production.env");
const dryRun = process.argv.includes("--dry-run");
const pruneLegacy = process.argv.includes("--prune-legacy");

const LEGACY_DELETE = [
  "DASHBOARD_BASE_URL",
  "DASHBOARD_PUBLIC_URL",
  "TENANT_DASHBOARD_URL",
  "LIVIA_DASHBOARD_URL",
  "MARKETING_PUBLIC_URL",
  "INTERNAL_PUBLIC_URL",
  "PUBLIC_BASE_URL",
  "CLERK_PROXY_URL",
  "LIVIA_MARKETING_URL",
  "GRAFANA_EMBED_BASE_URL",
  "GRAFANA_LOCAL_URL",
  "INTERNAL_GRAFANA_URL",
  "LOKI_QUERY_BASE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
];

function railway(args, input) {
  const cli = process.env.RAILWAY_CLI ?? "railway";
  const r = spawnSync(cli, args, {
    encoding: "utf8",
    input,
    shell: process.platform === "win32",
  });
  if (r.error) {
    if (r.error.code === "ENOENT") {
      console.error(
        "Railway CLI not found. Install: npm i -g @railway/cli\nThen: railway login && railway link",
      );
      process.exit(1);
    }
    throw r.error;
  }
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || "railway command failed").trim());
  }
  return (r.stdout || "").trim();
}

function setRailwayVariable(key, val) {
  if (/[<>&|]/.test(val) || val.includes(" ")) {
    railway(["variable", "set", key, "--stdin"], val);
    return;
  }
  railway(["variable", "set", `${key}=${val}`]);
}

function parseEnvFile(path) {
  const raw = readFileSync(path, "utf8");
  const pairs = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!val) continue;
    pairs.push([key, val]);
  }
  return pairs;
}

if (!existsSync(envFile)) {
  console.error(`Missing ${envFile}`);
  console.error("Missing railway.production.env");
  console.error("  pnpm railway:build-prod-env --write   # from railway.env.example + .env");
  console.error("  or: cp railway.production.env.example railway.production.env");
  console.error("Then edit secrets and re-run: pnpm railway:sync-env");
  console.error("See docs/operations/RAILWAY-DEPLOY.md");
  process.exit(1);
}

const pairs = parseEnvFile(envFile);
if (pairs.length === 0) {
  console.error("No KEY=value lines in railway.production.env");
  process.exit(1);
}

console.log(dryRun ? "[dry-run] " : "", `Syncing ${pairs.length} variable(s) to linked Railway service…\n`);

for (const [key, val] of pairs) {
  const masked = /SECRET|KEY|PASSWORD|TOKEN|DATABASE_URL/i.test(key) ? "***" : val;
  console.log(`  set ${key}=${masked}`);
  if (!dryRun) {
    setRailwayVariable(key, val);
  }
}

if (pruneLegacy) {
  console.log("\nRemoving legacy variables…");
  for (const key of LEGACY_DELETE) {
    console.log(`  delete ${key}`);
    if (!dryRun) {
      try {
        railway(["variable", "delete", key]);
      } catch {
        console.log(`    (skip — ${key} not set)`);
      }
    }
  }
}

if (dryRun) {
  console.log("\nDry run complete. Re-run without --dry-run to apply, then redeploy on Railway.");
} else {
  console.log("\nDone. Railway → Deploy to restart with new env.");
  console.log("Verify: node scripts/prod-smoke.mjs");
}
