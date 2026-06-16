/**
 * Post-start platform smoke — API contracts + demo world + parity probes.
 * Usage: node --env-file=.env scripts/platform-smoke.mjs [apiBase]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const base = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const REQUIRED_PUBLIC_SLUGS = [
  "aurora-studio",
  "conors-cut-co",
  "london-rose-spa",
  "berlin-studio-neun",
  "paris-belle-vue",
  "clarity-medspa-dublin",
  "paws-parlour-dublin",
];

let failed = 0;
function pass(label) {
  console.log(`  [OK] ${label}`);
}
function fail(label, detail) {
  failed += 1;
  console.log(`  [FAIL] ${label} — ${detail}`);
}

console.log(`\nPlatform smoke @ ${base}\n`);

try {
  const hz = await fetch(`${base}/api/healthz`);
  if (hz.ok) pass("healthz");
  else fail("healthz", String(hz.status));
} catch (e) {
  fail("healthz", e instanceof Error ? e.message : String(e));
  console.log("\nStart API: pnpm dev:api\n");
  process.exit(1);
}

try {
  const st = await fetch(`${base}/api/demo/status`);
  if (!st.ok) fail("demo/status", String(st.status));
  else {
    const body = await st.json();
    if (body.provisioned) pass(`demo provisioned (${body.businesses?.length ?? 0} shops in status)`);
    else fail("demo provisioned", "false — run: pnpm demo:provision");
  }
} catch (e) {
  fail("demo/status", e instanceof Error ? e.message : String(e));
}

for (const slug of REQUIRED_PUBLIC_SLUGS) {
  try {
    const res = await fetch(`${base}/api/public/b/${slug}`);
    if (res.ok) {
      const b = await res.json();
      pass(`public /b/${slug} (${b.name})`);
      if (slug === "london-rose-spa" && b.country !== "GB") {
        fail("public country field", `got ${b.country ?? "undefined"} — restart API after pull`);
      }
    } else fail(`public /b/${slug}`, String(res.status));
  } catch (e) {
    fail(`public /b/${slug}`, e instanceof Error ? e.message : String(e));
  }
}

try {
  const unauth = await fetch(`${base}/api/me/businesses`);
  if (unauth.status === 401) pass("me/businesses requires auth");
  else fail("me/businesses auth", `expected 401 got ${unauth.status}`);
} catch (e) {
  fail("me/businesses auth", e instanceof Error ? e.message : String(e));
}

try {
  const st = await fetch(`${base}/api/demo/status`);
  if (st.ok) {
    const body = await st.json();
    if (body.channels?.whatsappConfigured && body.channels?.whatsappThreads > 0) {
      pass(`demo channels (WA threads=${body.channels.whatsappThreads})`);
    } else if (body.provisioned) {
      fail("demo channels", "re-run pnpm demo:provision for WhatsApp/IG stack");
    }
  }
} catch (e) {
  fail("demo channels", e instanceof Error ? e.message : String(e));
}

try {
  const balance = await fetch(`${base}/api/demo/guest-surfaces/luxe-salon-spa/balance`);
  if (balance.ok) {
    const b = await balance.json();
    const view = await fetch(`${base}/api/public/b/luxe-salon-spa/balance/${b.token}`);
    if (view.ok) {
      const payload = await view.json();
      if ((payload.balanceDueMinor ?? 0) > 0) {
        pass(`guest balance token (due €${((payload.balanceDueMinor ?? 0) / 100).toFixed(2)})`);
      } else fail("guest balance due", "balanceDueMinor is 0");
    } else fail("guest balance view", String(view.status));
  } else if (balance.status === 404) {
    fail("guest balance token", "404 — re-run pnpm demo:provision");
  } else fail("guest balance token", String(balance.status));
} catch (e) {
  fail("guest balance token", e instanceof Error ? e.message : String(e));
}

try {
  const pay = await fetch(`${base}/api/demo/guest-surfaces/luxe-salon-spa/pay`);
  if (pay.ok) pass("guest deposit pay token");
  else if (pay.status === 404) fail("guest deposit pay token", "404 — re-run pnpm demo:provision");
  else fail("guest deposit pay token", String(pay.status));
} catch (e) {
  fail("guest deposit pay token", e instanceof Error ? e.message : String(e));
}

const opsSecret = process.env.INTERNAL_OPS_SECRET ?? "";
if (opsSecret) {
  try {
    const mon = await fetch(`${base}/api/internal/ops/monitoring/overview`, {
      headers: {
        "X-Internal-Ops-Secret": opsSecret,
        "X-Internal-Ops-Operator": "smoke@livia.io",
        "X-Internal-Ops-Role": "engineer",
      },
    });
    if (mon.ok) pass("internal monitoring overview");
    else fail("internal monitoring overview", String(mon.status));
  } catch (e) {
    fail("internal monitoring overview", e instanceof Error ? e.message : String(e));
  }
}

console.log(failed ? `\n${failed} check(s) failed.\n` : "\nAll platform smoke checks passed.\n");
process.exitCode = failed ? 1 : 0;
