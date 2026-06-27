import { createClerkClient } from "@clerk/express";
import { db, businessesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const email = process.argv[2]?.toLowerCase() ?? "imdglobal@gmx.com";
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
const uid = users.data[0]?.id;
console.log("clerk", uid, email);

const col = await db.execute(sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'businesses' AND column_name = 'chair_hosting'
`);
console.log("chair_hosting column:", col.rows);

if (uid) {
  const owned = await db
    .select({
      id: businessesTable.id,
      slug: businessesTable.slug,
      name: businessesTable.name,
      vertical: businessesTable.vertical,
    })
    .from(businessesTable)
    .where(eq(businessesTable.ownerId, uid));
  console.log("owned", owned);
}

process.exit(0);
