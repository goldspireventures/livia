/**
 * Start full Livia local stack + wait for health.
 * Usage: node scripts/dev-full-stack.mjs
 *
 * Terminals spawned (background): API :3000, Dashboard :5173, Internal :5175, Marketing :5174
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const isWin = process.platform === "win32";

function start(label, script) {
  const child = spawn(isWin ? "pnpm.cmd" : "pnpm", ["run", script], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    shell: isWin,
    env: {
      ...process.env,
      META_DEV_SIMULATE: process.env.META_DEV_SIMULATE ?? "true",
    },
  });
  child.unref();
  console.log(`  ↑ ${label} (pid ${child.pid ?? "?"})`);
}

async function waitHealthy(url, label, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`  ✓ ${label}`);
        return true;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log(`  ✗ ${label} not ready — check logs`);
  return false;
}

console.log("\n══ Livia full stack ══\n");
console.log("Starting services…\n");
start("API", "dev:api");
start("Dashboard", "dev:dashboard");
start("Internal ops", "dev:internal");
start("Marketing", "dev:marketing");

console.log("\nWaiting for health…\n");
const apiOk = await waitHealthy("http://127.0.0.1:3000/api/healthz", "API :3000");
await waitHealthy("http://127.0.0.1:5173/", "Dashboard :5173");
await waitHealthy("http://127.0.0.1:5175/", "Internal :5175");
await waitHealthy("http://127.0.0.1:5174/", "Marketing :5174");

console.log(`
Demo entry points:
  Prospect gate: http://127.0.0.1:5174/demo  (staging parity)
  Founder G1:    http://127.0.0.1:5173/demo/founder
  Internal:      http://127.0.0.1:5175  (INTERNAL_OPS_SECRET from .env)
  Password:   LiviaDemo2026!  (LIVIA_DEMO_PASSWORD)

Personas: demo-founder@livia.io · demo-owner@livia.io · demo-manager@livia.io

If demo empty: pnpm demo:provision
`);

if (!apiOk) process.exitCode = 1;
