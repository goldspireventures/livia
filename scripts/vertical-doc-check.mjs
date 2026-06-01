#!/usr/bin/env node
/**
 * Doc propagation guard for vertical hub ↔ spokes.
 *
 *   pnpm vertical:doc-check
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiServerCwd = join(root, "artifacts", "api-server");

console.log("\n══ Vertical doc propagation ══\n");

const r = spawnSync(
  "node",
  ["--import", "tsx/esm", "../../lib/policy/src/__tests__/vertical-doc-propagation.test.ts"],
  { cwd: apiServerCwd, stdio: "inherit", shell: process.platform === "win32" },
);

if (r.status !== 0) {
  console.error("\n✗ vertical:doc-check failed — see DOC-PROPAGATION-CASCADE.md\n");
  process.exit(r.status ?? 1);
}

console.log("\n✅ vertical:doc-check passed\n");
