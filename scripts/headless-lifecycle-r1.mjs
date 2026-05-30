#!/usr/bin/env node
/**
 * R1 headless lifecycle — prospect API → demo wedge → public book surfaces.
 *
 *   node scripts/headless-lifecycle-r1.mjs
 *   node scripts/headless-lifecycle-r1.mjs --api http://127.0.0.1:3000
 *
 * Prereqs: API running; demo provisioned for full vertical pass.
 * Slugs mirror e2e/fixtures/vertical-shops.ts (vertical showcase).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const apiIdx = args.indexOf("--api");
const apiBase = (apiIdx >= 0 ? args[apiIdx + 1] : process.env.E2E_API_BASE ?? "http://127.0.0.1:3000").replace(
  /\/+$/,
  "",
);

/** Canonical demo slugs — sync with e2e/fixtures/vertical-shops.ts */
const DEMO_SLUGS = [
  "luxe-salon-spa",
  "bloom-beauty-dublin",
  "motion-physio-cork",
  "clarity-medspa-dublin",
  "ink-anchor-galway",
  "harbour-wellness-cork",
  "paws-parlour-dublin",
  "peak-fitness-dublin",
  "shine-studio-belfast",
];

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m && process.env[m[1].trim()] === undefined) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

async function check(label, url, expectOk = true) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const ok = expectOk ? r.ok : r.status < 500;
    console.log(`${ok ? "✓" : "✗"} ${label} — ${r.status} ${url}`);
    return ok;
  } catch (e) {
    console.log(`✗ ${label} — ${e instanceof Error ? e.message : "failed"}`);
    return false;
  }
}

async function checkSignInBusiness() {
  const url = `${apiBase}/api/demo/sign-in-business`;
  const body = JSON.stringify({ slug: "luxe-salon-spa" });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const signIn = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(30_000),
      });
      const payload = signIn.ok ? await signIn.json() : null;
      const ticketOk =
        signIn.ok && Boolean(payload && typeof payload === "object" && "token" in payload && payload.token);
      console.log(`${ticketOk ? "✓" : "✗"} Demo owner ticket (sign-in-business) — ${signIn.status}`);
      if (ticketOk) return true;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      console.log(
        `✗ Demo owner ticket (attempt ${attempt}/3) — ${e instanceof Error ? e.message : "failed"}`,
      );
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return false;
}

loadEnv();

console.log(`\n▶ R1 headless lifecycle (API ${apiBase})\n`);

let ok = true;
ok = (await check("API health", `${apiBase}/api/healthz`)) && ok;
ok = (await check("Wedge demo catalog", `${apiBase}/api/public/wedge-demo`)) && ok;
ok =
  (await check("Wedge interstitial hair", `${apiBase}/api/public/wedge-demo/hair`)) && ok;

const prov = spawnSync("node", ["scripts/provision-demo-if-needed.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, E2E_API_BASE: apiBase },
});
if (prov.status !== 0) {
  console.warn("⚠ Demo provision skipped or failed — vertical /b checks may fail");
}

ok = (await checkSignInBusiness()) && ok;

for (const slug of DEMO_SLUGS) {
  const pass = await check(`Public /b ${slug}`, `${apiBase}/api/public/b/${slug}`);
  ok = pass && ok;
}

// One visit-token round-trip (E6 API smoke)
try {
  const bizRes = await fetch(`${apiBase}/api/public/b/luxe-salon-spa`, { signal: AbortSignal.timeout(12000) });
  if (bizRes.ok) {
    const biz = await bizRes.json();
    const serviceId = biz?.services?.[0]?.id;
    if (serviceId) {
      const day = new Date();
      day.setDate(day.getDate() + 10);
      const date = day.toISOString().split("T")[0];
      const slotsRes = await fetch(
        `${apiBase}/api/public/b/luxe-salon-spa/slots?serviceId=${serviceId}&date=${date}`,
        { signal: AbortSignal.timeout(12000) },
      );
      if (slotsRes.ok) {
        const slotPayload = await slotsRes.json();
        const slots = slotPayload?.slots;
        const slot = Array.isArray(slots) ? slots.find((s) => s?.available) : undefined;
        if (slot?.startAt) {
          const book = await fetch(`${apiBase}/api/public/b/luxe-salon-spa/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              serviceId,
              startAt: slot.startAt,
              customerFirstName: "Headless",
              customerLastName: "Visit",
              customerEmail: `headless-visit-${Date.now()}@test.livia.local`,
            }),
            signal: AbortSignal.timeout(30000),
          });
          if (book.ok) {
            const booked = await book.json();
            if (booked?.guestToken) {
              const visitPass = await check(
                "Visit token API",
                `${apiBase}/api/public/b/luxe-salon-spa/visit/${booked.guestToken}`,
              );
              ok = visitPass && ok;
            }
          }
        }
      }
    }
  }
} catch (e) {
  console.log(`✗ Visit token API — ${e instanceof Error ? e.message : "failed"}`);
  ok = false;
}

console.log(ok ? "\n✓ R1 headless lifecycle passed\n" : "\n✗ R1 headless lifecycle had failures\n");
process.exit(ok ? 0 : 1);
