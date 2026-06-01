import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClerkClient } from "@clerk/express";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function getKey(file, name) {
  const text = readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(new RegExp(`^${name}=(.+)$`));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

const secret = getKey(resolve(root, ".env"), "CLERK_SECRET_KEY");
const dashPk = getKey(resolve(root, "artifacts/livia-dashboard/.env"), "VITE_CLERK_PUBLISHABLE_KEY");

const clerk = createClerkClient({ secretKey: secret });
const { jwt } = await clerk.users.getUserList({ limit: 1 });
void jwt;

// Clerk instance from first API response header / user list
const users = await clerk.users.getUserList({ limit: 1 });
console.log("backend user count sample:", users.totalCount);

const dashInst = Buffer.from(dashPk.split("_").slice(2).join("_"), "base64").toString("utf8");
console.log("dashboard instance:", dashInst);

// Probe sign-in token exchange via Clerk REST (same instance as secret)
const luxe = await clerk.users.getUserList({ emailAddress: ["owner-luxe@demo.livia-hq.com"], limit: 1 });
const u = luxe.data[0];
const { token } = await clerk.signInTokens.createSignInToken({ userId: u.id, expiresInSeconds: 60 });
console.log("token for", u.emailAddresses[0]?.emailAddress, "ok");

// Frontend verification hint
console.log("\nIf E2E ticket sign-in fails but token creates:");
console.log("  1. Set CLERK_PUBLISHABLE_KEY in root .env = dashboard VITE_CLERK_PUBLISHABLE_KEY");
console.log("  2. Restart pnpm dev:api and pnpm dev:dashboard");
console.log("  3. Run: curl -X POST http://127.0.0.1:3000/api/demo/sync-clerk");
