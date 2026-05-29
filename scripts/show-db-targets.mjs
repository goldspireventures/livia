import { applyDbTargetEnv, hostHint, loadRootEnv, resolveDbUrl } from "./lib/db-target.mjs";

loadRootEnv();

console.log("\nLivia DB targets (from repo-root .env)\n");

try {
  const staging = resolveDbUrl("staging");
  console.log(`  staging (DATABASE_URL)      → ${hostHint(staging)}`);
} catch (err) {
  console.log(`  staging (DATABASE_URL)      → not configured`);
  console.log(`    ${err instanceof Error ? err.message : err}`);
}

try {
  const prod = resolveDbUrl("production");
  console.log(`  production (DATABASE_URL_PROD) → ${hostHint(prod)}`);
} catch {
  console.log(`  production (DATABASE_URL_PROD) → not configured`);
}

console.log("\nCommands:");
console.log("  pnpm db:sync:staging   # push + SQL → staging");
console.log("  pnpm db:sync:prod      # push + SQL → production");
console.log("  pnpm db:push:prod      # schema only → production");
console.log("");
