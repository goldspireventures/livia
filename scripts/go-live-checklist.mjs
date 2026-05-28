#!/usr/bin/env node
/**
 * Lightweight helper: prints the manual go-live checklist + runs the authoritative gate.
 *
 * Usage:
 *   node scripts/go-live-checklist.mjs --api-base=https://prod.example.com
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseArg(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((a) => a.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : fallback;
}

const apiBase = parseArg("api-base", process.env.PRODUCTION_GATE_API_BASE ?? "http://127.0.0.1:3001");

console.log("\n══ Livia go-live checklist (manual) ══\n");
console.log(`api-base=${apiBase}\n`);

try {
  const doc = readFileSync(resolve(root, "docs/ops/GO-LIVE-CHECKLIST.md"), "utf8");
  console.log(doc);
} catch {
  console.log("Missing docs/ops/GO-LIVE-CHECKLIST.md");
}

console.log("\n── Running production readiness gate ──\n");
const r = spawnSync("node", ["scripts/production-readiness-gate.mjs", `--api-base=${apiBase}`], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);

