/**
 * Wrapper — prune synthetic Clerk test users (prod live or dev with flag).
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

const r = spawnSync(
  "pnpm",
  ["exec", "tsx", "--env-file=../../.env", "scripts/clerk-prod-test-prune.ts", ...args],
  { cwd: resolve(root, "artifacts/api-server"), stdio: "inherit", shell: true },
);

process.exit(r.status ?? 1);
