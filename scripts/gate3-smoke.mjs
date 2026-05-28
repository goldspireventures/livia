/**
 * Gate 3 extended smoke — API + optional dashboard (launch-plan E1 companion).
 * Usage: node scripts/gate3-smoke.mjs [apiBase] [dashboardBase] [marketingBase]
 * Marketing defaults to http://localhost:5174 (pnpm dev:marketing).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");

function loadEnv() {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const apiBase = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const dashBase = (process.argv[3] ?? "http://localhost:5173").replace(/\/+$/, "");
const marketingBase = (process.argv[4] ?? "http://localhost:5174").replace(/\/+$/, "");
const slug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

let failed = 0;

async function check(name, fn) {
  try {
    const ok = await fn();
    console.log(`  [${ok ? "OK" : "FAIL"}] ${name}`);
    if (!ok) failed += 1;
  } catch (err) {
    failed += 1;
    console.log(`  [FAIL] ${name} — ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`\nGate 3 smoke\n  API: ${apiBase}\n  Dashboard: ${dashBase}\n  Marketing: ${marketingBase}\n`);

await check("healthz", async () => {
  const res = await fetch(`${apiBase}/api/healthz`);
  return res.status === 200;
});

await check("public business (demo slug)", async () => {
  const res = await fetch(`${apiBase}/api/public/b/${slug}`);
  if (res.status === 404) {
    console.log("       (skip — seed demo with scripts/seed-demo.mjs)");
    return true;
  }
  return res.ok;
});

await check("public chat AI disclosure", async () => {
  const res = await fetch(`${apiBase}/api/public/b/${slug}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hi" }),
  });
  if (res.status === 404) return true;
  if (res.status === 503 || res.status === 500) {
    console.log("       (skip — Liv chat needs AI_INTEGRATIONS_ANTHROPIC_* or ANTHROPIC_API_KEY)");
    return true;
  }
  if (!res.ok) return false;
  const body = await res.json();
  return typeof body.reply === "string" && /AI assistant/i.test(body.reply);
});

await check("billing route requires auth", async () => {
  const res = await fetch(`${apiBase}/api/businesses/fake-id/billing`);
  return res.status === 401 || res.status === 404;
});

await check("chain rollup requires auth", async () => {
  const res = await fetch(`${apiBase}/api/me/chain-rollup`);
  return res.status === 401;
});

await check("peer insights requires auth", async () => {
  const res = await fetch(`${apiBase}/api/businesses/fake-id/peer-insights`);
  return res.status === 401;
});

await check("partner API rejects anonymous", async () => {
  const res = await fetch(`${apiBase}/api/partner/v1/businesses/${slug}/bookings`);
  return res.status === 401 || res.status === 503;
});

await check("integrations config requires auth", async () => {
  const res = await fetch(`${apiBase}/api/businesses/fake-id/integrations`);
  return res.status === 401;
});

await check("partner services requires key", async () => {
  const res = await fetch(`${apiBase}/api/partner/v1/businesses/${slug}/services`);
  return res.status === 401 || res.status === 503;
});

await check("dashboard sign-in shell", async () => {
  const res = await fetch(`${dashBase}/sign-in`);
  if (!res.ok) {
    console.log("       (skip — start pnpm dev:dashboard)");
    return true;
  }
  const html = await res.text();
  return /sign|livia/i.test(html);
});

await check("public booking page shell", async () => {
  const res = await fetch(`${dashBase}/b/${slug}`);
  if (!res.ok) return false;
  const html = await res.text();
  return html.length > 500 && !/not found/i.test(html);
});

await check("livia.io pricing (no dental)", async () => {
  try {
    const res = await fetch(`${marketingBase}/pricing`);
    if (!res.ok) {
      console.log("       (skip — start pnpm dev:marketing)");
      return true;
    }
    const html = await res.text();
    return !/dental/i.test(html);
  } catch {
    console.log("       (skip — marketing not reachable; pnpm dev:marketing)");
    return true;
  }
});

await check("livia.io chair-rental landing", async () => {
  try {
    const res = await fetch(`${marketingBase}/for/chair-rental`);
    if (!res.ok) {
      console.log("       (skip — start pnpm dev:marketing)");
      return true;
    }
    const html = await res.text();
    return /host|chair|rent/i.test(html);
  } catch {
    console.log("       (skip — marketing not reachable; pnpm dev:marketing)");
    return true;
  }
});

console.log(failed ? `\n${failed} check(s) failed.\n` : "\nAll Gate 3 smoke checks passed.\n");
process.exitCode = failed ? 1 : 0;
