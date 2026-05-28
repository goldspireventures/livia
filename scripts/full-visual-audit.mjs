#!/usr/bin/env node
/**
 * Full visual vetting — web (Playwright) + mobile (Maestro).
 *
 *   pnpm e2e:full-visual-audit
 *
 * Prerequisites:
 *   - API on E2E_API_BASE (default :3001), demo provisioned
 *   - Dashboard on E2E_DASHBOARD_BASE (default :5173)
 *   - For mobile: Maestro CLI + Expo app on simulator (pnpm --filter livia-mobile run ios)
 *
 * Outputs (gitignored):
 *   e2e/visual-captures/full-audit/     — web exhaustive routes × verticals
 *   e2e/visual-captures/web/<persona>/ — web persona matrix
 *   e2e/visual-captures/mobile/         — Maestro screenshots
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const args = new Set(process.argv.slice(2));
const webOnly = args.has("--web-only");
const mobileOnly = args.has("--mobile-only");

function loadEnv() {
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

async function ensureDemo() {
  const base = process.env.E2E_API_BASE ?? "http://127.0.0.1:3001";
  try {
    const status = await fetch(`${base}/api/demo/status`);
    if (status.ok) {
      const j = (await status.json()) as { provisioned?: boolean };
      if (j.provisioned) return true;
    }
    const prov = await fetch(`${base}/api/demo/provision`, { method: "POST" });
    if (prov.ok) return true;
    console.warn(`Demo provision HTTP ${prov.status}`);
    return false;
  } catch (e) {
    console.warn(`API not reachable at ${base}:`, (e as Error).message);
    return false;
  }
}

loadEnv();

const outDirs = [
  "e2e/visual-captures/full-audit",
  "e2e/visual-captures/web",
  "e2e/visual-captures/mobile",
];
for (const d of outDirs) mkdirSync(resolve(root, d), { recursive: true });

console.log("\n══ Livia full visual audit (web + mobile) ══\n");

let ok = true;

if (!mobileOnly) {
  void ensureDemo();
  ok =
    run("pnpm", ["--filter", "@workspace/e2e", "run", "test:full-visual-audit"], "Web: full platform routes × verticals") &&
    ok;
  ok =
    run("pnpm", ["--filter", "@workspace/e2e", "run", "test:contextual-web"], "Web: persona × route matrix") &&
    ok;
  ok = run("pnpm", ["--filter", "@workspace/livia-mobile", "run", "typecheck"], "Mobile: TypeScript") && ok;
}

if (!webOnly) {
  if (!which("maestro")) {
    console.error(
      "\n✗ Maestro CLI not found — install https://maestro.mobile.dev/docs/getting-started/installing-maestro",
    );
    console.error("  Then: pnpm --filter livia-mobile run ios  (or android)");
    console.error("  Re-run: pnpm e2e:full-visual-audit:mobile\n");
    if (!args.has("--allow-skip-mobile")) ok = false;
  } else {
    ok = run("node", ["scripts/maestro-visual-capture.mjs"], "Mobile: Maestro persona + vertical captures") && ok;
  }
}

if (ok) {
  console.log("\n✓ Visual audit complete. Review captures under e2e/visual-captures/");
  console.log("  Log findings in docs/testing/UX-FULL-PLATFORM-AUDIT-2026-05-24.md");
} else {
  process.exit(1);
}
