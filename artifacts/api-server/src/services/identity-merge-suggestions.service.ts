import {
  db,
  channelIdentitiesTable,
  customersTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";

export type MergeSuggestion = {
  identityId: string;
  channelType: string;
  externalId: string;
  sourceCustomerId: string;
  sourceCustomerName: string;
  targetCustomerId: string;
  targetCustomerName: string;
  matchReason: "phone" | "email";
};

function normalizePhone(v: string | null | undefined): string | null {
  if (!v) return null;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 8 ? digits.slice(-10) : null;
}

export async function listMergeSuggestions(
  businessId: string,
  limit = 25,
): Promise<{ data: MergeSuggestion[]; total: number }> {
  const identities = await db
    .select({
      id: channelIdentitiesTable.id,
      channelType: channelIdentitiesTable.channelType,
      externalId: channelIdentitiesTable.externalId,
      customerId: channelIdentitiesTable.customerId,
      custPhone: customersTable.phone,
      custEmail: customersTable.email,
      custDisplay: customersTable.displayName,
      custFirst: customersTable.firstName,
      custLast: customersTable.lastName,
    })
    .from(channelIdentitiesTable)
    .innerJoin(customersTable, eq(channelIdentitiesTable.customerId, customersTable.id))
    .where(eq(channelIdentitiesTable.businessId, businessId));

  const customers = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId));

  const byPhone = new Map<string, typeof customers>();
  const byEmail = new Map<string, typeof customers>();

  for (const c of customers) {
    const phone = normalizePhone(c.phone);
    if (phone) {
      const list = byPhone.get(phone) ?? [];
      list.push(c);
      byPhone.set(phone, list);
    }
    const email = c.email?.trim().toLowerCase();
    if (email) {
      const list = byEmail.get(email) ?? [];
      list.push(c);
      byEmail.set(email, list);
    }
  }

  const suggestions: MergeSuggestion[] = [];
  const seen = new Set<string>();

  for (const row of identities) {
    if (!row.customerId) continue;
    const sourceName =
      row.custDisplay ||
      [row.custFirst, row.custLast].filter(Boolean).join(" ").trim() ||
      row.externalId;

    const phoneKey = normalizePhone(row.custPhone ?? row.externalId);
    const emailKey = row.custEmail?.trim().toLowerCase();

    const candidates: Array<{ customer: (typeof customers)[0]; reason: "phone" | "email" }> = [];

    if (phoneKey) {
      for (const c of byPhone.get(phoneKey) ?? []) {
        if (c.id !== row.customerId) candidates.push({ customer: c, reason: "phone" });
      }
    }
    if (emailKey) {
      for (const c of byEmail.get(emailKey) ?? []) {
        if (c.id !== row.customerId) candidates.push({ customer: c, reason: "email" });
      }
    }

    for (const { customer, reason } of candidates) {
      const dedupe = `${row.id}:${customer.id}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      const targetName =
        customer.displayName ||
        [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
        customer.email ||
        customer.phone ||
        "Client";
      suggestions.push({
        identityId: row.id,
        channelType: row.channelType,
        externalId: row.externalId,
        sourceCustomerId: row.customerId,
        sourceCustomerName: sourceName,
        targetCustomerId: customer.id,
        targetCustomerName: targetName,
        matchReason: reason,
      });
      if (suggestions.length >= limit) break;
    }
    if (suggestions.length >= limit) break;
  }

  return { data: suggestions, total: suggestions.length };
}

/** Bulk merge: move all identities from source customer onto target. */
export async function mergeCustomerProfiles(
  businessId: string,
  sourceCustomerId: string,
  targetCustomerId: string,
): Promise<{ mergedIdentities: number }> {
  if (sourceCustomerId === targetCustomerId) {
    return { mergedIdentities: 0 };
  }

  const result = await db
    .update(channelIdentitiesTable)
    .set({ customerId: targetCustomerId, updatedAt: new Date() })
    .where(
      and(
        eq(channelIdentitiesTable.businessId, businessId),
        eq(channelIdentitiesTable.customerId, sourceCustomerId),
      ),
    )
    .returning({ id: channelIdentitiesTable.id });

  return { mergedIdentities: result.length };
}
