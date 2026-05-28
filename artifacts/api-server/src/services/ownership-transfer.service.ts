import {
  db,
  businessesTable,
  businessMembershipsTable,
  usersTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { generateId } from "../lib/id";
import { appendHumanAudit } from "../lib/audit";
import { getStripe } from "../lib/stripe";
import { getOrCreateUser } from "./users.service";
import { logger } from "../lib/logger";

export type OutgoingOwnerDisposition = "STAFF" | "ADMIN" | "REVOKE";

export type TransferOwnershipInput = {
  businessId: string;
  actingUserId: string;
  incomingUserId: string;
  outgoingDisposition: OutgoingOwnerDisposition;
};

export type TransferOwnershipResult = {
  businessId: string;
  previousOwnerId: string;
  newOwnerId: string;
  showKeysRitualForUserId: string;
};

export async function transferBusinessOwnership(
  input: TransferOwnershipInput,
): Promise<TransferOwnershipResult> {
  const { businessId, actingUserId, incomingUserId, outgoingDisposition } = input;

  if (actingUserId === incomingUserId) {
    throw ownershipError("Cannot transfer ownership to yourself.", "SAME_USER");
  }

  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  if (!biz) {
    throw ownershipError("Business not found.", "NOT_FOUND");
  }
  if (biz.ownerId !== actingUserId) {
    throw ownershipError("Only the current owner can transfer ownership.", "NOT_OWNER");
  }

  await getOrCreateUser(incomingUserId);

  const [incomingMembership] = await db
    .select()
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, incomingUserId),
      ),
    );

  if (!incomingMembership) {
    throw ownershipError(
      "Incoming owner must already be a team member (invite them first).",
      "INCOMING_NOT_MEMBER",
    );
  }

  const previousOwnerId = biz.ownerId;

  await db.transaction(async (tx) => {
    await tx
      .update(businessesTable)
      .set({ ownerId: incomingUserId, updatedAt: new Date() })
      .where(eq(businessesTable.id, businessId));

    await tx
      .update(businessMembershipsTable)
      .set({ role: "OWNER", roleV2: "OWN", updatedAt: new Date() })
      .where(
        and(
          eq(businessMembershipsTable.businessId, businessId),
          eq(businessMembershipsTable.userId, incomingUserId),
        ),
      );

    if (outgoingDisposition === "REVOKE") {
      await tx
        .delete(businessMembershipsTable)
        .where(
          and(
            eq(businessMembershipsTable.businessId, businessId),
            eq(businessMembershipsTable.userId, previousOwnerId),
          ),
        );
    } else {
      await tx
        .update(businessMembershipsTable)
        .set({
          role: outgoingDisposition,
          roleV2: outgoingDisposition === "ADMIN" ? "ADM" : "STA",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(businessMembershipsTable.businessId, businessId),
            eq(businessMembershipsTable.userId, previousOwnerId),
          ),
        );
    }
  });

  await appendHumanAudit(
    businessId,
    actingUserId,
    "tenant.ownership_transferred",
    "business",
    businessId,
    {
      previousOwnerId,
      newOwnerId: incomingUserId,
      outgoingDisposition,
      incomingPreviousRole: incomingMembership.role,
    },
  );

  await syncStripeBillingContact(businessId, incomingUserId);

  return {
    businessId,
    previousOwnerId,
    newOwnerId: incomingUserId,
    showKeysRitualForUserId: incomingUserId,
  };
}

async function syncStripeBillingContact(businessId: string, newOwnerUserId: string): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;

  const [biz] = await db
    .select({ stripeCustomerId: businessesTable.stripeCustomerId })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  if (!biz?.stripeCustomerId) return;

  const [user] = await db
    .select({ email: usersTable.email, fullName: usersTable.fullName })
    .from(usersTable)
    .where(eq(usersTable.id, newOwnerUserId));
  if (!user?.email) return;

  try {
    await stripe.customers.update(biz.stripeCustomerId, {
      email: user.email,
      name: user.fullName ?? undefined,
    });
  } catch (err) {
    logger.warn({ err, businessId, stripeCustomerId: biz.stripeCustomerId }, "Stripe customer update failed");
  }
}

function ownershipError(message: string, code: string): Error & { code: string } {
  const e = new Error(message) as Error & { code: string };
  e.code = code;
  return e;
}
