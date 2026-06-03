/**
 * Prune synthetic Clerk demo users (keeps per-shop owners only by default).
 *
 *   pnpm demo:clerk-prune
 *   pnpm demo:clerk-prune -- --execute
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

const r = spawnSync(
  "pnpm",
  ["exec", "tsx", "--env-file=../../.env", "scripts/prune-clerk-demo-users.ts", ...args],
  { cwd: resolve(root, "artifacts/api-server"), stdio: "inherit", shell: true },
);

process.exit(r.status ?? 1);
