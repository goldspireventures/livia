#!/usr/bin/env node
/**
 * Simulates native mobile guest + operator entry spines (API-only).
 * Same endpoints livia-mobile calls — no Expo device required in CI.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const api = (process.env.E2E_API_BASE ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const guestPhone = process.env.DEMO_GUEST_PHONE ?? "+353 87 100 0001";

async function assertOk(res, label) {
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${label}: ${res.status} ${t.slice(0, 200)}`);
  }
}

async function guestPath() {
  const otpReq = await fetch(`${api}/api/public/guest-hub/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mobile-smoke@example.com", country: "IE" }),
  });
  await assertOk(otpReq, "guest otp/request (email)");
  const { sessionToken, magicOtpCode, devOtp } = await otpReq.json();
  const code = devOtp ?? magicOtpCode;
  if (!code) {
    console.log("⚠ Guest OTP strict mode — skipping verify (use real inbox on device)");
    const pub = await fetch(`${api}/api/public/b/bloom-beauty-dublin`);
    await assertOk(pub, "public book bloom");
    return null;
  }

  const verify = await fetch(`${api}/api/public/guest-hub/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken, code }),
  });
  await assertOk(verify, "guest otp/verify");
  const { hubToken } = await verify.json();
  if (!hubToken) throw new Error("missing hubToken");

  const me = await fetch(`${api}/api/public/guest-hub/me`, {
    headers: { "X-Guest-Hub-Token": hubToken },
  });
  await assertOk(me, "guest /me");
  const view = await me.json();
  if (!view.shops?.length) throw new Error("guest /me empty shops");

  const pref = await fetch(`${api}/api/public/guest-hub/preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Guest-Hub-Token": hubToken,
    },
    body: JSON.stringify({ preferredModality: "WEB" }),
  });
  await assertOk(pref, "guest preferences");

  const pub = await fetch(`${api}/api/public/b/bloom-beauty-dublin`);
  await assertOk(pub, "public book bloom");

  console.log(`✓ Guest mobile spine — ${view.shops.length} shops, channel WEB`);
  return hubToken;
}

async function operatorPath() {
  const ticket = await fetch(`${api}/api/demo/sign-in-business`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "harbour-wellness-cork" }),
  });
  await assertOk(ticket, "demo sign-in-business");
  const { token, email } = await ticket.json();
  if (!token || !email) throw new Error("demo sign-in-business missing token");

  const exp = await fetch(`${api}/api/public/b/harbour-wellness-cork`);
  await assertOk(exp, "public b harbour (skin source)");

  console.log(`✓ Operator spine — ticket for ${email}`);
}

async function main() {
  const guestOnly = process.argv.includes("--guest-only");
  console.log("\n▶ Mobile entry smoke (API simulation)\n");
  const health = await fetch(`${api}/api/healthz`);
  await assertOk(health, "healthz");
  await guestPath();
  if (!guestOnly) await operatorPath();
  console.log("\n✓ Mobile entry smoke passed\n");
}

main().catch((err) => {
  console.error("✗", err.message ?? err);
  process.exit(1);
});
