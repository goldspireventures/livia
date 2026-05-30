import {
  aiInteractionsTable,
  apiCredentialsTable,
  businessMembershipsTable,
  businessesTable,
  db,
  deviceTokensTable,
  livActionProposalsTable,
  premisesTable,
  remediationActionsTable,
  staffTable,
  supportTicketsTable,
  userNotificationsTable,
  usersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

function isDemoClerkEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@demo.livia-hq.com");
}

/** Re-key a user row when Clerk app changes but demo email stays the same. */
export async function reconcileClerkUserId(oldId: string, newId: string): Promise<void> {
  if (oldId === newId) return;

  const [oldUser] = await db.select().from(usersTable).where(eq(usersTable.id, oldId));
  if (!oldUser) return;
  if (!isDemoClerkEmail(oldUser.email)) {
    throw new Error(`Refusing to reconcile non-demo user ${oldUser.email}`);
  }

  const [existingNew] = await db.select().from(usersTable).where(eq(usersTable.id, newId));
  if (existingNew) return;

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ email: `${oldUser.email}.clerk-stale.${oldId.slice(-8)}`, updatedAt: new Date() })
      .where(eq(usersTable.id, oldId));

    await tx.insert(usersTable).values({
      id: newId,
      email: oldUser.email,
      fullName: oldUser.fullName,
      avatarUrl: oldUser.avatarUrl,
      role: oldUser.role,
      platformLegal: oldUser.platformLegal,
    });

    await tx.update(businessesTable).set({ ownerId: newId }).where(eq(businessesTable.ownerId, oldId));
    await tx
      .update(businessMembershipsTable)
      .set({ userId: newId })
      .where(eq(businessMembershipsTable.userId, oldId));
    await tx.update(premisesTable).set({ ownerUserId: newId }).where(eq(premisesTable.ownerUserId, oldId));
    await tx.update(staffTable).set({ userId: newId }).where(eq(staffTable.userId, oldId));
    await tx.update(supportTicketsTable).set({ userId: newId }).where(eq(supportTicketsTable.userId, oldId));
    await tx
      .update(userNotificationsTable)
      .set({ userId: newId })
      .where(eq(userNotificationsTable.userId, oldId));
    await tx.update(deviceTokensTable).set({ userId: newId }).where(eq(deviceTokensTable.userId, oldId));
    await tx.update(aiInteractionsTable).set({ userId: newId }).where(eq(aiInteractionsTable.userId, oldId));
    await tx
      .update(remediationActionsTable)
      .set({ approvedByUserId: newId })
      .where(eq(remediationActionsTable.approvedByUserId, oldId));
    await tx
      .update(apiCredentialsTable)
      .set({ createdByUserId: newId })
      .where(eq(apiCredentialsTable.createdByUserId, oldId));
    await tx
      .update(livActionProposalsTable)
      .set({ resolvedBy: newId })
      .where(eq(livActionProposalsTable.resolvedBy, oldId));

    await tx.delete(usersTable).where(eq(usersTable.id, oldId));
  });
}

export async function getOrCreateUser(clerkUserId: string, email?: string, fullName?: string) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, clerkUserId));
  if (existing) return existing;

  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    const [byEmail] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    if (byEmail && byEmail.id !== clerkUserId) {
      await reconcileClerkUserId(byEmail.id, clerkUserId);
      const [reconciled] = await db.select().from(usersTable).where(eq(usersTable.id, clerkUserId));
      if (reconciled) {
        if (fullName && reconciled.fullName !== fullName) {
          await updateUser(clerkUserId, { fullName });
        }
        return reconciled;
      }
    }
  }

  const [created] = await db
    .insert(usersTable)
    .values({
      id: clerkUserId,
      email: normalizedEmail ?? `${clerkUserId}@unknown.livia`,
      fullName: fullName ?? null,
    })
    .returning();

  return created;
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user ?? null;
}

export async function updateUser(
  id: string,
  data: {
    fullName?: string;
    avatarUrl?: string;
    platformLegal?: Record<string, unknown>;
  },
) {
  const [updated] = await db
    .update(usersTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();
  return updated ?? null;
}
