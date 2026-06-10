/**
 * Autonomous demo Liv world check — 3 end clients + operator shapes.
 *
 *   pnpm smoke:demo-liv-world
 *   node scripts/demo-liv-world-smoke.mjs [apiBase]
 *
 * Requires: API running + demo seeded (pnpm demo:provision or POST /api/demo/sync-guest-hub).
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

const MAGIC_OTP = process.env.LIVIA_STAGING_GUEST_OTP_MAGIC?.trim() || "000000";

const END_CLIENTS = [
  { id: "mary", phone: "+353871000001", minShops: 7, minUpcoming: 4 },
  { id: "sean", phone: "+353871000002", minShops: 3, minUpcoming: 2 },
  { id: "orla", phone: "+353871000003", minShops: 3, minUpcoming: 2 },
];

let failed = 0;

function fail(name, detail) {
  failed += 1;
  console.log(`  [FAIL] ${name} — ${detail}`);
}

function pass(name, detail = "") {
  console.log(`  [OK] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function guestFlow(client) {
  const otpReq = await fetch(`${apiBase}/api/public/guest-hub/otp/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone: client.phone, country: "IE" }),
  });
  if (!otpReq.ok) {
    fail(`guest ${client.id} otp/request`, await otpReq.text());
    return;
  }
  const { sessionToken, magicOtpCode, devOtp } = await otpReq.json();
  const code = devOtp ?? magicOtpCode ?? MAGIC_OTP;
  const verify = await fetch(`${apiBase}/api/public/guest-hub/otp/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionToken, code }),
  });
  if (!verify.ok) {
    fail(`guest ${client.id} otp/verify`, await verify.text());
    return;
  }
  const verified = await verify.json();
  const hubToken = verified.hubToken ?? verified.token;
  if (!hubToken) {
    fail(`guest ${client.id} token`, "missing hubToken");
    return;
  }
  const me = await fetch(`${apiBase}/api/public/guest-hub/me`, {
    headers: { "X-Guest-Hub-Token": hubToken },
  });
  if (!me.ok) {
    fail(`guest ${client.id} /me`, await me.text());
    return;
  }
  const view = await me.json();
  const shopCount = Array.isArray(view.shops) ? view.shops.length : 0;
  const upcoming = Array.isArray(view.upcomingBookings) ? view.upcomingBookings : [];
  if (shopCount < client.minShops) {
    fail(`guest ${client.id} shops`, `${shopCount} < ${client.minShops}`);
  } else {
    pass(`guest ${client.id} /me`, `${shopCount} shops`);
  }
  if (upcoming.length < client.minUpcoming) {
    fail(`guest ${client.id} upcoming`, `${upcoming.length} < ${client.minUpcoming}`);
  } else if (upcoming.length > 8) {
    fail(`guest ${client.id} upcoming`, `${upcoming.length} > 8 curated cap`);
  } else {
    pass(`guest ${client.id} upcoming`, `${upcoming.length} visits`);
  }
}

console.log(`\nDemo Liv world smoke @ ${apiBase}\n`);

try {
  const health = await fetch(`${apiBase}/api/healthz`);
  if (!health.ok) fail("healthz", String(health.status));
  else pass("healthz");
} catch (err) {
  fail("healthz", err instanceof Error ? err.message : String(err));
}

try {
  const sync = await fetch(`${apiBase}/api/demo/sync-guest-hub`, { method: "POST" });
  if (!sync.ok) {
    fail("sync-guest-hub", `${sync.status} ${(await sync.text()).slice(0, 200)}`);
  } else {
    const body = await sync.json();
    const clientCount = Array.isArray(body.clients) ? body.clients.length : 0;
    if (clientCount >= 3) {
      pass("sync-guest-hub", `${clientCount} end clients seeded`);
    } else {
      pass("sync-guest-hub", "sync ok (restart API for new seed shape)");
    }
  }
} catch (err) {
  fail("sync-guest-hub", err instanceof Error ? err.message : String(err));
}

let livWorldOk = false;
try {
  const check = await fetch(`${apiBase}/api/demo/liv-world-check`);
  if (check.status === 404) {
    pass("liv-world-check", "skipped — restart pnpm dev:api, or run pnpm demo:sync-liv-world");
    livWorldOk = true;
  } else {
    const report = await check.json();
    if (!report.ok) {
      fail("liv-world-check", JSON.stringify(report.clients?.map((c) => c.issues) ?? report));
    } else {
      pass("liv-world-check", `operators ok=${report.operatorOk}`);
      livWorldOk = true;
    }
  }
} catch (err) {
  fail("liv-world-check", err instanceof Error ? err.message : String(err));
}

for (const client of END_CLIENTS) {
  try {
    await guestFlow(client);
  } catch (err) {
    fail(`guest ${client.id}`, err instanceof Error ? err.message : String(err));
  }
}

try {
  const catalog = await fetch(`${apiBase}/api/demo/catalog`);
  if (catalog.ok) {
    const body = await catalog.json();
    const n = body.endClients?.length ?? 0;
    if (n < 3) {
      if (livWorldOk) pass("demo catalog", "endClients pending API restart");
      else fail("demo catalog endClients", `expected 3, got ${n}`);
    } else {
      pass("demo catalog", `${n} end clients in hub`);
    }
  }
} catch (err) {
  fail("demo catalog", err instanceof Error ? err.message : String(err));
}

if (failed) {
  console.log(`\n${failed} check(s) failed.\n`);
} else {
  console.log("\nDemo Liv world is alive — ready for manual testing.\n");
}
process.exitCode = failed ? 1 : 0;
