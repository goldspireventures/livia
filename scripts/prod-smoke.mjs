#!/usr/bin/env node
/**
 * Production smoke — run anytime to see why app.livia-hq.com might spin.
 * Does not need Railway/Vercel credentials (public HTTP only).
 *
 *   node scripts/prod-smoke.mjs
 *   node scripts/prod-smoke.mjs --app https://app.livia-hq.com --api https://api.livia-hq.com
 */
const appBase = (
  process.argv.find((a, i) => process.argv[i - 1] === "--app") ??
  "https://app.livia-hq.com"
).replace(/\/+$/, "");
const apiBase = (
  process.argv.find((a, i) => process.argv[i - 1] === "--api") ??
  "https://api.livia-hq.com"
).replace(/\/+$/, "");

const failures = [];
const passes = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    passes.push({ name, detail });
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    failures.push({ name, msg });
    console.log(`✗ ${name} — ${msg}`);
  }
}

async function fetchText(url, init) {
  const res = await fetch(url, { ...init, redirect: "follow" });
  const text = await res.text();
  return { res, text };
}

console.log(`\nLivia production smoke`);
console.log(`  app: ${appBase}`);
console.log(`  api: ${apiBase}\n`);

await check("API /api/healthz", async () => {
  const { res, text } = await fetchText(`${apiBase}/api/healthz`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!text.includes('"ok"') && !text.includes('"status"')) throw new Error(text.slice(0, 120));
  return "200 JSON";
});

await check("App /api/healthz (Vercel → Railway rewrite)", async () => {
  const { res, text } = await fetchText(`${appBase}/api/healthz`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (text.trimStart().startsWith("<!")) throw new Error("got HTML (rewrite broken)");
  return "200 JSON";
});

let clerkKeyMode = "unknown";

await check("Dashboard HTML loads", async () => {
  const { res, text } = await fetchText(`${appBase}/`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!text.includes("/assets/")) throw new Error("missing Vite bundle refs");
  return "index.html + assets";
});

await check("Clerk publishable key in Vercel bundle", async () => {
  const { text: html } = await fetchText(`${appBase}/`);
  const m = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (!m) throw new Error("no index-*.js in HTML");
  const { text: js } = await fetchText(`${appBase}${m[1]}`);
  const embedded = js.match(/pk_(live|test)_[A-Za-z0-9$]+/);
  if (!embedded) {
    throw new Error("no pk_ key in bundle — set VITE_CLERK_PUBLISHABLE_KEY on Vercel and redeploy");
  }
  clerkKeyMode = embedded[1] === "live" ? "live" : "test";
  if (clerkKeyMode === "live") {
    return "pk_live_ — browser uses /api/__clerk proxy";
  }
  return "pk_test_ — browser talks to Clerk CDN (not /api/__clerk)";
});

await check("Clerk Frontend API (CNAME clerk.*)", async () => {
  const clerkHost = appBase.replace(/^https?:\/\/app\./, "https://clerk.");
  const { res, text } = await fetchText(`${clerkHost}/v1/environment`);
  if (text.includes("host_invalid")) {
    throw new Error(`${clerkHost} host_invalid — verify Clerk → Domains → clerk CNAME`);
  }
  if (!res.ok && res.status !== 405) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
  }
  return `${clerkHost} OK (use CNAME — skip proxy modal)`;
});

await check("Clerk proxy /api/__clerk (optional)", async () => {
  const { res, text } = await fetchText(`${appBase}/api/__clerk/v1/environment`);
  if (text.includes("host_invalid") || text.includes("Invalid host")) {
    return "not used — production should use clerk.* CNAME, not proxy";
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 160)}`);
  return "proxy OK";
});

console.log("");
if (failures.length === 0) {
  console.log("All checks passed. If the UI still spins, use incognito + DevTools → Network (clerk).");
  process.exit(0);
}

console.log(`${failures.length} check(s) failed.\n`);
console.log("Common causes besides Clerk:");
console.log("  • Vercel preview URL (deployment protection blocks /api)");
console.log("  • Stale browser cache — hard refresh / incognito");
console.log("  • Mobile EAS build still points EXPO_PUBLIC_API_BASE_URL at localhost");
console.log("  • Missing VITE_CLERK_PUBLISHABLE_KEY on Vercel build\n");
console.log("Logs today:");
console.log("  • Railway → livia-api → Deployments → View logs (API + Clerk proxy)");
console.log("  • Vercel → project → Logs (static build only)");
console.log("  • Browser DevTools → Console + Network (client-side; not in Railway)");
console.log("  • Sentry: only if VITE_SENTRY_DSN / SENTRY_DSN_API are set\n");
process.exit(1);
