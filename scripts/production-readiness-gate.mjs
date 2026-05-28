#!/usr/bin/env node
/**
 * Authoritative production readiness gate.
 *
 * Usage:
 *   node scripts/production-readiness-gate.mjs
 *   node scripts/production-readiness-gate.mjs --api-base=http://127.0.0.1:3001
 *   node scripts/production-readiness-gate.mjs --skip-smoke
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseArg(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((a) => a.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : fallback;
}

const apiBase = parseArg("api-base", process.env.PRODUCTION_GATE_API_BASE ?? "http://127.0.0.1:3001");
const skipSmoke = process.argv.includes("--skip-smoke");

function run(label, cmd, args, opts = {}) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...(opts.env ?? {}) },
    ...opts,
  });
  if (r.status !== 0) {
    console.error(`✗ ${label} failed`);
    return false;
  }
  return true;
}

console.log("\n══ Livia production readiness gate ══\n");
console.log(`api-base=${apiBase} skip-smoke=${skipSmoke}`);

let ok = true;
ok = run("Repo health", "node", ["scripts/repo-health-audit.mjs"]) && ok;
ok = run("Platform truth audit", "node", ["scripts/platform-truth-audit.mjs"]) && ok;
ok = run("Repo typecheck", "pnpm", ["run", "typecheck"]) && ok;
ok =
  run("API server tests", "pnpm", ["--filter", "@workspace/api-server", "run", "test"]) && ok;

if (!skipSmoke) {
  ok =
    run("Platform smoke", "node", ["scripts/platform-smoke.mjs", apiBase], {
      env: { ...process.env },
    }) && ok;
}

if (ok) {
  console.log("\n✓ Production readiness gate passed.");
  console.log("  Next: node scripts/go-live-checklist.mjs");
  console.log("  Docs: docs/ops/GO-LIVE-CHECKLIST.md");
} else {
  process.exit(1);
}
