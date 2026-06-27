#!/usr/bin/env node
/**
 * PLS gap closeout — Waves 6–10 + bundled E2E suites + final report.
 *
 *   pnpm pls:gaps-closeout
 *
 * Requires local stack: pnpm start:platform:test (API, dashboard, marketing, internal).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const pnpm = isWin ? "pnpm.cmd" : "pnpm";

function run(label, cmd, args = [], { optional = false } = {}) {
  console.log(`\n══ ${label} ══\n`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
  });
  const passed = (r.status ?? 1) === 0;
  if (!passed) {
    if (optional) {
      console.warn(`\n⚠ ${label} skipped/failed (optional — continuing)`);
      return true;
    }
    console.error(`\n✗ ${label} failed (exit ${r.status ?? 1})`);
  }
  return passed;
}

let ok = true;

ok = run("Content audit (strict)", "node", ["scripts/pls-content-audit.mjs", "--strict"]) && ok;
ok = run("Persona UAT probes", pnpm, ["persona:uat"]) && ok;

for (const wave of [6, 7, 8, 9, 10]) {
  ok =
    run(`PLS Wave ${wave} captures`, pnpm, ["--filter", "@workspace/e2e", "run", `test:pls-wave${wave}`]) && ok;
}

run("Guest token suite", pnpm, ["--filter", "@workspace/e2e", "run", "test:guest-tokens"], { optional: true });
run("Demo depth suite", pnpm, ["--filter", "@workspace/e2e", "run", "test:demo-depth"], { optional: true });
run("Founder UAT P0", pnpm, ["--filter", "@workspace/e2e", "run", "test:founder-uat"], { optional: true });
run("Sacred path signup", pnpm, ["sacred-path:signup"], { optional: true });
run("Contextual web audit", pnpm, ["--filter", "@workspace/e2e", "run", "test:contextual-web"], { optional: true });

ok = run("Mobile PLS parity (code + API, no emulator)", "node", ["scripts/mobile-pls-parity.mjs"]) && ok;
run("Mobile API parity (Playwright)", pnpm, ["pls:mobile-api"], { optional: true });

const reportOk = run("Final PLS report (waves 1–10)", "node", ["scripts/pls-final-report.mjs"]);

process.exit(ok && reportOk ? 0 : 1);
