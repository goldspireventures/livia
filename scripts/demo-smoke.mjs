/**
 * Pre-demo smoke checks — run from repo root after `pnpm run dev:api`.
 * Usage: node scripts/demo-smoke.mjs [baseUrl]
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

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");

const checks = [
  { name: "healthz", path: "/api/healthz", expect: 200 },
  { name: "onboarding catalog (no auth)", path: "/api/onboarding/catalog", expect: 401 },
  { name: "dev seed (no auth)", path: "/api/dev/seed", method: "POST", expect: 401 },
  { name: "me businesses (no auth)", path: "/api/me/businesses", expect: 401 },
];

let failed = 0;

console.log(`\nDemo smoke @ ${base}\n`);

for (const c of checks) {
  try {
    const res = await fetch(`${base}${c.path}`, { method: c.method ?? "GET" });
    const ok = res.status === c.expect;
    const mark = ok ? "OK" : "FAIL";
    if (!ok) failed += 1;
    console.log(`  [${mark}] ${c.name} — ${res.status} (expected ${c.expect})`);
  } catch (err) {
    failed += 1;
    console.log(`  [FAIL] ${c.name} — ${err instanceof Error ? err.message : String(err)}`);
  }
}

if (!process.env.DATABASE_URL) {
  console.log("  [SKIP] database — set DATABASE_URL in .env to verify schema");
} else {
  console.log("  [INFO] database — run pnpm run db:push if seed returns 500");
}

if (failed) {
  console.log(`\n${failed} check(s) failed.\n`);
} else {
  console.log("\nAll checks passed.\n");
}
process.exitCode = failed ? 1 : 0;
