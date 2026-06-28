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

async function reassignUserForeignKeys(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  fromId: string,
  toId: string,
): Promise<void> {
  await tx.update(businessesTable).set({ ownerId: toId }).where(eq(businessesTable.ownerId, fromId));
  await tx
    .update(businessMembershipsTable)
    .set({ userId: toId })
    .where(eq(businessMembershipsTable.userId, fromId));
  await tx.update(premisesTable).set({ ownerUserId: toId }).where(eq(premisesTable.ownerUserId, fromId));
  await tx.update(staffTable).set({ userId: toId }).where(eq(staffTable.userId, fromId));
  await tx.update(supportTicketsTable).set({ userId: toId }).where(eq(supportTicketsTable.userId, fromId));
  await tx
    .update(userNotificationsTable)
    .set({ userId: toId })
    .where(eq(userNotificationsTable.userId, fromId));
  await tx.update(deviceTokensTable).set({ userId: toId }).where(eq(deviceTokensTable.userId, fromId));
  await tx.update(aiInteractionsTable).set({ userId: toId }).where(eq(aiInteractionsTable.userId, fromId));
  await tx
    .update(remediationActionsTable)
    .set({ approvedByUserId: toId })
    .where(eq(remediationActionsTable.approvedByUserId, fromId));
  await tx
    .update(apiCredentialsTable)
    .set({ createdByUserId: toId })
    .where(eq(apiCredentialsTable.createdByUserId, fromId));
  await tx
    .update(livActionProposalsTable)
    .set({ resolvedBy: toId })
    .where(eq(livActionProposalsTable.resolvedBy, fromId));
}

/** Same email, new Clerk user id — current row already exists (often placeholder email). */
export async function mergeClerkUserRows(staleId: string, currentId: string): Promise<void> {
  if (staleId === currentId) return;

  const [stale] = await db.select().from(usersTable).where(eq(usersTable.id, staleId));
  const [current] = await db.select().from(usersTable).where(eq(usersTable.id, currentId));
  if (!stale || !current) return;

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({
        email: `${stale.email}.clerk-stale.${staleId.slice(-8)}`,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, staleId));

    await reassignUserForeignKeys(tx, staleId, currentId);

    await tx
      .update(usersTable)
      .set({
        email: stale.email,
        fullName: current.fullName ?? stale.fullName,
        avatarUrl: current.avatarUrl ?? stale.avatarUrl,
        role: current.role ?? stale.role,
        platformLegal: current.platformLegal ?? stale.platformLegal,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, currentId));

    await tx.delete(usersTable).where(eq(usersTable.id, staleId));
  });
}

/** Re-key a user row when Clerk user id changes but email stays the same (app migration, re-provision). */
export async function reconcileClerkUserId(oldId: string, newId: string): Promise<void> {
  if (oldId === newId) return;

  const [oldUser] = await db.select().from(usersTable).where(eq(usersTable.id, oldId));
  if (!oldUser) return;

  const [existingNew] = await db.select().from(usersTable).where(eq(usersTable.id, newId));
  if (existingNew) {
    await mergeClerkUserRows(oldId, newId);
    return;
  }

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

    await reassignUserForeignKeys(tx, oldId, newId);

    await tx.delete(usersTable).where(eq(usersTable.id, oldId));
  });
}

function isPlaceholderUserEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return email.endsWith("@unknown.livia") || email.endsWith("@unknown.livia.local");
}

export async function getOrCreateUser(clerkUserId: string, email?: string, fullName?: string) {
  const normalizedEmail = email?.trim().toLowerCase();
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, clerkUserId));
  if (existing) {
    if (
      normalizedEmail &&
      isPlaceholderUserEmail(existing.email) &&
      existing.email !== normalizedEmail
    ) {
      const [byEmail] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, normalizedEmail));
      if (byEmail && byEmail.id !== clerkUserId) {
        await mergeClerkUserRows(byEmail.id, clerkUserId);
        const [merged] = await db.select().from(usersTable).where(eq(usersTable.id, clerkUserId));
        if (merged) {
          if (fullName && merged.fullName !== fullName) {
            await updateUser(clerkUserId, { fullName });
          }
          return merged;
        }
      }
      const [patched] = await db
        .update(usersTable)
        .set({ email: normalizedEmail, updatedAt: new Date() })
        .where(eq(usersTable.id, clerkUserId))
        .returning();
      if (patched) {
        if (fullName && patched.fullName !== fullName) {
          await updateUser(clerkUserId, { fullName });
        }
        return patched;
      }
    }
    if (fullName && existing.fullName !== fullName) {
      await updateUser(clerkUserId, { fullName });
    }
    return existing;
  }

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
