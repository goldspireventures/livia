#!/usr/bin/env node
/**
 * Staging E2E — marketing + public surfaces against staging stack.
 *
 *   node scripts/e2e-staging-verticals.mjs
 *   node scripts/e2e-staging-verticals.mjs --full
 *
 * Requires staging Clerk demo keys aligned on Railway (test/test with dashboard pk).
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const full = process.argv.includes("--full");

const env = {
  ...process.env,
  E2E_API_BASE: process.env.E2E_API_BASE ?? "https://api.staging.livia-hq.com",
  E2E_DASHBOARD_BASE: process.env.E2E_DASHBOARD_BASE ?? "https://app.staging.livia-hq.com",
  E2E_MARKETING_URL: process.env.E2E_MARKETING_URL ?? "https://staging.livia-hq.com",
  E2E_DASHBOARD_DEMO_URL: process.env.E2E_DASHBOARD_DEMO_URL ?? "https://app.staging.livia-hq.com/demo",
};

function run(label, args) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync("pnpm", args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env,
  });
  if (r.status !== 0) {
    console.error(`✗ ${label} failed (exit ${r.status})`);
    return false;
  }
  return true;
}

console.log("\n══ Livia — staging E2E ══\n");
console.log(`API:       ${env.E2E_API_BASE}`);
console.log(`Dashboard: ${env.E2E_DASHBOARD_BASE}`);
console.log(`Marketing: ${env.E2E_MARKETING_URL}\n`);

let ok = true;
const e2e = ["--filter", "@workspace/e2e", "exec", "playwright", "test"];

ok = run("Staging smoke (prod-smoke)", ["smoke:staging"]) && ok;
ok =
  run("Marketing platform smoke", ["pnpm", ...e2e, "--project=marketing-platform", "--workers=1"]) && ok;
ok =
  run("Marketing lifecycle", ["pnpm", ...e2e, "--project=marketing-lifecycle", "--workers=1"]) && ok;
ok =
  run("Public booking quality", ["pnpm", ...e2e, "--project=public-booking-quality", "--workers=1"]) &&
  ok;

if (full) {
  ok =
    run("Headless lifecycle", ["node", "scripts/headless-lifecycle-r1.mjs", "--api", env.E2E_API_BASE]) &&
    ok;
  ok =
    run("All verticals smoke (needs staging Clerk)", [
      "pnpm",
      ...e2e,
      "--project=all-verticals-smoke",
      "--workers=1",
    ]) && ok;
}

if (ok) {
  console.log("\n✓ Staging E2E finished.\n");
} else {
  process.exit(1);
}
