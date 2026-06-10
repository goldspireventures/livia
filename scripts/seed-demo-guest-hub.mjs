/**
 * Seed demo guest Mary vault links (no HTTP) — use when API route not deployed yet.
 *
 *   pnpm demo:sync-guest-hub
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const r = spawnSync(
  "pnpm",
  ["exec", "tsx", "--env-file=../../.env", "scripts/seed-demo-guest-hub-cli.ts"],
  { cwd: resolve(root, "artifacts/api-server"), stdio: "inherit", shell: true },
);

process.exit(r.status ?? 1);
