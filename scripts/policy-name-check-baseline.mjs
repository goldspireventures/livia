#!/usr/bin/env node
/**
 * Write export-name-lint baseline (grandfather existing violations).
 *
 *   pnpm policy:name-check:baseline
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiServerCwd = join(root, "artifacts", "api-server");

const r = spawnSync(
  "node",
  ["--import", "tsx/esm", "../../lib/policy/src/__tests__/export-name-lint-baseline-write.ts"],
  { cwd: apiServerCwd, stdio: "inherit", shell: process.platform === "win32" },
);

process.exit(r.status ?? 1);
