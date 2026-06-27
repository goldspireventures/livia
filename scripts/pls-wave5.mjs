#!/usr/bin/env node
/**
 * PLS Wave 5 orchestrator — gates + re-verify + final report + optional mobile.
 *
 *   pnpm pls:wave5
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

function run(label, cmd, args = []) {
  console.log(`\n══ ${label} ══\n`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
  });
  return (r.status ?? 1) === 0;
}

let ok = true;
ok = run("Content audit (strict)", "node", ["scripts/pls-content-audit.mjs", "--strict"]) && ok;
ok = run("Persona UAT probes", isWin ? "pnpm.cmd" : "pnpm", ["persona:uat"]) && ok;
ok =
  run("PLS Wave 5 captures", isWin ? "pnpm.cmd" : "pnpm", [
    "--filter",
    "@workspace/e2e",
    "run",
    "test:pls-wave5",
  ]) && ok;
run("Mobile Maestro (optional)", "node", ["scripts/pls-mobile-try.mjs"]);
const reportOk = run("Final PLS report", "node", ["scripts/pls-final-report.mjs"]);

process.exit(ok && reportOk ? 0 : 1);
