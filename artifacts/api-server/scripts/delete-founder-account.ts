/**
 * Dev-only: delete a founder test account (Clerk + DB).
 * Usage: pnpm --filter @workspace/api-server exec tsx --env-file=../../.env scripts/delete-founder-account.ts imdglobal@gmail.com
 */
import { createClerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, businessesTable, businessMembershipsTable, usersTable } from "@workspace/db";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: delete-founder-account.ts <email>");
  process.exit(1);
}

const secretKey = process.env.CLERK_SECRET_KEY?.trim();
if (!secretKey) {
  console.error("CLERK_SECRET_KEY required");
  process.exit(1);
}

const clerk = createClerkClient({ secretKey });

async function main() {
  const listed = await clerk.users.getUserList({ emailAddress: [email], limit: 5 });
  const clerkUser = listed.data.find(
    (u) =>
      u.emailAddresses?.some((e) => e.emailAddress.toLowerCase() === email) ??
      false,
  );

  const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  const clerkId = clerkUser?.id ?? dbUser?.id ?? null;
  if (!clerkId) {
    console.log(`No Clerk or DB user for ${email} — nothing to delete.`);
    return;
  }

  const owned = await db
    .select({ id: businessesTable.id, slug: businessesTable.slug })
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, clerkId));

  if (owned.length > 0) {
    await db.delete(businessesTable).where(eq(businessesTable.ownerId, clerkId));
    console.log(`Deleted ${owned.length} business(es): ${owned.map((b) => b.slug).join(", ")}`);
  }

  const memberships = await db
    .delete(businessMembershipsTable)
    .where(eq(businessMembershipsTable.userId, clerkId))
    .returning({ id: businessMembershipsTable.id });
  if (memberships.length) {
    console.log(`Removed ${memberships.length} membership(s)`);
  }

  if (dbUser) {
    await db.delete(usersTable).where(eq(usersTable.id, clerkId));
    console.log(`Deleted DB user row ${clerkId}`);
  }

  if (clerkUser) {
    await clerk.users.deleteUser(clerkUser.id);
    console.log(`Deleted Clerk user ${clerkUser.id}`);
  }

  console.log(`Done — ${email} can sign up again.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
