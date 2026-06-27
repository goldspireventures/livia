#!/usr/bin/env node
/**
 * Mobile parity audit — legacy entry; delegates to mobile-pls-parity.
 *
 *   pnpm mobile:parity-audit
 */
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync(process.execPath, [join(root, "scripts", "mobile-pls-parity.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
