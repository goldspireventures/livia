/**
 * Run a command with DATABASE_URL switched to staging or production.
 *
 * Usage:
 *   node scripts/with-db-target.mjs --staging pnpm db:push
 *   node scripts/with-db-target.mjs --prod node scripts/db-sync.mjs
 */
import { spawnSync } from "node:child_process";
import { applyDbTargetEnv, repoRoot } from "./lib/db-target.mjs";

const raw = process.argv.slice(2);
if (raw.length === 0) {
  console.error("Usage: node scripts/with-db-target.mjs [--staging|--prod] <command...>");
  process.exit(1);
}

let target = "staging";
if (raw[0] === "--staging" || raw[0] === "--prod") {
  target = raw[0] === "--prod" ? "production" : "staging";
  raw.shift();
}

if (raw.length === 0) {
  console.error("Missing command after target flag.");
  process.exit(1);
}

let meta;
try {
  meta = applyDbTargetEnv(target);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

const label = target === "production" ? "PRODUCTION" : "staging";
console.log(`\n▶ DB target: ${label} (${meta.host})\n`);

const [cmd, ...args] = raw;
const result = spawnSync(cmd, args, {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
