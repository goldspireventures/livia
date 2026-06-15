#!/usr/bin/env node
/**
 * Propagation clearance gate — border control for all verticals + routing graph.
 *   pnpm propagation:check
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiServerCwd = join(root, "artifacts", "api-server");

function run(label, args) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync("node", args, {
    cwd: apiServerCwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.error(`✗ ${label} failed`);
    process.exit(r.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

console.log("\n══ Propagation check ══\n");

const tests = [
  "propagation-program.test.ts",
  "vertical-copy-program.test.ts",
  "vertical-pending-copy-coverage.test.ts",
  "vertical-announcement.test.ts",
  "vertical-registry.test.ts",
];

for (const file of tests) {
  run(`Policy: ${file}`, ["--import", "tsx/esm", `../../lib/policy/src/__tests__/${file}`]);
}

console.log("\n✓ propagation:check passed\n");
