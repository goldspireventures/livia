#!/usr/bin/env node
/**
 * Verify Clerk secret + publishable keys are from the same Clerk app (local E2E).
 *   node scripts/ensure-clerk-keys-aligned.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { clerkInstanceLabel, readDashboardClerkPublishableKey, readEnvKey } from "./lib/clerk-env-alignment.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const secret = readEnvKey(resolve(root, ".env"), "CLERK_SECRET_KEY");
const dashPk = readDashboardClerkPublishableKey();

function keyEnv(k) {
  if (!k) return "missing";
  if (k.startsWith("sk_live_") || k.startsWith("pk_live_")) return "production";
  if (k.startsWith("sk_test_") || k.startsWith("pk_test_")) return "test";
  return "unknown";
}

if (!secret) {
  console.error("Missing CLERK_SECRET_KEY in repo root .env");
  process.exit(1);
}
if (!dashPk) {
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY in artifacts/livia-dashboard/.env");
  process.exit(1);
}

const secretEnv = keyEnv(secret);
const pkEnv = keyEnv(dashPk);
const dashLabel = clerkInstanceLabel(dashPk);

console.log("\nClerk key alignment");
console.log("  root secret env:     ", secretEnv);
console.log("  dashboard pk env:    ", pkEnv);
console.log("  dashboard instance:  ", dashLabel ?? "(parse failed)");

if (secretEnv !== pkEnv) {
  console.error(
    `\n✗ ENV MISMATCH — root CLERK_SECRET_KEY is ${secretEnv} but dashboard pk is ${pkEnv}.\n` +
      "  Local E2E needs matching **test** keys in both files.\n" +
      "  Fix: Clerk Dashboard (test instance) → copy Secret + Publishable to:\n" +
      "    - root .env → CLERK_SECRET_KEY + CLERK_PUBLISHABLE_KEY\n" +
      "    - artifacts/livia-dashboard/.env → VITE_CLERK_PUBLISHABLE_KEY\n",
  );
  process.exit(1);
}

// Prove demo owner exists on the secret's Clerk app (API-side).
const res = await fetch(
  `https://api.clerk.com/v1/users?email_address=${encodeURIComponent("owner-luxe@demo.livia-hq.com")}&limit=1`,
  { headers: { Authorization: `Bearer ${secret}` } },
);
if (!res.ok) {
  console.error("Clerk secret rejected:", res.status);
  process.exit(1);
}
const users = await res.json();
if (!users?.length) {
  console.warn("\n⚠ Demo user owner-luxe@demo.livia-hq.com not on this Clerk app — run POST /api/demo/sync-clerk\n");
} else {
  console.log("  demo owner on secret app: yes");
}

console.log("\n✓ Clerk key env aligned (test/test or live/live)\n");
console.log(
  "If owner E2E still fails, confirm both keys are from the same Clerk application in the dashboard.\n",
);
