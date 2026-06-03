/**
 * Recreate demo Clerk users after prune.
 *
 *   pnpm demo:clerk-rebuild
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const r = spawnSync(
  "pnpm",
  ["exec", "tsx", "--env-file=../../.env", "scripts/rebuild-demo-clerk.ts"],
  { cwd: resolve(root, "artifacts/api-server"), stdio: "inherit", shell: true },
);

process.exit(r.status ?? 1);
