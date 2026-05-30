#!/usr/bin/env node
/**
 * R1 headless lifecycle — prospect → demo wedge → public book surface.
 *
 *   node scripts/headless-lifecycle-r1.mjs
 *   node scripts/headless-lifecycle-r1.mjs --api http://127.0.0.1:3000
 *
 * Prereqs: API running; demo provisioned for full vertical pass.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const apiIdx = args.indexOf("--api");
const apiBase = (apiIdx >= 0 ? args[apiIdx + 1] : process.env.E2E_API_BASE ?? "http://127.0.0.1:3000").replace(
  /\/+$/,
  "",
);

const DEMO_SLUGS = [
  "aurora-studio-dublin",
  "inkwell-tattoo-dublin",
  "bloom-beauty-galway",
  "zen-wellness-cork",
  "pulse-fitness-dublin",
  "london-rose-spa",
  "physio-plus-dublin",
  "paws-grooming-dublin",
  "shine-studio-belfast",
];

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

async function check(label, url, expectOk = true) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const ok = expectOk ? r.ok : r.status < 500;
    console.log(`${ok ? "✓" : "✗"} ${label} — ${r.status} ${url}`);
    return ok;
  } catch (e) {
    console.log(`✗ ${label} — ${e instanceof Error ? e.message : "failed"}`);
    return false;
  }
}

loadEnv();

console.log(`\n▶ R1 headless lifecycle (API ${apiBase})\n`);

let ok = true;
ok = (await check("API health", `${apiBase}/api/healthz`)) && ok;
ok = (await check("Wedge demo catalog", `${apiBase}/api/public/wedge-demo`)) && ok;
ok =
  (await check("Wedge interstitial hair", `${apiBase}/api/public/wedge-demo/hair`)) && ok;

const prov = spawnSync("node", ["scripts/provision-demo-if-needed.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, E2E_API_BASE: apiBase },
});
if (prov.status !== 0) {
  console.warn("⚠ Demo provision skipped or failed — vertical /b checks may fail");
}

for (const slug of DEMO_SLUGS) {
  const pass = await check(`Public /b ${slug}`, `${apiBase}/api/public/b/${slug}`);
  ok = pass && ok;
}

console.log(ok ? "\n✓ R1 headless lifecycle passed\n" : "\n✗ R1 headless lifecycle had failures\n");
process.exit(ok ? 0 : 1);
