#!/usr/bin/env node
/**
 * Full multi-vertical E2E — smoke + UX gate (+ optional visual captures).
 *
 *   node scripts/e2e-all-verticals.mjs
 *   node scripts/e2e-all-verticals.mjs --visual
 *   node scripts/e2e-all-verticals.mjs --skip-prep
 *
 * Prereqs (separate terminals) — or: node scripts/start-platform-for-test.mjs
 *   pnpm dev:api
 *   pnpm dev:dashboard
 *   pnpm dev:marketing
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const withVisual = args.has("--visual");
const skipPrep = args.has("--skip-prep");

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m && process.env[m[1].trim()] === undefined) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

function run(cmd, cmdArgs, label) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`✗ ${label} failed (exit ${r.status})`);
    return false;
  }
  return true;
}

async function ping(url, label) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    console.log(`  ${label}: ${r.status}`);
    return r.ok || r.status < 500;
  } catch (e) {
    console.warn(`  ${label}: unreachable (${e.message})`);
    return false;
  }
}

loadEnv();

console.log("\n══ Livia — all verticals E2E ══\n");
console.log("Stack check:");
const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const apiOk = await ping(`${apiBase}/api/demo/status`, "API");
const dashOk = await ping(process.env.E2E_DASHBOARD_BASE ?? "http://127.0.0.1:5173", "Dashboard");
const mktOk = await ping(process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174", "Marketing");
if (!apiOk || !dashOk || !mktOk) {
  console.warn(
    "\n⚠ Start servers first:\n  pnpm dev:api\n  pnpm dev:dashboard\n  pnpm dev:marketing\n  (or: node scripts/start-platform-for-test.mjs)\n",
  );
}

let ok = true;

if (!skipPrep) {
  ok = run("node", ["scripts/e2e-prep.mjs", "--skip-db"], "E2E prep (typecheck + API tests + browsers)") && ok;
}

ok = run("node", ["scripts/provision-demo-if-needed.mjs"], "Ensure demo world provisioned") && ok;

const e2e = ["--filter", "@workspace/e2e", "exec", "playwright", "test"];

if (mktOk) {
  ok = run("pnpm", [...e2e, "--project=marketing-platform", "--workers=1"], "Smoke: livia.io (all routes)") && ok;
} else {
  console.log("⊘ Skip marketing-platform — marketing :5174 not running");
}
ok = run("pnpm", [...e2e, "--project=all-verticals-smoke", "--workers=1"], "Smoke: 9 verticals × owner + public") && ok;
ok = run("node", ["scripts/innovation-p0-smoke.mjs"], "Innovation P0 API smoke") && ok;
if (dashOk) {
  ok =
    run("pnpm", [...e2e, "--project=innovation-p0-e2e", "--workers=1"], "Innovation P0 Playwright E2E") &&
    ok;
}
if (dashOk) {
  ok =
    run("pnpm", [...e2e, "--project=public-booking-quality", "--workers=1"], "Public booking B2C quality") &&
    ok;
  ok =
    run("pnpm", [...e2e, "--project=guest-retail-cart", "--workers=1"], "Guest retail bag + checkout") &&
    ok;
  ok = run("pnpm", [...e2e, "--project=ux-quality-gate", "--workers=1"], "UX quality gate (hair wedge)") && ok;
  ok = run("pnpm", [...e2e, "--project=settings-preset-picker", "--workers=1"], "Settings preset picker (E7)") && ok;
} else {
  console.log("⊘ Skip dashboard E2E — dashboard :5173 not running");
}
ok = run("pnpm", [...e2e, "--project=internal-ops-smoke", "--workers=1"], "Internal ops (:5175)") && ok;
if (mktOk && dashOk) {
  ok =
    run("pnpm", [...e2e, "--project=marketing-lifecycle", "--workers=1"], "Marketing lifecycle (wedge → demo → /b)") &&
    ok;
} else {
  console.log("⊘ Skip marketing-lifecycle — need marketing + dashboard");
}

ok = run("node", ["scripts/headless-lifecycle-r1.mjs"], "Headless lifecycle (API wedge + /b)") && ok;

if (withVisual) {
  ok = run("pnpm", [...e2e, "--project=full-visual-audit", "--workers=1"], "Visual: all routes × verticals") && ok;
}

if (ok) {
  console.log(`
✓ All-verticals E2E finished.

Marketing: http://localhost:5174  ·  App demo: http://localhost:5173/demo
Shops: hair, beauty, allied-health, medspa, body-art, wellness, pet-grooming, fitness (+ automotive when seeded)
Docs: docs/testing/E2E-RUNBOOK.md · docs/company/NORTH-STAR-DASHBOARD.md
`);
} else {
  process.exit(1);
}
