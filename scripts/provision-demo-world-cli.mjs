/**
 * Provision demo world directly (no HTTP) — use when API is down or not rebuilt yet.
 *
 *   node --env-file=.env scripts/provision-demo-world-cli.mjs
 *   node --env-file=.env scripts/provision-demo-world-cli.mjs --repair
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(root, "artifacts/api-server/scripts/provision-demo-cli.ts");

const repair = process.argv.includes("--repair");
const r = spawnSync(
  "pnpm",
  ["exec", "tsx", "--env-file=../../.env", "scripts/provision-demo-cli.ts", ...(repair ? ["--repair"] : [])],
  { cwd: resolve(root, "artifacts/api-server"), stdio: "inherit", shell: true },
);

process.exit(r.status ?? 1);
