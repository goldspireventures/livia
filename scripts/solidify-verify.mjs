#!/usr/bin/env node
/**
 * Operation Solidify — local certify helper (kernel + types + optional e2e).
 *
 *   node scripts/solidify-verify.mjs
 *   node scripts/solidify-verify.mjs --e2e
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const withE2e = process.argv.includes("--e2e");

function run(cmd, args, label) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`✗ ${label} failed (exit ${r.status ?? 1})`);
    process.exit(r.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

run("node", ["--env-file=.env", "scripts/apply-sql-migrations.mjs"], "SQL migrations");
run("pnpm", ["--filter", "@workspace/api-server", "exec", "tsc", "--noEmit"], "api-server typecheck");
run("pnpm", ["--filter", "@workspace/livia-dashboard", "exec", "tsc", "--noEmit"], "dashboard typecheck");
run("pnpm", ["--filter", "@workspace/livia-mobile", "exec", "tsc", "--noEmit"], "mobile typecheck");
run("node", ["scripts/verify-livia-api.mjs"], "API health (verify-livia-api)");

run("node", ["scripts/platform-truth-audit.mjs"], "platform truth audit");
run(
  "pnpm",
  ["--filter", "@workspace/api-server", "exec", "node", "--import", "tsx/esm", "src/services/__tests__/operational-case.test.ts"],
  "operational case unit tests",
);

if (withE2e) {
  run("node", ["scripts/e2e-all-verticals.mjs"], "e2e:verticals");
} else {
  console.log("\nℹ Skip e2e (pass --e2e to run pnpm test:e2e:verticals)");
}

console.log("\n✅ solidify-verify complete");
