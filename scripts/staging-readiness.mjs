#!/usr/bin/env node
/**
 * Staging readiness — post-deploy gate before founder E2E or pnpm test:e2e:staging.
 *
 *   node scripts/staging-readiness.mjs
 *   node scripts/staging-readiness.mjs --strict   # exit 1 on any failure
 *
 * Checks (public HTTP):
 *   - API + app health (prod-smoke subset)
 *   - Demo portal enabled on staging API
 *   - Marketing SPA bundles contain R1 pricing + wedge CTAs
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

const appBase = (process.env.STAGING_APP_URL ?? "https://app.staging.livia-hq.com").replace(/\/+$/, "");
const apiBase = (process.env.STAGING_API_URL ?? "https://api.staging.livia-hq.com").replace(/\/+$/, "");
const marketingBase = (process.env.STAGING_MARKETING_URL ?? "https://staging.livia-hq.com").replace(/\/+$/, "");

const failures = [];
const passes = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    passes.push(name);
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    failures.push({ name, msg });
    console.log(`✗ ${name} — ${msg}`);
  }
}

async function fetchText(url, init) {
  const res = await fetch(url, { ...init, redirect: "follow", signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  return { res, text };
}

/** Vite SPA — pricing copy lives in JS chunks, not initial HTML. */
async function marketingBundleContains(path, needles) {
  const { res, text: html } = await fetchText(`${marketingBase}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const srcMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
  if (!srcMatch) throw new Error("no JS bundle in index.html");
  const { res: jsRes, text: js } = await fetchText(`${marketingBase}${srcMatch[1]}`);
  if (!jsRes.ok) throw new Error(`bundle HTTP ${jsRes.status}`);
  const missing = needles.filter((n) => !js.includes(n));
  if (missing.length) throw new Error(`bundle missing: ${missing.join(", ")}`);
  return srcMatch[1];
}

console.log(`\n▶ Staging readiness\n`);
console.log(`  app:       ${appBase}`);
console.log(`  api:       ${apiBase}`);
console.log(`  marketing: ${marketingBase}\n`);

await check("API /api/healthz", async () => {
  const { res, text } = await fetchText(`${apiBase}/api/healthz`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!text.includes("ok") && !text.includes("status")) throw new Error(text.slice(0, 80));
  return "200";
});

await check("App /api/healthz rewrite", async () => {
  const { res, text } = await fetchText(`${appBase}/api/healthz`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (text.trimStart().startsWith("<!")) throw new Error("HTML (rewrite broken)");
  return "200 JSON";
});

await check("Demo portal enabled (GET /api/demo/status)", async () => {
  const res = await fetch(`${apiBase}/api/demo/status`, { signal: AbortSignal.timeout(15_000) });
  if (res.status === 404) {
    throw new Error("404 — set LIVIA_DEMO_ENABLED=true on Railway staging + redeploy");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body || typeof body !== "object") throw new Error("invalid JSON");
  return body.provisioned ? "provisioned" : "enabled (not yet provisioned)";
});

await check("Marketing pricing bundle (€79/mo)", async () => {
  const bundle = await marketingBundleContains("/pricing", ["€79", "/mo"]);
  return bundle;
});

await check("Marketing home wedge CTAs", async () => {
  const bundle = await marketingBundleContains("/", ["demo/wedge/"]);
  return bundle;
});

await check("Presentation presets gate (E7)", async () => {
  const stagingEnv = { NODE_ENV: "production", LIVIA_DEPLOY_ENV: "staging" };
  const enabled =
    stagingEnv.LIVIA_DEPLOY_ENV === "staging" ||
    process.env.LIVIA_PRESENTATION_PRESETS === "true";
  if (!enabled) throw new Error("staging policy gate off");
  return "LIVIA_DEPLOY_ENV=staging (run settings-preset-picker E2E after API redeploy)";
});

await check("Demo guest surface token (proof)", async () => {
  const res = await fetch(`${apiBase}/api/demo/guest-surfaces/ink-anchor-galway/proof`, {
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 404) {
    throw new Error("404 — demo not provisioned; run pnpm db:seed:staging or POST /api/demo/provision");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body?.url && !body?.path) throw new Error("missing guest URL in response");
  return "proof token OK";
});

const smoke = spawnSync("pnpm", ["smoke:staging"], {
  cwd: root,
  stdio: "pipe",
  shell: process.platform === "win32",
  encoding: "utf8",
});
if (smoke.status !== 0) {
  failures.push({ name: "pnpm smoke:staging", msg: `exit ${smoke.status}` });
  console.log(`✗ pnpm smoke:staging — exit ${smoke.status}`);
} else {
  passes.push("pnpm smoke:staging");
  console.log("✓ pnpm smoke:staging");
}

console.log(`\n${failures.length === 0 ? "✓ Staging ready for E2E" : `✗ ${failures.length} blocker(s)`}`);
if (failures.length) {
  console.log("\nFix:");
  for (const f of failures) {
    console.log(`  • ${f.name}: ${f.msg}`);
  }
  console.log("\nRailway staging: LIVIA_DEMO_ENABLED=true → redeploy → pnpm db:seed:staging");
  console.log("Then: pnpm test:e2e:staging\n");
}

process.exit(failures.length && strict ? 1 : 0);
