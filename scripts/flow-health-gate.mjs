#!/usr/bin/env node
/**
 * Flow health gate — static + API checks for sacred founder/guest paths.
 * Used by Cursor Automations and local pre-ship sweeps.
 *
 *   pnpm flow:health
 *   pnpm flow:health -- --e2e   # also run Playwright sacred-path specs (needs stack)
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const runE2e = process.argv.includes("--e2e");
const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3001";

function run(label, cmd, args, { allowFail = false } = {}) {
  const t0 = Date.now();
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  const ok = r.status === 0;
  const ms = Date.now() - t0;
  if (!ok && !allowFail) console.error(`✗ ${label} failed (exit ${r.status ?? 1})`);
  else if (ok) console.log(`✓ ${label} (${ms}ms)`);
  return { label, ok, ms, exitCode: r.status ?? 1 };
}

function probeApi() {
  const r = spawnSync(
    "node",
    ["-e", `fetch('${apiBase}/api/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))`],
    { cwd: root, stdio: "ignore", shell: process.platform === "win32" },
  );
  return r.status === 0;
}

console.log("\n══ Livia flow health gate ══\n");

const steps = [];
steps.push(run("Typecheck", "pnpm", ["run", "typecheck"]));
steps.push(run("Vertical registry", "pnpm", ["vertical:check"]));
steps.push(run("API unit tests", "pnpm", ["--filter", "@workspace/api-server", "run", "test"]));

const apiUp = probeApi();
console.log(apiUp ? `\n✓ API reachable at ${apiBase}` : `\n⚠ API not reachable at ${apiBase} — skipping live E2E`);

if (runE2e && apiUp) {
  steps.push(
    run("E2E: founder onboarding resume", "pnpm", [
      "--filter",
      "@workspace/e2e",
      "exec",
      "playwright",
      "test",
      "tests/founder-onboarding-resume.spec.ts",
      "--workers=1",
    ]),
  );
  steps.push(
    run("E2E: onboarding navigation resilience", "pnpm", [
      "--filter",
      "@workspace/e2e",
      "exec",
      "playwright",
      "test",
      "tests/onboarding-navigation-resilience.spec.ts",
      "--workers=1",
    ]),
  );
  steps.push(
    run("E2E: API gate smoke", "pnpm", [
      "--filter",
      "@workspace/e2e",
      "run",
      "test:api:ci",
    ]),
  );
} else if (runE2e && !apiUp) {
  steps.push({
    label: "E2E sacred paths",
    ok: false,
    ms: 0,
    exitCode: 1,
    skipped: "API not up — run pnpm start:platform:test then pnpm flow:health -- --e2e",
  });
  console.error("\n✗ E2E requested but API is down. Start the stack first.");
}

const report = {
  generatedAt: new Date().toISOString(),
  apiUp,
  runE2e,
  steps,
  allOk: steps.every((s) => s.ok),
};

const outDir = join(root, "artifacts");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "flow-health-report.json"), JSON.stringify(report, null, 2));
console.log(`\nReport: artifacts/flow-health-report.json`);

if (!report.allOk) process.exit(1);
console.log("\n✅ Flow health gate passed.\n");
