import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { messagingChannelsSchema, parseMessagingChannels, type MessagingChannels } from "@workspace/policy";

export async function getMessagingChannels(businessId: string): Promise<MessagingChannels> {
  const [row] = await db
    .select({ messagingChannels: businessesTable.messagingChannels })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  return parseMessagingChannels(row?.messagingChannels);
}

export async function updateMessagingChannels(
  businessId: string,
  patch: MessagingChannels,
): Promise<MessagingChannels> {
  const current = await getMessagingChannels(businessId);
  const merged = messagingChannelsSchema.parse({ ...current, ...patch });
  await db
    .update(businessesTable)
    .set({ messagingChannels: merged as unknown as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(businessesTable.id, businessId));
  return merged;
}

export async function findBusinessByMessagingLookup(lookup: {
  whatsappPhoneNumberId?: string;
  instagramPageId?: string;
  messengerPageId?: string;
}) {
  const rows = await db
    .select()
    .from(businessesTable)
    .limit(500);

  for (const row of rows) {
    const ch = parseMessagingChannels(row.messagingChannels);
    if (
      lookup.whatsappPhoneNumberId &&
      ch.whatsapp?.phoneNumberId === lookup.whatsappPhoneNumberId
    ) {
      return row;
    }
    if (lookup.instagramPageId && ch.instagram?.pageId === lookup.instagramPageId) {
      return row;
    }
    if (lookup.messengerPageId && ch.messenger?.pageId === lookup.messengerPageId) {
      return row;
    }
  }
  return null;
}
