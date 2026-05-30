#!/usr/bin/env node
/**
 * Stop stale dev ports, start full local platform, provision demo, print entry URLs.
 *
 *   node scripts/start-platform-for-test.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyLiviaApi } from "./lib/verify-livia-api.mjs";
import { clerkAlignmentEnv, clerkInstanceLabel, readDashboardClerkPublishableKey } from "./lib/clerk-env-alignment.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const ports = [3000, 5173, 5174, 5175];

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

function stopPort(port) {
  if (isWin) {
    spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`,
      ],
      { stdio: "ignore" },
    );
  } else {
    spawnSync("sh", ["-c", `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`], { stdio: "ignore" });
  }
}

function start(script, extraEnv = {}) {
  const child = spawn(isWin ? "pnpm.cmd" : "pnpm", ["run", script], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    shell: isWin,
    env: { ...process.env, NODE_ENV: "development", ...extraEnv },
  });
  child.unref();
  return child.pid;
}

async function waitHttp(url, label, attempts = 50) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok || res.status < 500) {
        console.log(`  ✓ ${label}`);
        return true;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log(`  ✗ ${label} — check logs`);
  return false;
}

async function waitLiviaApi(attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    const v = await verifyLiviaApi("http://127.0.0.1:3000");
    if (v.ok) {
      console.log("  ✓ API :3000 (Livia /api/healthz)");
      return true;
    }
    if (i === 0 || i % 5 === 4) {
      console.log(`  … waiting for Livia API (${v.reason})`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  const last = await verifyLiviaApi("http://127.0.0.1:3000");
  console.log(`  ✗ API :3000 — ${last.reason}`);
  console.log(
    "\n  Fix: netstat -ano | findstr :3000  →  taskkill /F /PID <pid>  →  pnpm dev:api\n",
  );
  return false;
}

loadEnv();
const clerkExtra = clerkAlignmentEnv();
const dashPk = readDashboardClerkPublishableKey();
if (dashPk) {
  console.log(`Clerk instance (dashboard): ${clerkInstanceLabel(dashPk) ?? "unknown"}`);
}
console.log("\n══ Start Livia platform for testing ══\n");
console.log("Clearing ports…");
for (const p of ports) stopPort(p);
await new Promise((r) => setTimeout(r, 2000));

// Reject wrong app on :3000 (e.g. another project's Next.js dev server).
const preflight = await verifyLiviaApi("http://127.0.0.1:3000");
if (!preflight.ok) {
  console.log(`  … port 3000 preflight: ${preflight.reason}`);
}

console.log("Starting services…");
// Ensure per-app ports are stable even if the parent shell has PORT set.
start("dev:api", clerkExtra);
start("dev:dashboard", { PORT: "5173", BASE_PATH: "/" });
start("dev:marketing", { PORT: "5174", BASE_PATH: "/" });
start("dev:internal");

console.log("\nWaiting for health…\n");
const apiOk = await waitLiviaApi();
await waitHttp("http://127.0.0.1:5173/", "Dashboard :5173");
await waitHttp("http://127.0.0.1:5174/", "Marketing :5174");
await waitHttp("http://127.0.0.1:5175/", "Internal :5175");

console.log("\nProvisioning demo…");
spawnSync("node", ["scripts/provision-demo-if-needed.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: isWin,
});

console.log(`
Ready to test:

  livia.io (local)     http://127.0.0.1:5174/
  Product demo         http://127.0.0.1:5173/demo
  Sign in              http://127.0.0.1:5173/sign-in
  Internal ops         http://127.0.0.1:5175/
  Public booking       http://127.0.0.1:5173/b/clarity-medspa-dublin
  Automated pass       pnpm test:e2e:full-ready
  Checklist            docs/testing/READY-FOR-FULL-TEST.md

Password (demo): LiviaDemo2026!  (unless LIVIA_DEMO_PASSWORD in .env)
`);

process.exitCode = apiOk ? 0 : 1;
