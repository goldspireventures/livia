#!/usr/bin/env node
/**
 * Policy export naming CI — blocks NEW long/wide exports in lib/policy.
 *
 *   pnpm policy:name-check
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiServerCwd = join(root, "artifacts", "api-server");

console.log("\n══ Policy export name check ══\n");

const r = spawnSync(
  "node",
  ["--import", "tsx/esm", "../../lib/policy/src/__tests__/export-name-lint.ts"],
  { cwd: apiServerCwd, stdio: "inherit", shell: process.platform === "win32" },
);

if (r.status !== 0) process.exit(r.status ?? 1);
console.log("\n✅ policy:name-check passed\n");
