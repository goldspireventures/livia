/**
 * drizzle push + SQL migrations (cross-platform). Uses DATABASE_URL in env
 * (set by with-db-target.mjs for staging vs prod).
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(label, cmd, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("drizzle push", "pnpm", ["--filter", "@workspace/db", "run", "push"]);
run("SQL migrations", process.execPath, [resolve(root, "scripts/apply-sql-migrations.mjs")]);
console.log("\n✓ db-sync done");
