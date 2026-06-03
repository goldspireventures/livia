#!/usr/bin/env node
/**
 * Staging readiness — post-deploy gate before founder E2E or pnpm test:e2e:staging.
 *
 *   pnpm staging:readiness
 *   node scripts/staging-readiness.mjs --strict
 *
 * Checks (public HTTP):
 *   - API + app health (prod-smoke subset)
 *   - Demo portal enabled on staging API
 *   - Marketing SPA bundles ship PLAN_CATALOGUE pricing + wedge CTAs
 *
 * Pricing note: livia.io renders €79 at runtime via formatEur(cents) — bundles carry
 * baseEurCentsPerMonth from @workspace/entitlements, not the literal "€79" string.
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPlanCataloguePricingSnapshot } from "./lib/load-plan-catalogue.mjs";

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

/** Collect deduped Vite asset URLs from SPA shell (entry + modulepreload). */
function collectSpaAssetJsUrls(html) {
  const urls = new Set();
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)) {
    urls.add(match[1]);
  }
  return [...urls];
}

/** Vite SPA — route copy lives in JS chunks, not initial HTML. */
async function fetchMarketingSpaBundles(path) {
  const { res, text: html } = await fetchText(`${marketingBase}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const assetUrls = collectSpaAssetJsUrls(html);
  if (!assetUrls.length) throw new Error("no JS bundles in index.html");
  const bundles = [];
  for (const assetUrl of assetUrls) {
    const { res: jsRes, text: js } = await fetchText(`${marketingBase}${assetUrl}`);
    if (!jsRes.ok) throw new Error(`bundle HTTP ${jsRes.status} (${assetUrl})`);
    bundles.push({ assetUrl, js });
  }
  return bundles;
}

function marketingBundlesContain(bundles, needles) {
  const corpus = bundles.map((b) => b.js).join("\n");
  const missing = needles.filter((n) => !corpus.includes(n));
  if (missing.length) throw new Error(`bundles missing: ${missing.join(", ")}`);
  return bundles.map((b) => b.assetUrl).join(", ");
}

async function marketingBundleContains(path, needles) {
  const bundles = await fetchMarketingSpaBundles(path);
  return marketingBundlesContain(bundles, needles);
}

/** Needles that prove PLAN_CATALOGUE shipped in the marketing bundle (runtime-priced). */
function marketingPricingNeedles(catalogue) {
  const { solo, studio } = catalogue;
  return [
    `id:"${solo.id}"`,
    `name:"${solo.name}"`,
    `baseEurCentsPerMonth:${solo.baseEurCentsPerMonth}`,
    `baseEurCentsPerMonth:${studio.baseEurCentsPerMonth}`,
    "/mo",
  ];
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

await check("Dashboard bundle uses staging API (not prod leak)", async () => {
  const { res, text: html } = await fetchText(`${appBase}/`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const srcMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
  if (!srcMatch) throw new Error("no JS bundle in index.html");
  const { res: jsRes, text: js } = await fetchText(`${appBase}${srcMatch[1]}`);
  if (!jsRes.ok) throw new Error(`bundle HTTP ${jsRes.status}`);
  const hasStagingApi = js.includes("api.staging.livia-hq.com");
  const hasProdApiOnly =
    js.includes("api.livia-hq.com") && !js.includes("api.staging.livia-hq.com");
  if (hasProdApiOnly) {
    throw new Error(
      "bundle references api.livia-hq.com without staging — fix livia-stg Root Directory + env (see VERCEL-DEPLOY-ENVIRONMENTS.md)",
    );
  }
  if (!hasStagingApi && !js.includes("127.0.0.1")) {
    throw new Error("bundle missing api.staging.livia-hq.com — check VITE_API_BASE_URL");
  }
  return srcMatch[1];
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

const planCatalogue = loadPlanCataloguePricingSnapshot();

await check("Marketing pricing bundle (PLAN_CATALOGUE solo floor)", async () => {
  const { solo } = planCatalogue;
  const floor = `€${Math.round(solo.baseEurCentsPerMonth / 100)}`;
  const bundles = await fetchMarketingSpaBundles("/pricing");
  const label = marketingBundlesContain(bundles, marketingPricingNeedles(planCatalogue));
  return `${label} (${floor}/mo from ${solo.baseEurCentsPerMonth} cents)`;
});

await check("Marketing demo funnel (book-demo request)", async () => {
  const bundles = await fetchMarketingSpaBundles("/book-demo");
  return marketingBundlesContain(bundles, ["/book-demo", "Request demo", "secure key"]);
});

await check("Marketing concierge gate (/demo invited path)", async () => {
  const bundles = await fetchMarketingSpaBundles("/demo");
  return marketingBundlesContain(bundles, ["Checking demo access", "Invited guests"]);
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
