#!/usr/bin/env node
/** POST /api/demo/sync-clerk — used by e2e-prep (Windows-safe vs inline node -e). */
const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

try {
  const res = await fetch(`${apiBase}/api/demo/sync-clerk`, { method: "POST" });
  const j = await res.json().catch(() => ({}));
  console.log("sync-clerk", res.status, j);
  if (!res.ok) process.exit(1);
} catch {
  console.warn("sync-clerk skipped — start API first (pnpm dev:api)");
  process.exit(1);
}
