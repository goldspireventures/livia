#!/usr/bin/env node
const base = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
try {
  const st = await fetch(`${base}/api/demo/status`);
  const status = st.ok ? await st.json() : null;
  if (status?.provisioned) {
    const sync = await fetch(`${base}/api/demo/sync-vertical-showcase`, { method: "POST" });
    if (sync.ok) {
      const body = await sync.json();
      console.log(`Demo provisioned — vertical showcase synced (${body.businesses?.length ?? "?"} shops)`);
      process.exit(0);
    }
    console.warn(`Vertical sync failed (${sync.status}) — continuing with existing demo`);
    process.exit(0);
  }
  const prov = await fetch(`${base}/api/demo/provision`, { method: "POST" });
  if (prov.ok) {
    console.log("Demo provisioned");
    process.exit(0);
  }
  console.error(`Provision failed: ${prov.status}`);
  process.exit(1);
} catch (e) {
  console.error(`API unreachable at ${base}:`, e.message);
  process.exit(1);
}
