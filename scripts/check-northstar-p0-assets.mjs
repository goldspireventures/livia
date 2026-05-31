#!/usr/bin/env node
/**
 * CI gate — northstar P0 PNGs exist and docs/public copies match.
 *
 *   pnpm northstar:check
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiServerCwd = join(root, "artifacts", "api-server");

console.log("\n══ Northstar P0 assets ══\n");

const r = spawnSync(
  "node",
  ["--import", "tsx/esm", "../../lib/policy/src/__tests__/northstar-p0-assets.test.ts"],
  { cwd: apiServerCwd, stdio: "inherit", shell: process.platform === "win32" },
);

if (r.status !== 0) process.exit(r.status ?? 1);
console.log("\n✅ northstar:check passed\n");
