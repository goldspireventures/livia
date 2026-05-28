/**
 * Livia Wargame Simulator — max-max-maximum version.
 *
 * Coverage layers:
 *   L0 — health + demo discovery
 *   L1 — public-facing (booking page, public availability, service listings)
 *   L2 — SMS inbound webhook (waitlist YES, reschedule, complaint, freeform)
 *   L3 — authenticated operator (inbox, my-day, bookings CRUD, packages, proposals, staff)
 *   L4 — AI path probes (send simulated inbound, check Liv proposals surface)
 *   L5 — billing + entitlements contract probes
 *
 * Token model:
 *   Calls /api/dev/sim-token to mint a HMAC-signed dev bearer per business.
 *   Injected as X-Sim-Token header; simAuthMiddleware resolves userId from it.
 *
 * Usage:
 *   node scripts/wargame-sim.mjs [apiBase] [tenants] [days] [concurrency]
 *   node scripts/wargame-sim.mjs http://127.0.0.1:3001 6 14 20
 *
 * Requires:
 *   - API running at apiBase (pnpm dev:api)
 *   - Demo provisioned (pnpm demo:provision)
 *
 * Output: structured report to stdout + wargame-report.json in cwd.
 */

import { writeFileSync } from "node:fs";

const apiBase = (process.argv[2] ?? process.env.E2E_API_BASE ?? "http://127.0.0.1:3001").replace(/\/+$/, "");
const tenantCount = Math.max(1, Number(process.argv[3] ?? 6));
const days = Math.max(1, Number(process.argv[4] ?? 14));
const concurrency = Math.max(1, Number(process.argv[5] ?? 20));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pct = (n, d) => (!d ? "0%" : `${Math.round((n / d) * 1000) / 10}%`);
const rand6 = () => Math.floor(Math.random() * 9_000_000) + 1_000_000;
const quantile = (s, q) => {
  if (!s.length) return 0;
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(s.length * q)))];
};

const FIRST_NAMES = ["Aisling", "Ciarán", "Niamh", "Fionn", "Siobhán", "Darragh", "Aoife", "Seán"];
const LAST_NAMES = ["Murphy", "Kelly", "O'Brien", "Walsh", "Byrne", "Ryan", "O'Connor", "McCarthy"];
const randName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const randPhone = () => `+35387${rand6()}`;
const randEmail = () => `sim${rand6()}@liviatest.invalid`;

// ─── HTTP helpers ───────────────────────────────────────────────────────────

const globalLatencies = { all: [], l1: [], l2: [], l3: [], l4: [], l5: [] };
const errors = [];
let total = 0;

const counters = {
  // L1 — public
  publicLoads: 0,
  publicServicesProbe: 0,
  publicAvailabilityProbe: 0,
  publicBookings: 0,
  // L2 — SMS
  inboundSms: 0,
  // L3 — operator
  myDayLoads: 0,
  inboxLoads: 0,
  bookingsListLoads: 0,
  bookingCreates: 0,
  bookingUpdateAttempts: 0,
  customersListLoads: 0,
  staffLoads: 0,
  packagesProbe: 0,
  // L4 — AI
  livProposalsLoaded: 0,
  livProposalApprovals: 0,
  metaInboundSimulated: 0,
  // L5 — billing
  billingProbe: 0,
};

async function fetchJson(path, init = {}, layer = "all") {
  const t0 = Date.now();
  total += 1;
  let res, text;
  try {
    res = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    text = await res.text();
  } catch (err) {
    const ms = Date.now() - t0;
    errors.push({ layer, where: path, status: 0, ms, body: String(err).slice(0, 200) });
    globalLatencies.all.push(ms);
    if (layer !== "all") globalLatencies[layer]?.push(ms);
    return { ok: false, status: 0, ms, text: String(err), json: null };
  }
  const ms = Date.now() - t0;
  globalLatencies.all.push(ms);
  if (layer !== "all") globalLatencies[layer]?.push(ms);
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* empty */ }
  if (!res.ok && res.status !== 401 && res.status !== 403 && res.status !== 404) {
    errors.push({ layer, where: path, status: res.status, ms, body: text.slice(0, 300) });
  }
  return { ok: res.ok, status: res.status, ms, text: text.slice(0, 800), json };
}

async function fetchForm(path, params) {
  const t0 = Date.now();
  total += 1;
  let res;
  try {
    res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    await res.text();
  } catch (err) {
    const ms = Date.now() - t0;
    errors.push({ layer: "l2", where: path, status: 0, ms, body: String(err).slice(0, 200) });
    globalLatencies.all.push(ms);
    globalLatencies.l2.push(ms);
    return { ok: false, status: 0, ms };
  }
  const ms = Date.now() - t0;
  globalLatencies.all.push(ms);
  globalLatencies.l2.push(ms);
  if (!res.ok && res.status !== 422) {
    errors.push({ layer: "l2", where: path, status: res.status, ms });
  }
  return { ok: res.ok, status: res.status, ms };
}

function authHeaders(token) {
  return token ? { "X-Sim-Token": token } : {};
}

// ─── Sim token cache ────────────────────────────────────────────────────────

const simTokenCache = new Map(); // businessId → token

async function getSimToken(businessId) {
  const cached = simTokenCache.get(businessId);
  if (cached) return cached;
  const r = await fetchJson("/api/dev/sim-token", {
    method: "POST",
    body: JSON.stringify({ businessId }),
  });
  if (r.ok && r.json?.token) {
    simTokenCache.set(businessId, r.json.token);
    return r.json.token;
  }
  return null;
}

// ─── Layer actions ──────────────────────────────────────────────────────────

async function l1_publicLoad(tenant) {
  counters.publicLoads++;
  await fetchJson(`/api/public/b/${tenant.slug}`, {}, "l1");
}

async function l1_publicServicesProbe(tenant) {
  counters.publicServicesProbe++;
  await fetchJson(`/api/public/b/${tenant.slug}/services`, {}, "l1");
}

async function l1_publicAvailabilityProbe(tenant) {
  counters.publicAvailabilityProbe++;
  const serviceIds = tenant.serviceIds ?? [];
  if (!serviceIds.length) {
    await fetchJson(`/api/public/b/${tenant.slug}`, {}, "l1");
    return;
  }
  const serviceId = pick(serviceIds);
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 14) + 1);
  const d = date.toISOString().slice(0, 10);
  await fetchJson(`/api/public/b/${tenant.slug}/availability?serviceId=${serviceId}&date=${d}`, {}, "l1");
}

async function l1_publicBooking(tenant) {
  counters.publicBookings++;
  const serviceIds = tenant.serviceIds ?? [];
  if (!serviceIds.length) {
    await fetchJson(`/api/public/b/${tenant.slug}`, {}, "l1");
    return;
  }
  const serviceId = pick(serviceIds);
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 14) + 1);
  const startAt = new Date(date);
  startAt.setHours(10 + Math.floor(Math.random() * 7), 0, 0, 0);
  await fetchJson(`/api/public/b/${tenant.slug}/bookings`, {
    method: "POST",
    body: JSON.stringify({
      serviceId,
      startAt: startAt.toISOString(),
      firstName: pick(FIRST_NAMES),
      lastName: pick(LAST_NAMES),
      email: randEmail(),
      phone: randPhone(),
    }),
  }, "l1");
}

async function l2_smsInbound(tenant) {
  counters.inboundSms++;
  const bodies = [
    "hi can i book tomorrow?",
    "YES",
    "YES",   // waitlist acceptance (weighted twice)
    "im running 10 minutes late",
    "can i reschedule to friday?",
    "refund please",
    "ok thanks",
    "what time is my appointment?",
    "hello",
    "cancel my booking",
  ];
  const p = new URLSearchParams();
  p.set("From", randPhone());
  p.set("To", tenant.phone ?? "+353100000000");
  p.set("Body", pick(bodies));
  p.set("MessageSid", `SM${Math.random().toString(16).slice(2)}`);
  await fetchForm("/api/channels/sms/inbound", p);
}

async function l3_myDay(tenant) {
  counters.myDayLoads++;
  const token = await getSimToken(tenant.id);
  if (!token) return;
  await fetchJson(`/api/businesses/${tenant.id}/my-day`, { headers: authHeaders(token) }, "l3");
}

async function l3_inboxLoad(tenant) {
  counters.inboxLoads++;
  const token = await getSimToken(tenant.id);
  if (!token) return;
  await fetchJson(`/api/businesses/${tenant.id}/conversations`, { headers: authHeaders(token) }, "l3");
}

async function l3_bookingsList(tenant) {
  counters.bookingsListLoads++;
  const token = await getSimToken(tenant.id);
  if (!token) return;
  await fetchJson(`/api/businesses/${tenant.id}/bookings`, { headers: authHeaders(token) }, "l3");
}

async function l3_bookingCreate(tenant) {
  counters.bookingCreates++;
  const token = await getSimToken(tenant.id);
  if (!token) return;
  const serviceIds = tenant.serviceIds ?? [];
  const staffIds = tenant.staffIds ?? [];
  if (!serviceIds.length || !staffIds.length) return;
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 21) + 1);
  const startAt = new Date(date);
  startAt.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
  await fetchJson(`/api/businesses/${tenant.id}/bookings`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      serviceId: pick(serviceIds),
      staffId: pick(staffIds),
      startAt: startAt.toISOString(),
      customerFirstName: pick(FIRST_NAMES),
      customerLastName: pick(LAST_NAMES),
      customerEmail: randEmail(),
      customerPhone: randPhone(),
    }),
  }, "l3");
}

async function l3_customersList(tenant) {
  counters.customersListLoads++;
  const token = await getSimToken(tenant.id);
  if (!token) return;
  await fetchJson(`/api/businesses/${tenant.id}/customers`, { headers: authHeaders(token) }, "l3");
}

async function l3_staffLoad(tenant) {
  counters.staffLoads++;
  const token = await getSimToken(tenant.id);
  if (!token) return;
  await fetchJson(`/api/businesses/${tenant.id}/staff`, { headers: authHeaders(token) }, "l3");
}

async function l3_packagesProbe(tenant) {
  counters.packagesProbe++;
  const token = await getSimToken(tenant.id);
  if (!token) return;
  await fetchJson(`/api/businesses/${tenant.id}/package-credits`, { headers: authHeaders(token) }, "l3");
}

async function l4_livProposalsLoad(tenant) {
  counters.livProposalsLoaded++;
  const token = await getSimToken(tenant.id);
  if (!token) return;
  const r = await fetchJson(`/api/businesses/${tenant.id}/liv-proposals`, { headers: authHeaders(token) }, "l4");
  if (!r.ok) return;
  const proposals = Array.isArray(r.json?.proposals) ? r.json.proposals : (Array.isArray(r.json) ? r.json : []);
  if (proposals.length > 0 && Math.random() < 0.15) {
    // Occasionally approve a proposal (15% chance per load).
    const p = pick(proposals);
    counters.livProposalApprovals++;
    await fetchJson(`/api/businesses/${tenant.id}/liv-proposals/${p.id}/approve`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({}),
    }, "l4");
  }
}

async function l4_metaInboundSim(tenant) {
  counters.metaInboundSimulated++;
  const token = await getSimToken(tenant.id);
  if (!token) return;
  const texts = ["book me in for next week", "yes please confirm", "any slots on thursday?", "thanks!"];
  await fetchJson("/api/dev/meta/inbound", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      businessId: tenant.id,
      channel: "WHATSAPP",
      from: randPhone(),
      text: pick(texts),
      displayName: randName(),
    }),
  }, "l4");
}

async function l5_billingProbe(tenant) {
  counters.billingProbe++;
  const token = await getSimToken(tenant.id);
  if (!token) return;
  await fetchJson(`/api/businesses/${tenant.id}/billing/subscription`, { headers: authHeaders(token) }, "l5");
}

// ─── Weighted action dispatcher ─────────────────────────────────────────────

async function doOne(tenant) {
  const r = Math.random();

  // Distribution (must sum to ~1):
  //   L1 public        35%
  //   L2 SMS inbound   20%
  //   L3 operator      30%
  //   L4 AI/proposals  10%
  //   L5 billing        5%

  if (r < 0.10) return l1_publicLoad(tenant);
  if (r < 0.17) return l1_publicServicesProbe(tenant);
  if (r < 0.22) return l1_publicAvailabilityProbe(tenant);
  if (r < 0.35) return l1_publicBooking(tenant);
  if (r < 0.55) return l2_smsInbound(tenant);
  if (r < 0.62) return l3_myDay(tenant);
  if (r < 0.70) return l3_inboxLoad(tenant);
  if (r < 0.74) return l3_bookingsList(tenant);
  if (r < 0.78) return l3_bookingCreate(tenant);
  if (r < 0.81) return l3_customersList(tenant);
  if (r < 0.83) return l3_staffLoad(tenant);
  if (r < 0.85) return l3_packagesProbe(tenant);
  if (r < 0.90) return l4_livProposalsLoad(tenant);
  if (r < 0.95) return l4_metaInboundSim(tenant);
  return l5_billingProbe(tenant);
}

// ─── Tenant enrichment ──────────────────────────────────────────────────────

async function enrichTenants(rawBusinesses, slugs) {
  const subset = slugs.slice(0, tenantCount);
  const tenants = rawBusinesses.filter((b) => subset.includes(b.slug));

  await Promise.all(tenants.map(async (t) => {
    const token = await getSimToken(t.id);
    if (!token) return;
    const h = authHeaders(token);

    const [svc, staff] = await Promise.all([
      fetchJson(`/api/businesses/${t.id}/services`, { headers: h }),
      fetchJson(`/api/businesses/${t.id}/staff`, { headers: h }),
    ]);

    t.serviceIds = Array.isArray(svc.json)
      ? svc.json.map((s) => s.id).filter(Boolean)
      : Array.isArray(svc.json?.services)
        ? svc.json.services.map((s) => s.id).filter(Boolean)
        : [];

    t.staffIds = Array.isArray(staff.json)
      ? staff.json.map((s) => s.id).filter(Boolean)
      : Array.isArray(staff.json?.staff)
        ? staff.json.staff.map((s) => s.id).filter(Boolean)
        : [];

    t.phone = "+353100000000"; // demo SMS routing
  }));

  return tenants;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${"═".repeat(52)}`);
  console.log(`  Livia Wargame Simulator — MAX VERSION`);
  console.log(`${"═".repeat(52)}`);
  console.log(`  API        : ${apiBase}`);
  console.log(`  Tenants    : ${tenantCount}`);
  console.log(`  Sim days   : ${days}`);
  console.log(`  Concurrency: ${concurrency}`);
  console.log(`${"═".repeat(52)}\n`);

  // L0 — health
  const health = await fetchJson("/api/healthz");
  if (!health.ok) {
    console.error(`✗ API not reachable (${health.status}). Start with: pnpm dev:api`);
    process.exit(1);
  }
  console.log(`✓ API healthy`);

  // L0 — discover demo businesses
  const status = await fetchJson("/api/demo/status");
  if (!status.ok) {
    console.error(`✗ /api/demo/status failed (${status.status}). Ensure NODE_ENV=development.`);
    process.exit(1);
  }
  const rawBusinesses = Array.isArray(status.json?.businesses) ? status.json.businesses : [];
  const slugs = rawBusinesses.map((b) => b.slug).filter(Boolean);
  if (!slugs.length) {
    console.error(`✗ No demo businesses. Run: pnpm demo:provision`);
    process.exit(1);
  }
  console.log(`✓ Found ${rawBusinesses.length} demo businesses`);

  // Enrich tenants with service/staff IDs for realistic payloads.
  process.stdout.write("  Enriching tenants...");
  const tenants = await enrichTenants(rawBusinesses, slugs);
  console.log(` done (${tenants.length} tenants, avg ${Math.round(tenants.reduce((a, t) => a + (t.serviceIds?.length ?? 0), 0) / Math.max(1, tenants.length))} services)\n`);

  if (!tenants.length) {
    console.error(`✗ No tenants after enrichment. Check demo provision.`);
    process.exit(1);
  }

  const ops = days * 500; // 500 ops/day — prod-realistic for a busy wargame week
  const rounds = Math.ceil(ops / concurrency);

  console.log(`Workload: ${ops.toLocaleString()} ops → ${rounds} rounds × ${concurrency} concurrent`);
  console.log(`Layers: L1=public, L2=SMS, L3=operator, L4=AI, L5=billing\n`);

  const reportEvery = Math.max(1, Math.floor(rounds / 10));
  for (let r = 0; r < rounds; r++) {
    const jobs = Array.from({ length: concurrency }, () => doOne(pick(tenants)));
    await Promise.all(jobs);
    if ((r + 1) % reportEvery === 0) {
      const progress = Math.round(((r + 1) / rounds) * 100);
      const errRate = pct(errors.length, total);
      const p50 = quantile([...globalLatencies.all].sort((a, b) => a - b), 0.5);
      process.stdout.write(`  [${progress}%] total=${total} errors=${errors.length}(${errRate}) p50=${p50}ms\n`);
    }
    // Brief micro-pause every 20 rounds to be kind to the local DB.
    if (r % 20 === 0) await sleep(25);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────
  const sortAll = [...globalLatencies.all].sort((a, b) => a - b);
  const layerStats = {};
  for (const [k, v] of Object.entries(globalLatencies)) {
    if (!v.length) continue;
    const s = [...v].sort((a, b) => a - b);
    layerStats[k] = {
      n: s.length,
      p50: quantile(s, 0.5),
      p95: quantile(s, 0.95),
      p99: quantile(s, 0.99),
      max: s[s.length - 1],
    };
  }

  const errorsByStatus = new Map();
  const errorsByLayer = new Map();
  for (const e of errors) {
    errorsByStatus.set(e.status, (errorsByStatus.get(e.status) ?? 0) + 1);
    errorsByLayer.set(e.layer, (errorsByLayer.get(e.layer) ?? 0) + 1);
  }

  console.log(`\n${"═".repeat(52)}`);
  console.log(`  REPORT`);
  console.log(`${"═".repeat(52)}`);
  console.log(`  Total requests : ${total.toLocaleString()}`);
  console.log(`  Errors         : ${errors.length} (${pct(errors.length, total)})`);
  console.log(`  p50 / p95 / p99: ${quantile(sortAll, 0.5)} / ${quantile(sortAll, 0.95)} / ${quantile(sortAll, 0.99)} ms`);
  console.log(`  max latency    : ${sortAll[sortAll.length - 1] ?? 0} ms`);

  console.log(`\n  Layer breakdown:`);
  for (const [k, v] of Object.entries(layerStats)) {
    if (k === "all") continue;
    console.log(`    ${k.padEnd(4)} n=${String(v.n).padStart(6)} p50=${String(v.p50).padStart(5)}ms p95=${String(v.p95).padStart(5)}ms p99=${String(v.p99).padStart(5)}ms max=${String(v.max).padStart(6)}ms`);
  }

  console.log(`\n  Op mix:`);
  const mix = {
    "L1 public loads": counters.publicLoads,
    "L1 services probe": counters.publicServicesProbe,
    "L1 availability probe": counters.publicAvailabilityProbe,
    "L1 public booking": counters.publicBookings,
    "L2 SMS inbound": counters.inboundSms,
    "L3 my-day": counters.myDayLoads,
    "L3 inbox": counters.inboxLoads,
    "L3 bookings list": counters.bookingsListLoads,
    "L3 booking create": counters.bookingCreates,
    "L3 customers": counters.customersListLoads,
    "L3 staff": counters.staffLoads,
    "L3 packages": counters.packagesProbe,
    "L4 proposals load": counters.livProposalsLoaded,
    "L4 proposal approve": counters.livProposalApprovals,
    "L4 meta inbound sim": counters.metaInboundSimulated,
    "L5 billing probe": counters.billingProbe,
  };
  for (const [k, v] of Object.entries(mix)) {
    if (!v) continue;
    console.log(`    ${k.padEnd(26)}: ${String(v).padStart(5)}`);
  }

  if (errors.length > 0) {
    console.log(`\n  Error status counts:`);
    for (const [k, v] of [...errorsByStatus.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    HTTP ${k}: ${v}`);
    }
    console.log(`\n  Errors by layer:`);
    for (const [k, v] of [...errorsByLayer.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${k}: ${v}`);
    }
    console.log(`\n  First 10 error samples:`);
    for (const e of errors.slice(0, 10)) {
      console.log(`    [${e.layer}] ${e.where} → ${e.status} ${(e.body ?? "").slice(0, 120)}`);
    }
  }

  // ─── Write JSON report ────────────────────────────────────────────────────
  const report = {
    generatedAt: new Date().toISOString(),
    apiBase,
    config: { tenantCount, days, concurrency },
    summary: {
      total,
      errors: errors.length,
      errorRate: pct(errors.length, total),
      latency: { p50: quantile(sortAll, 0.5), p95: quantile(sortAll, 0.95), p99: quantile(sortAll, 0.99), max: sortAll[sortAll.length - 1] ?? 0 },
    },
    layers: layerStats,
    opMix: mix,
    errorsByStatus: Object.fromEntries(errorsByStatus),
    errorsByLayer: Object.fromEntries(errorsByLayer),
    errorSamples: errors.slice(0, 50),
  };

  const reportPath = "wargame-report.json";
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  Report written → ${reportPath}`);

  // ─── Verdict ──────────────────────────────────────────────────────────────
  const errPct = (errors.length / total) * 100;
  const p95 = quantile(sortAll, 0.95);
  console.log(`\n${"═".repeat(52)}`);
  if (errPct < 1 && p95 < 1500) {
    console.log(`  VERDICT: ✅ GREEN — production-ready kernel`);
    console.log(`  Error rate ${pct(errors.length, total)} < 1%, p95 ${p95}ms < 1500ms`);
  } else if (errPct < 5 && p95 < 3000) {
    console.log(`  VERDICT: 🟡 AMBER — needs attention before launch`);
    console.log(`  Error rate ${pct(errors.length, total)}, p95 ${p95}ms`);
  } else {
    console.log(`  VERDICT: 🔴 RED — blocking issues present`);
    console.log(`  Error rate ${pct(errors.length, total)}, p95 ${p95}ms`);
  }
  console.log(`${"═".repeat(52)}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
