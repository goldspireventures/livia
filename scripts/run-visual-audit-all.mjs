#!/usr/bin/env node
/**
 * Full visual audit: web (tenant × verticals) + marketing + internal + mobile-web + native Maestro.
 *
 *   node scripts/run-visual-audit-all.mjs
 *   node scripts/run-visual-audit-all.mjs --skip-maestro
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const skipMaestro = args.has("--skip-maestro");

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m && process.env[m[1].trim()] === undefined) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

function run(cmd, cmdArgs, label) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`✗ ${label} failed (exit ${r.status})`);
    return false;
  }
  return true;
}

function which(cmd) {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], {
    encoding: "utf8",
    shell: true,
  });
  return r.status === 0;
}

loadEnv();
for (const d of [
  "e2e/visual-captures/full-audit",
  "e2e/visual-captures/web",
  "e2e/visual-captures/marketing",
  "e2e/visual-captures/internal",
  "e2e/visual-captures/mobile-web",
  "e2e/visual-captures/mobile",
]) {
  mkdirSync(resolve(root, d), { recursive: true });
}

console.log("\n══ Visual audit: web + internal + marketing + mobile ══\n");

let ok = true;

ok = run("node", ["--env-file=.env", "scripts/provision-demo-if-needed.mjs"], "Ensure demo provisioned") && ok;

const e2e = ["--filter", "@workspace/e2e", "exec", "playwright", "test"];

ok =
  run("pnpm", [...e2e, "--project=full-visual-audit"], "Web: all verticals × tenant routes") && ok;
ok = run("pnpm", [...e2e, "--project=contextual-web"], "Web: 6 personas × routes") && ok;
ok = run("pnpm", [...e2e, "--project=marketing-visual"], "External: livia.io marketing") && ok;
ok = run("pnpm", [...e2e, "--project=internal-visual"], "Internal: ops portal tabs") && ok;
ok = run("pnpm", [...e2e, "--project=mobile-viewport"], "Mobile: iPhone viewport (dashboard web)") && ok;
ok = run("pnpm", [...e2e, "--project=ux-quality-gate"], "UX quality heuristics") && ok;

if (!skipMaestro) {
  if (!which("maestro")) {
    console.warn("\n⚠ Maestro CLI not found — native mobile captures skipped.");
    console.warn("  Install Java 17+ and Maestro: https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli");
    console.warn("  Then: pnpm --filter livia-mobile run ios  &&  pnpm maestro:visual-capture\n");
  } else if (!which("java")) {
    console.warn("\n⚠ Java not on PATH — Maestro requires JDK 17+. Native mobile skipped.\n");
  } else {
    ok = run("node", ["scripts/maestro-visual-capture.mjs"], "Mobile: Maestro native flows") && ok;
  }
} else {
  console.log("\n⊘ Maestro skipped (--skip-maestro)\n");
}

run("node", ["scripts/ux-punch-list-from-findings.mjs"], "Write UX punch list");

if (ok) {
  console.log("\n✓ Captures under e2e/visual-captures/");
  console.log("  full-audit/   — tenant × 8 verticals");
  console.log("  web/          — 6 personas");
  console.log("  marketing/    — livia.io");
  console.log("  internal/     — ops tabs");
  console.log("  mobile-web/   — iPhone viewport fallback");
  console.log("  mobile/       — Maestro (if ran)");
  console.log("\nReview: docs/testing/UX-PUNCH-LIST.md\n");
} else {
  process.exit(1);
}
