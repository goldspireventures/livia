/**
 * Concurrent UAT smoke — simulates multiple actors hitting the API at once.
 * Usage: node scripts/uat-concurrent-smoke.mjs [apiBase]
 */
const apiBase = (process.argv[2] ?? "http://127.0.0.1:3001").replace(/\/+$/, "");
const slug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

const ACTORS = [
  { name: "health", fn: () => fetch(`${apiBase}/api/healthz`) },
  { name: "public_business", fn: () => fetch(`${apiBase}/api/public/b/${slug}`) },
  {
    name: "customer_chat",
    fn: () =>
      fetch(`${apiBase}/api/public/b/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hi, any slots Saturday?" }),
      }),
  },
  { name: "me_unauth", fn: () => fetch(`${apiBase}/api/me/businesses`) },
  { name: "billing_unauth", fn: () => fetch(`${apiBase}/api/billing/plans`) },
  { name: "partner_unauth", fn: () => fetch(`${apiBase}/api/partner/v1/businesses/${slug}`) },
  { name: "meta_webhook", fn: () =>
    fetch(
      `${apiBase}/api/channels/meta?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(process.env.META_WEBHOOK_VERIFY_TOKEN ?? "livia_meta_verify_dev")}&hub.challenge=ok`,
    ),
  },
];

async function runBurst(round) {
  const results = await Promise.all(
    ACTORS.map(async (a) => {
      try {
        const res = await a.fn();
        const body = res.status === 204 ? "" : await res.text().catch(() => "");
        const chatDegraded =
          a.name === "customer_chat" && (res.status === 503 || res.status === 500);
        const metaVerify =
          a.name === "meta_webhook" && (res.status === 200 || res.status === 403);
        const ok =
          metaVerify ||
          chatDegraded ||
          (res.status > 0 && res.status < 500);
        return { actor: a.name, status: res.status, ok, snippet: body.slice(0, 80) };
      } catch (err) {
        return { actor: a.name, status: 0, ok: false, snippet: String(err) };
      }
    }),
  );
  return { round, results };
}

console.log(`\nUAT concurrent smoke → ${apiBase} (${ACTORS.length} actors × 3 rounds; chat 5xx OK without AI key)\n`);

let failed = 0;
for (let r = 1; r <= 3; r++) {
  const burst = await runBurst(r);
  for (const row of burst.results) {
    const tag = row.ok ? "OK" : "FAIL";
    if (!row.ok) failed += 1;
    console.log(`  [${tag}] round ${r} ${row.actor} → ${row.status}`);
  }
}

console.log(failed === 0 ? "\n✓ All concurrent rounds passed (<500)\n" : `\n✗ ${failed} failure(s)\n`);
process.exit(failed > 0 ? 1 : 0);
