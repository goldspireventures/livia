/**
 * Runs drizzle-kit push with repo-root .env loaded (cross-platform, no shell piping).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const repoRoot = resolve(pkgRoot, "../..");
const envFile = resolve(repoRoot, ".env");

if (!existsSync(envFile)) {
  console.error(`Missing ${envFile} — add DATABASE_URL (or SUPABASE_DATABASE_URL) before running db push.`);
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

const result = spawnSync(process.execPath, ["--env-file", envFile, drizzleBin, ...drizzleArgs], {
  cwd: pkgRoot,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
