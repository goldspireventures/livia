#!/usr/bin/env node
const base = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

async function post(path) {
  const res = await fetch(`${base}${path}`, { method: "POST" });
  return { ok: res.ok, status: res.status, body: res.ok ? await res.json() : await res.text() };
}

try {
  const st = await fetch(`${base}/api/demo/status`);
  const status = st.ok ? await st.json() : null;
  const count = status?.businesses?.length ?? 0;

  if (status?.provisioned) {
    const sync = await post("/api/demo/sync-vertical-showcase");
    if (sync.ok) {
      console.log(
        `Demo provisioned — showcase synced (${sync.body.businesses?.length ?? count} shops touched)`,
      );
      process.exit(0);
    }
    console.warn(`Vertical sync failed (${sync.status}) — continuing with existing demo`);
    process.exit(0);
  }

  if (count > 0 && status?.businesses?.some((b) => b.slug === "aurora-studio")) {
    const repair = await post("/api/demo/repair-db");
    if (repair.ok) {
      console.log(`Demo repaired (${repair.body.businesses?.length ?? count} businesses)`);
      const sync = await post("/api/demo/sync-vertical-showcase");
      if (sync.ok) {
        console.log(`Subvertical showcase synced (${sync.body.businesses?.length ?? "?"} shops)`);
      }
      process.exit(0);
    }
  }

  const prov = await post("/api/demo/provision");
  if (prov.ok) {
    console.log("Demo provisioned");
    process.exit(0);
  }

  console.warn(`Provision failed (${prov.status}) — trying repair-db without new Clerk users`);
  const repair = await post("/api/demo/repair-db");
  if (repair.ok) {
    console.log(`Demo repaired (${repair.body.businesses?.length ?? "?"} businesses)`);
    await post("/api/demo/sync-vertical-showcase");
    process.exit(0);
  }

  console.error(`Provision failed: ${prov.status} ${prov.body}`);
  console.error(`Repair failed: ${repair.status} ${repair.body}`);
  process.exit(1);
} catch (e) {
  console.error(`API unreachable at ${base}:`, e.message);
  process.exit(1);
}
