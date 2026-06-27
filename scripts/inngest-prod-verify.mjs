#!/usr/bin/env node
/**
 * Production Inngest readiness — public + optional Railway env check.
 *
 *   node scripts/inngest-prod-verify.mjs
 *   node scripts/inngest-prod-verify.mjs --api https://api.livia-hq.com
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiBase = (
  process.argv.find((a, i) => process.argv[i - 1] === "--api") ?? "https://api.livia-hq.com"
).replace(/\/+$/, "");

const checks = [];
function pass(name, detail) {
  checks.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail) {
  checks.push({ name, ok: false, detail });
  console.log(`✗ ${name} — ${detail}`);
}

console.log("\n══ Inngest production verify ══\n");
console.log(`  API: ${apiBase}\n`);

try {
  const health = await fetch(`${apiBase}/api/healthz`);
  if (health.ok) pass("API healthz", String(health.status));
  else fail("API healthz", `HTTP ${health.status}`);
} catch (e) {
  fail("API healthz", e instanceof Error ? e.message : String(e));
}

try {
  const res = await fetch(`${apiBase}/api/inngest`);
  const text = await res.text();
  if (res.status === 401 || text.includes("Unauthorized")) {
    pass(
      "Inngest serve endpoint",
      "401 without signature (expected) — confirm app synced at https://app.inngest.com",
    );
  } else if (res.ok) {
    const body = JSON.parse(text);
    pass(
      "Inngest serve introspection",
      `mode=${body.mode ?? "?"} functions=${body.function_count ?? "?"}`,
    );
  } else {
    fail("Inngest serve introspection", `HTTP ${res.status}: ${text.slice(0, 120)}`);
  }
} catch (e) {
  fail("Inngest serve introspection", e instanceof Error ? e.message : String(e));
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const railway = spawnSync("railway", ["variables", "--json"], {
  cwd: root,
  encoding: "utf8",
  shell: process.platform === "win32",
});
if (railway.status === 0 && railway.stdout) {
  try {
    const vars = JSON.parse(railway.stdout);
    const disabled = vars.WORKFLOWS_DISABLED;
    const eventKey = vars.INNGEST_EVENT_KEY;
    const signingKey = vars.INNGEST_SIGNING_KEY;
    if (disabled === "true" || disabled === true) {
      fail("Railway WORKFLOWS_DISABLED", "true — workflows hard-disabled");
    } else {
      pass("Railway WORKFLOWS_DISABLED", disabled ? String(disabled) : "unset (ok)");
    }
    if (eventKey) pass("Railway INNGEST_EVENT_KEY", "set");
    else fail("Railway INNGEST_EVENT_KEY", "missing — create Inngest Cloud app → copy event key");
    if (signingKey) pass("Railway INNGEST_SIGNING_KEY", "set");
    else fail("Railway INNGEST_SIGNING_KEY", "missing — copy signing key from Inngest Cloud");
  } catch {
    fail("Railway env parse", "could not parse railway variables --json");
  }
} else {
  console.log("⚠ Skipping Railway env (railway CLI not linked or not logged in)");
}

console.log("");
const bad = checks.filter((c) => !c.ok);
if (bad.length) {
  console.log(`Result: ${checks.length - bad.length}/${checks.length} pass`);
  console.log("\nNext: docs/engineering/inngest-prod-runbook.md\n");
  process.exit(1);
}
console.log(`Result: ${checks.length}/${checks.length} pass — register Serve URL in Inngest Cloud if not done.\n`);
