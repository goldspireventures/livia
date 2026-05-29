#!/usr/bin/env node
/**
 * Founder Release Gate
 *
 * Single command that produces a single artifact for a founder to trust:
 * - Truth audit (no dead/claimed flows)
 * - API gate smoke (playwright API tests)
 * - Wargame sim (load + multi-surface probes)
 *
 * Usage:
 *   node scripts/founder-release-gate.mjs
 *   node scripts/founder-release-gate.mjs --level=ci --out=artifacts/founder-gate.json
 *
 * Levels:
 * - full (default): tries to run the most comprehensive checks locally.
 * - ci: avoids dependencies on local .env files and uses CI-style env vars.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArg(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((a) => a.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : fallback;
}

const level = parseArg("level", "full"); // full | ci
const out = parseArg("out", path.join(root, "founder-gate.json"));

function run(label, cmd, args, { allowFail = false, env } = {}) {
  const t0 = Date.now();
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...(env ?? {}) },
  });
  const ms = Date.now() - t0;
  const ok = r.status === 0;
  if (!ok && !allowFail) {
    console.error(`✗ ${label} failed (exit ${r.status ?? 1})`);
  } else if (ok) {
    console.log(`✓ ${label}`);
  }
  return { ok, ms, exitCode: r.status ?? 1 };
}

console.log("\n══ Founder Release Gate ══\n");
console.log(`level=${level}`);

const report = {
  generatedAt: new Date().toISOString(),
  level,
  steps: [],
  ok: true,
};

// 1) Truth audit — always.
report.steps.push(
  Object.assign(
    { id: "truth-audit", label: "platform truth audit" },
    run("Platform truth audit", "node", ["scripts/platform-truth-audit.mjs"]),
  ),
);

// 2) “Smoke correctness” for API surface.
if (level === "full") {
  // This is the strongest local invariant check, but it relies on local env setup.
  report.steps.push(
    Object.assign(
      { id: "solidify-verify-e2e", label: "solidify verify (e2e)" },
      run("Solidify verify (with e2e)", "node", ["scripts/solidify-verify.mjs", "--e2e"]),
    ),
  );
} else {
  // CI-safe: API gate only (no Clerk-backed full demo provision).
  report.steps.push(
    Object.assign(
      { id: "e2e-api", label: "playwright api gate" },
      run("Playwright API gate smoke", "pnpm", ["--filter", "@workspace/e2e", "run", "test:api:ci"]),
    ),
  );
}

// 3) Wargame sim — local full runs only (needs Clerk demo provision).
if (level !== "ci") {
  const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3001";
  const tenants = 6;
  const days = 14;
  const conc = 20;
  report.steps.push(
    Object.assign(
      {
        id: "wargame",
        label: "wargame sim",
        config: { apiBase, tenants, days, concurrency: conc },
      },
      run(
        "Wargame sim",
        "node",
        ["scripts/wargame-sim.mjs", apiBase, String(tenants), String(days), String(conc)],
        { env: { E2E_API_BASE: apiBase } },
      ),
    ),
  );
}

report.ok = report.steps.every((s) => s.ok);

mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`\nReport written → ${out}`);

if (!report.ok) process.exit(1);
console.log("\n✅ Founder Release Gate passed\n");

