/**
 * Flood / stress the public API surface (concurrent bursts).
 * Usage: node scripts/stress-flood.mjs [apiBase] [rounds] [concurrency]
 */
const base = (process.argv[2] ?? "http://127.0.0.1:3001").replace(/\/+$/, "");
const rounds = Number(process.argv[3] ?? 5);
const concurrency = Number(process.argv[4] ?? 12);
const slug = process.env.E2E_DEMO_SLUG ?? "aurora-galway";

const paths = [
  () => fetch(`${base}/api/healthz`),
  () => fetch(`${base}/api/demo/status`),
  () => fetch(`${base}/api/public/b/${slug}`),
  () => fetch(`${base}/api/public/b/aurora-studio`),
  () => fetch(`${base}/api/public/b/clarity-medspa-dublin`),
  () => fetch(`${base}/api/me/businesses`),
  () => fetch(`${base}/api/onboarding/catalog`),
];

async function burst(round) {
  const jobs = Array.from({ length: concurrency }, (_, i) => {
    const fn = paths[i % paths.length];
    const t0 = Date.now();
    return fn()
      .then((res) => ({
        round,
        i,
        status: res.status,
        ms: Date.now() - t0,
        ok: res.status > 0 && res.status < 500,
      }))
      .catch((err) => ({
        round,
        i,
        status: 0,
        ms: Date.now() - t0,
        ok: false,
        err: String(err),
      }));
  });
  return Promise.all(jobs);
}

console.log(`\nStress flood → ${base}`);
console.log(`${rounds} rounds × ${concurrency} concurrent (${paths.length} endpoint templates)\n`);

let failed = 0;
const latencies = [];

for (let r = 1; r <= rounds; r++) {
  const results = await burst(r);
  for (const row of results) {
    latencies.push(row.ms);
    if (!row.ok) failed += 1;
    const tag = row.ok ? "OK" : "FAIL";
    console.log(`  [${tag}] r${row.round} #${row.i} ${row.status} ${row.ms}ms`);
  }
}

latencies.sort((a, b) => a - b);
const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
const max = latencies[latencies.length - 1] ?? 0;

console.log(`\nLatency ms — p50: ${p50}, p95: ${p95}, max: ${max}`);
console.log(
  failed === 0
    ? `\n✓ ${rounds * concurrency} requests, all < 500\n`
    : `\n✗ ${failed} request(s) returned 5xx or network error\n`,
);
process.exit(failed > 0 ? 1 : 0);
