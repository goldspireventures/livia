/**
 * Delete one owned business by slug for a founder email.
 * Usage: tsx --env-file=../../.env scripts/delete-founder-business-by-slug.ts [email] [slug]
 */
import { createClerkClient } from "@clerk/express";
import { db, businessesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const email = (process.argv[2] ?? "imdglobal@gmx.com").toLowerCase();
const slug = process.argv[3];
if (!slug) {
  console.error("Usage: delete-founder-business-by-slug.ts [email] [slug]");
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
const clerkId = users.data[0]?.id;
if (!clerkId) {
  console.error("No Clerk user for", email);
  process.exit(1);
}

const [row] = await db
  .select({ id: businessesTable.id, slug: businessesTable.slug, name: businessesTable.name })
  .from(businessesTable)
  .where(and(eq(businessesTable.ownerId, clerkId), eq(businessesTable.slug, slug)));

if (!row) {
  console.log("Not found:", slug, "for", email);
  process.exit(0);
}

await db.delete(businessesTable).where(eq(businessesTable.id, row.id));
console.log("Deleted", row);

const remaining = await db
  .select({ slug: businessesTable.slug, name: businessesTable.name })
  .from(businessesTable)
  .where(eq(businessesTable.ownerId, clerkId));
console.log("Remaining owned shops:", remaining);
process.exit(0);
