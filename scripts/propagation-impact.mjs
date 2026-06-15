#!/usr/bin/env node
/**
 * Change-impact router — which surfaces/capabilities does a policy edit touch?
 *   pnpm propagation:impact lib/policy/src/booking-experience-copy.ts
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const target = process.argv[2];
if (!target?.trim()) {
  console.error("Usage: pnpm propagation:impact <policy-file-path>");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiServerCwd = join(root, "artifacts", "api-server");

const script = `
import { propagationImpactForModule } from "../../lib/policy/src/propagation/clearance.ts";
const report = propagationImpactForModule(${JSON.stringify(target)});
console.log(JSON.stringify(report, null, 2));
`;

const r = spawnSync("node", ["--import", "tsx/esm", "-e", script], {
  cwd: apiServerCwd,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(r.status ?? 1);
