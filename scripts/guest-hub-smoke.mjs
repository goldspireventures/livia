/**
 * GTM Wave 1 — guest hub + book URL smoke (API-level).
 *
 *   pnpm smoke:guest-hub
 *   node scripts/guest-hub-smoke.mjs [apiBase]
 *
 * Requires: API :3000 + demo provisioned (`pnpm demo:provision`).
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

const apiBase = (process.argv[2] ?? process.env.API_PUBLIC_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

const SHOWCASE_SLUGS = [
  "luxe-salon-spa",
  "bloom-beauty-dublin",
  "harbour-wellness-cork",
  "ink-anchor-galway",
  "clarity-medspa-dublin",
  "motion-physio-cork",
  "peak-fitness-dublin",
  "paws-parlour-dublin",
  "shine-studio-belfast",
];

const DEMO_GUEST_PHONE = "+353871000001";
const MAGIC_OTP = process.env.LIVIA_STAGING_GUEST_OTP_MAGIC?.trim() || "000000";

let failed = 0;

function fail(name, detail) {
  failed += 1;
  console.log(`  [FAIL] ${name} — ${detail}`);
}

function pass(name, detail = "") {
  console.log(`  [OK] ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log(`\nGuest hub smoke @ ${apiBase}\n`);

try {
  const health = await fetch(`${apiBase}/api/healthz`);
  if (!health.ok) fail("healthz", String(health.status));
  else pass("healthz");
} catch (err) {
  fail("healthz", err instanceof Error ? err.message : String(err));
}

let shopsOk = 0;
for (const slug of SHOWCASE_SLUGS) {
  try {
    const res = await fetch(`${apiBase}/api/public/b/${slug}`);
    if (!res.ok) {
      fail(`public book ${slug}`, String(res.status));
      continue;
    }
    const body = await res.json();
    if (!body?.business?.slug) {
      fail(`public book ${slug}`, "missing business.slug");
      continue;
    }
    shopsOk += 1;
    pass(`public book ${slug}`);
  } catch (err) {
    fail(`public book ${slug}`, err instanceof Error ? err.message : String(err));
  }
}

if (shopsOk < SHOWCASE_SLUGS.length) {
  console.log(`\n  [INFO] Only ${shopsOk}/${SHOWCASE_SLUGS.length} showcase slugs — run pnpm demo:provision\n`);
}

try {
  const otpReq = await fetch(`${apiBase}/api/public/guest-hub/otp/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone: DEMO_GUEST_PHONE, country: "IE" }),
  });
  if (!otpReq.ok) {
    fail("guest-hub otp/request", await otpReq.text());
  } else {
    const { sessionToken, magicOtpCode, devOtp } = await otpReq.json();
    const code = devOtp ?? magicOtpCode ?? MAGIC_OTP;
    const verify = await fetch(`${apiBase}/api/public/guest-hub/otp/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionToken, code }),
    });
    if (!verify.ok) {
      fail("guest-hub otp/verify", await verify.text());
    } else {
      const verified = await verify.json();
      const hubToken = verified.hubToken ?? verified.token;
      if (!hubToken) {
        fail("guest-hub otp/verify", "missing hubToken");
      } else {
        const me = await fetch(`${apiBase}/api/public/guest-hub/me`, {
          headers: { "X-Guest-Hub-Token": hubToken },
        });
        if (!me.ok) {
          fail("guest-hub /me", await me.text());
        } else {
          const view = await me.json();
          const shopCount = Array.isArray(view.shops) ? view.shops.length : 0;
          if (shopCount < 7) {
            fail(
              "guest-hub /me shops",
              `expected ≥7 linked shops, got ${shopCount} — run pnpm demo:sync-guest-hub (or POST /api/demo/sync-guest-hub)`,
            );
          } else {
            pass("guest-hub /me", `${shopCount} shops linked`);
          }
        }
      }
    }
  }
} catch (err) {
  fail("guest-hub flow", err instanceof Error ? err.message : String(err));
}

if (failed) {
  console.log(`\n${failed} check(s) failed.\n`);
} else {
  console.log("\nAll guest hub checks passed.\n");
}
process.exitCode = failed ? 1 : 0;
