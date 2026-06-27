#!/usr/bin/env node
/**
 * Production smoke — run anytime to see why app.livia-hq.com might spin.
 * Does not need Railway/Vercel credentials (public HTTP only).
 *
 *   node scripts/prod-smoke.mjs
 *   node scripts/prod-smoke.mjs --app https://app.livia-hq.com --api https://api.livia-hq.com
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readRootEnvKey(key) {
  const envPath = resolve(repoRoot, ".env");
  if (!existsSync(envPath)) return undefined;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(new RegExp(`^\\s*${key}=(.*)$`));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return undefined;
}

function clerkKeyEnv(k) {
  if (!k) return "missing";
  if (k.startsWith("sk_live_") || k.startsWith("pk_live_")) return "live";
  if (k.startsWith("sk_test_") || k.startsWith("pk_test_")) return "test";
  return "unknown";
}

async function clerkSessionJwt(secret, userId) {
  const headers = { Authorization: `Bearer ${secret}` };
  const sessionsRes = await fetch(
    `https://api.clerk.com/v1/sessions?user_id=${encodeURIComponent(userId)}&status=active&limit=1`,
    { headers },
  );
  if (!sessionsRes.ok) throw new Error(`Clerk sessions HTTP ${sessionsRes.status}`);
  const sessions = await sessionsRes.json();
  const sessionId = sessions?.[0]?.id;
  if (!sessionId) throw new Error("no active Clerk session for probe user");
  const tokenRes = await fetch(`https://api.clerk.com/v1/sessions/${sessionId}/tokens`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: "{}",
  });
  if (!tokenRes.ok) throw new Error(`Clerk token HTTP ${tokenRes.status}`);
  const tokenJson = await tokenRes.json();
  return tokenJson.jwt;
}

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
  const usesProxy = js.includes("/api/__clerk");
  if (clerkKeyMode === "live") {
    return usesProxy
      ? "pk_live_ + /api/__clerk proxy (optional)"
      : "pk_live_ + Clerk CNAME (recommended)";
  }
  return "pk_test_ — browser talks to Clerk CDN (not /api/__clerk)";
});

await check("Clerk Frontend API (CNAME clerk.*)", async () => {
  if (clerkKeyMode === "test" || appBase.includes(".staging.")) {
    return "skipped — pk_test_ / staging uses Clerk CDN (custom clerk.* CNAME optional)";
  }
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

await check("Railway Clerk keys match Vercel pk_live (needs repo .env)", async () => {
  if (clerkKeyMode !== "live") return "skipped — app bundle is not pk_live_";
  const secret = readRootEnvKey("CLERK_SECRET_KEY");
  if (!secret) return "skipped — no repo-root CLERK_SECRET_KEY to probe with";
  const secretEnv = clerkKeyEnv(secret);
  if (secretEnv === "live") return "local secret is sk_live_ — sync same pair to Railway if not already";

  // App ships pk_live; if API still verifies sk_test JWTs, founders get 401 after sign-in.
  const probeUserId = readRootEnvKey("LIVIA_PROD_CLERK_PROBE_USER_ID") ?? "user_3Fa2cJWMEw5IuG34ksUITMJDRVN";
  const jwt = await clerkSessionJwt(secret, probeUserId);
  const { res } = await fetchText(`${apiBase}/api/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (res.status === 200) {
    throw new Error(
      "API accepts test Clerk JWT while Vercel bundle is pk_live_ — set sk_live_ + pk_live_ on Railway livia-api and redeploy",
    );
  }
  if (res.status === 401) return "API rejects test JWT (expected when Railway uses live keys)";
  throw new Error(`unexpected /api/me HTTP ${res.status}`);
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
