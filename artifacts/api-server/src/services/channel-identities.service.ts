import { db, channelIdentitiesTable, customersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { generateId } from "../lib/id";

type ChannelType = "WHATSAPP" | "INSTAGRAM" | "SMS" | "EMAIL" | "VOICE" | "WEB" | "APP";

export async function upsertChannelIdentity(args: {
  businessId: string;
  channelType: ChannelType;
  externalId: string;
  displayName?: string;
  username?: string;
}): Promise<{ customerId: string }> {
  const [existing] = await db
    .select()
    .from(channelIdentitiesTable)
    .where(
      and(
        eq(channelIdentitiesTable.businessId, args.businessId),
        eq(channelIdentitiesTable.channelType, args.channelType),
        eq(channelIdentitiesTable.externalId, args.externalId),
      ),
    )
    .limit(1);

  if (existing?.customerId) {
    return { customerId: existing.customerId };
  }

  const customerId = generateId();
  await db.insert(customersTable).values({
    id: customerId,
    businessId: args.businessId,
    displayName: args.displayName ?? args.username ?? args.externalId,
    phone: args.channelType === "WHATSAPP" || args.channelType === "SMS" ? args.externalId : null,
    preferredModality:
      args.channelType === "WHATSAPP"
        ? "WHATSAPP"
        : args.channelType === "INSTAGRAM"
          ? "INSTAGRAM"
          : args.channelType === "SMS"
            ? "SMS"
            : "ANY",
  });

  await db.insert(channelIdentitiesTable).values({
    id: generateId(),
    businessId: args.businessId,
    customerId,
    channelType: args.channelType,
    externalId: args.externalId,
    displayName: args.displayName ?? null,
    username: args.username ?? null,
  });

  return { customerId };
}

export async function listChannelIdentitiesForCustomer(businessId: string, customerId: string) {
  return db
    .select()
    .from(channelIdentitiesTable)
    .where(
      and(
        eq(channelIdentitiesTable.businessId, businessId),
        eq(channelIdentitiesTable.customerId, customerId),
      ),
    );
}

/** Move a channel identity onto an existing customer (merge duplicate profiles). */
export async function mergeChannelIdentity(args: {
  businessId: string;
  identityId: string;
  targetCustomerId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const [identity] = await db
    .select()
    .from(channelIdentitiesTable)
    .where(
      and(
        eq(channelIdentitiesTable.id, args.identityId),
        eq(channelIdentitiesTable.businessId, args.businessId),
      ),
    )
    .limit(1);
  if (!identity) return { ok: false, error: "IDENTITY_NOT_FOUND" };

  const [target] = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(
      and(
        eq(customersTable.id, args.targetCustomerId),
        eq(customersTable.businessId, args.businessId),
      ),
    )
    .limit(1);
  if (!target) return { ok: false, error: "TARGET_CUSTOMER_NOT_FOUND" };
  if (identity.customerId === args.targetCustomerId) return { ok: true };

  await db
    .update(channelIdentitiesTable)
    .set({ customerId: args.targetCustomerId, updatedAt: new Date() })
    .where(eq(channelIdentitiesTable.id, args.identityId));

  return { ok: true };
}
