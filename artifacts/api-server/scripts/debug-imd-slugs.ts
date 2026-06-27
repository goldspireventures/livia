import { createClerkClient } from "@clerk/express";
import { db, businessesTable } from "@workspace/db";
import { eq, like } from "drizzle-orm";

const email = process.argv[2] ?? "imdglobal@gmx.com";
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
const users = await clerk.users.getUserList({ emailAddress: [email.toLowerCase()], limit: 1 });
const clerkId = users.data[0]?.id;
console.log("clerk", clerkId, email);

const imd = await db
  .select({
    id: businessesTable.id,
    slug: businessesTable.slug,
    name: businessesTable.name,
    ownerId: businessesTable.ownerId,
  })
  .from(businessesTable)
  .where(like(businessesTable.slug, "imd%"));

console.log("imd slugs", imd);

if (clerkId) {
  const owned = await db
    .select({ id: businessesTable.id, slug: businessesTable.slug, ownerId: businessesTable.ownerId })
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, clerkId));
  console.log("owned", owned);
}
process.exit(0);
