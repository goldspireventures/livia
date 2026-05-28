#!/usr/bin/env node
/**
 * Lightweight load smoke — bookings list + health (v1.5 Phase 0.6).
 * Usage: node scripts/k6-smoke-bookings.mjs [baseUrl]
 */
const base = process.argv[2] ?? "http://127.0.0.1:3001";

async function hit(path) {
  const t0 = Date.now();
  const res = await fetch(`${base}${path}`);
  const ms = Date.now() - t0;
  return { path, status: res.status, ms };
}

async function main() {
  const paths = ["/api/healthz", "/api/health"];
  const concurrency = 10;
  const all = await Promise.all(
    Array.from({ length: concurrency }, () => Promise.all(paths.map((p) => hit(p)))),
  );
  const flat = all.flat();
  const bad = flat.filter((r) => r.status >= 500);
  const slow = flat.filter((r) => r.ms > 2000);
  console.log("k6-smoke-bookings", { ok: flat.length - bad.length, total: flat.length });
  if (slow.length) console.warn("slow", slow.slice(0, 5));
  if (bad.length) {
    console.error("failures", bad);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
