#!/usr/bin/env node
/**
 * Ensure API + dashboard + marketing + internal are up for founder gate / e2e.
 * Starts only missing services (does not kill existing listeners).
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyLiviaApi } from "./lib/verify-livia-api.mjs";
import { clerkAlignmentEnv } from "./lib/clerk-env-alignment.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

const targets = [
  { label: "API :3000", check: () => verifyLiviaApi("http://127.0.0.1:3000"), start: "dev:api", env: {} },
  { label: "Dashboard :5173", url: "http://127.0.0.1:5173/", start: "dev:dashboard", env: { PORT: "5173", BASE_PATH: "/" } },
  { label: "Marketing :5174", url: "http://127.0.0.1:5174/", start: "dev:marketing", env: { PORT: "5174", BASE_PATH: "/" } },
  { label: "Internal :5175", url: "http://127.0.0.1:5175/", start: "dev:internal", env: {} },
];

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m && process.env[m[1].trim()] === undefined) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

async function pingUrl(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function isUp(t) {
  if (t.check) {
    const v = await t.check();
    return v.ok;
  }
  return pingUrl(t.url);
}

function startService(script, extraEnv = {}) {
  const child = spawn(isWin ? "pnpm.cmd" : "pnpm", ["run", script], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    shell: isWin,
    env: { ...process.env, NODE_ENV: "development", ...clerkAlignmentEnv(), ...extraEnv },
  });
  child.unref();
}

async function waitUp(t, attempts = 45) {
  for (let i = 0; i < attempts; i++) {
    if (await isUp(t)) {
      console.log(`  ✓ ${t.label}`);
      return true;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.error(`  ✗ ${t.label} — not reachable`);
  return false;
}

loadEnv();
console.log("\n══ Ensure E2E stack ══\n");

let ok = true;
for (const t of targets) {
  if (await isUp(t)) {
    console.log(`  ✓ ${t.label} (already up)`);
    continue;
  }
  console.log(`  … starting ${t.label}`);
  startService(t.start, t.env);
  if (!(await waitUp(t))) ok = false;
}

if (ok) {
  spawnSync("node", ["scripts/provision-demo-if-needed.mjs"], {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
  });
  spawnSync("node", ["scripts/sync-demo-clerk.mjs"], {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
  });
}

process.exit(ok ? 0 : 1);
