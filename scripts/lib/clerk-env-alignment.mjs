import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Read a single key from a dotenv file (no secrets logged). */
export function readEnvKey(filePath, key) {
  if (!existsSync(filePath)) return undefined;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const m = line.match(new RegExp(`^\\s*${key}=(.*)$`));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return undefined;
}

/** Dashboard VITE pk — source of truth for local Clerk frontend instance. */
export function readDashboardClerkPublishableKey() {
  return readEnvKey(resolve(root, "artifacts/livia-dashboard/.env"), "VITE_CLERK_PUBLISHABLE_KEY");
}

/**
 * Align API runtime with dashboard Clerk app for local E2E.
 * Returns extra env to pass when spawning dev:api.
 */
export function clerkAlignmentEnv() {
  const dashPk = readDashboardClerkPublishableKey();
  const rootPk = process.env.CLERK_PUBLISHABLE_KEY?.trim();
  const extra = {};

  if (dashPk && !rootPk) {
    extra.CLERK_PUBLISHABLE_KEY = dashPk;
    process.env.CLERK_PUBLISHABLE_KEY = dashPk;
  }

  if (dashPk && rootPk && dashPk !== rootPk) {
    console.warn(
      "\n⚠ Clerk key mismatch: root CLERK_PUBLISHABLE_KEY ≠ dashboard VITE_CLERK_PUBLISHABLE_KEY.\n" +
        "  E2E owner sign-in will fail until they match (copy dashboard pk to root .env).\n",
    );
  }

  return extra;
}

export function clerkInstanceLabel(pk) {
  if (!pk?.startsWith("pk_")) return null;
  try {
    return Buffer.from(pk.split("_").slice(2).join("_"), "base64").toString("utf8");
  } catch {
    return null;
  }
}
