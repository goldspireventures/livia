#!/usr/bin/env node
/**
 * Prints founder UAT commands and runs asset gates.
 *
 *   pnpm founder:uat-preflight
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("\n══ Founder UAT preflight ══\n");
console.log("Checklist: docs/operations/FOUNDER-UAT-CHECKLIST.md\n");

const ok = spawnSync("pnpm", ["northstar:check"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
}).status === 0;

console.log("\nManual / local (API :3001 + dashboard :5173 + Clerk):\n");
console.log("  pnpm --filter @workspace/e2e run test:p0-visual");
console.log("  pnpm --filter @workspace/e2e run test:founder-uat");
console.log("  pnpm --filter @workspace/e2e run test:screen-card-p0");
console.log("  pnpm sacred-path:signup");
console.log("  pnpm --filter @workspace/e2e run test:sacred-path-signup");
console.log("  pnpm --filter @workspace/e2e run test:preset-public-parity\n");

if (!ok) process.exit(1);
console.log("✅ Asset gates passed — run E2E above when servers are up.\n");
