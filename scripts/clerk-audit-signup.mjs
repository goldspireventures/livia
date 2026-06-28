#!/usr/bin/env node
/**
 * Audit Clerk prod/test for a sign-up email (uses Railway CLERK_SECRET_KEY when linked).
 * Usage: pnpm clerk:audit-signup imdglobal@gmx.com
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const email = process.argv[2]?.trim();
if (!email) {
  console.error("Usage: pnpm clerk:audit-signup <email>");
  process.exit(1);
}

const script = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../artifacts/api-server/scripts/clerk-audit-signup.ts",
);

function railwaySecret() {
  const r = spawnSync("railway", ["variables", "--json"], { encoding: "utf8" });
  if (r.status !== 0) return process.env.CLERK_SECRET_KEY;
  try {
    return JSON.parse(r.stdout).CLERK_SECRET_KEY ?? process.env.CLERK_SECRET_KEY;
  } catch {
    return process.env.CLERK_SECRET_KEY;
  }
}

const secret = railwaySecret();
if (!secret) {
  console.error("No CLERK_SECRET_KEY — link Railway or set in .env");
  process.exit(1);
}

const r = spawnSync(
  "pnpm",
  ["exec", "tsx", `"${script}"`, email],
  {
    cwd: path.join(path.dirname(fileURLToPath(import.meta.url)), "../artifacts/api-server"),
    env: { ...process.env, CLERK_SECRET_KEY: secret },
    stdio: "inherit",
    shell: true,
  },
);
process.exit(r.status ?? 1);
