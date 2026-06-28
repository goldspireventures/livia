/**
 * Merge duplicate users rows for one email (stale Clerk id → current Clerk id).
 * Usage: node scripts/with-db-target.mjs --prod pnpm --filter @workspace/api-server exec tsx scripts/merge-user-by-email.ts <email> <currentClerkId>
 */
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { mergeClerkUserRows } from "../src/services/users.service.js";

const email = process.argv[2]?.trim().toLowerCase();
const currentClerkId = process.argv[3]?.trim();

if (!email || !currentClerkId) {
  console.error("Usage: tsx scripts/merge-user-by-email.ts <email> <current-clerk-user-id>");
  process.exit(1);
}

const [byEmailRows, [current]] = await Promise.all([
  db.select().from(usersTable).where(eq(usersTable.email, email)),
  db.select().from(usersTable).where(eq(usersTable.id, currentClerkId)),
]);

const stale = byEmailRows.find((r) => r.id !== currentClerkId);

if (!stale) {
  console.log("No stale row for email — nothing to merge.");
  process.exit(0);
}

if (!current) {
  console.error("Current clerk user row not found:", currentClerkId);
  process.exit(1);
}

console.log("Merging", stale.id, "→", current.id, "for", email);
await mergeClerkUserRows(stale.id, current.id);
console.log("Done.");
