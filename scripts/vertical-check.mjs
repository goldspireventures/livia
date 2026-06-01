#!/usr/bin/env node
/**
 * R3 vertical registry gate — packs, presets, demo slugs aligned with E2E.
 *
 *   pnpm vertical:check
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiServerCwd = join(root, "artifacts", "api-server");

function run(label, args, { cwd = apiServerCwd } = {}) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync("node", args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.error(`✗ ${label} failed`);
    process.exit(r.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

console.log("\n══ Vertical check (R3) ══\n");

run("Policy vertical registry", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/vertical-registry.test.ts",
]);

run("Presentation presets smoke", [
  "--import",
  "tsx/esm",
  "src/services/__tests__/presentation-presets.test.ts",
]);

run("Vertical doc propagation", [
  "--import",
  "tsx/esm",
  "../../lib/policy/src/__tests__/vertical-doc-propagation.test.ts",
]);

console.log("\n✅ vertical:check passed\n");
