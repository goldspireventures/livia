import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function getOrCreateUser(clerkUserId: string, email?: string, fullName?: string) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, clerkUserId));
  if (existing) return existing;

  const [created] = await db
    .insert(usersTable)
    .values({
      id: clerkUserId,
      email: email ?? `${clerkUserId}@unknown.livia`,
      fullName: fullName ?? null,
    })
    .returning();

  return created;
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user ?? null;
}

export async function updateUser(id: string, data: { fullName?: string; avatarUrl?: string }) {
  const [updated] = await db
    .update(usersTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();
  return updated ?? null;
}
