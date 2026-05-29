/**
 * Runs drizzle-kit push with repo-root .env loaded when present, else process env (CI/Railway).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const repoRoot = resolve(pkgRoot, "../..");
const envFile = resolve(repoRoot, ".env");
const hasEnvFile = existsSync(envFile);
const hasConn = Boolean(process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL);

if (!hasEnvFile && !hasConn) {
  console.error(
    `Missing DATABASE_URL — add repo-root .env or export SUPABASE_DATABASE_URL / DATABASE_URL before db push.`,
  );
  process.exit(1);
}

const drizzleBin =
  [resolve(pkgRoot, "node_modules/drizzle-kit/bin.cjs"), resolve(repoRoot, "node_modules/drizzle-kit/bin.cjs")].find(
    existsSync,
  );

if (!drizzleBin) {
  console.error("drizzle-kit not found — run pnpm install at the repo root.");
  process.exit(1);
}

const extraArgs = process.argv.slice(2);
const drizzleArgs = ["push", "--config", "./drizzle.config.ts", ...extraArgs];
const nodeArgs = hasEnvFile
  ? ["--env-file", envFile, drizzleBin, ...drizzleArgs]
  : [drizzleBin, ...drizzleArgs];

const result = spawnSync(process.execPath, nodeArgs, {
  cwd: pkgRoot,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
