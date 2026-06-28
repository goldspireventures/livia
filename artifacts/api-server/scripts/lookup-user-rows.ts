import { db, usersTable } from "@workspace/db";
import { eq, or, like } from "drizzle-orm";

const email = process.argv[2]?.trim().toLowerCase() ?? "imdglobal@gmx.com";
const clerkId = process.argv[3]?.trim();

const byEmail = await db.select().from(usersTable).where(eq(usersTable.email, email));
console.log("by email:", byEmail.map((u) => ({ id: u.id, email: u.email })));

if (clerkId) {
  const [byId] = await db.select().from(usersTable).where(eq(usersTable.id, clerkId));
  console.log("by clerk id:", byId ? { id: byId.id, email: byId.email } : null);
}

const fuzzy = await db
  .select()
  .from(usersTable)
  .where(or(like(usersTable.email, "%imdglobal%"), like(usersTable.id, "%3Fli%")));
console.log(
  "fuzzy:",
  fuzzy.map((u) => ({ id: u.id, email: u.email })),
);
