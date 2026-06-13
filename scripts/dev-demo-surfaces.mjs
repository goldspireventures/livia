/**
 * Marketing W1 gate (:5174) + app wedge/host (:5173) for local demo parity.
 * Usage: pnpm dev:demo-surfaces
 */
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

function start(label, script) {
  const child = spawn(isWin ? "pnpm.cmd" : "pnpm", ["run", script], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    shell: isWin,
    env: { ...process.env },
  });
  child.unref();
  console.log(`  ↑ ${label} (pid ${child.pid ?? "?"})`);
}

async function wait(url, label, attempts = 30) {
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
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log(`  ✗ ${label} not ready`);
  return false;
}

console.log("\n══ Livia demo surfaces (marketing + app) ══\n");
start("Marketing :5174", "dev:marketing");
start("Dashboard :5173", "dev:dashboard");

console.log("\nWaiting…\n");
await wait("http://127.0.0.1:5174/", "Marketing http://127.0.0.1:5174");
await wait("http://127.0.0.1:5173/", "Dashboard http://127.0.0.1:5173");

console.log(`
Prospect demo (staging parity):
  http://127.0.0.1:5174/demo

Founder G1 launcher (QA):
  http://127.0.0.1:5173/demo/founder

Event wedge:
  http://127.0.0.1:5173/demo/wedge/event-vendors

API must still be running separately: pnpm dev:api
`);
