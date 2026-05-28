import {
  db,
  businessesTable,
  premisesTable,
  premisesTenantsTable,
  channelPremisesRoutingTable,
} from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { generateId } from "../lib/id";
import { getPremisesDetail } from "./premises.service";

export type ChannelRouteResult =
  | { kind: "business"; business: typeof businessesTable.$inferSelect }
  | { kind: "menu_required"; premisesId: string; menuText: string }
  | { kind: "not_found" };

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").trim();
}

export async function findPremisesBySharedPhone(
  toNumber: string,
): Promise<typeof premisesTable.$inferSelect | null> {
  const normalized = normalizePhone(toNumber);
  const [row] = await db
    .select()
    .from(premisesTable)
    .where(eq(premisesTable.sharedPhone, normalized));
  return row ?? null;
}

export async function findPremisesBySharedWhatsappId(
  phoneNumberId: string,
): Promise<typeof premisesTable.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(premisesTable)
    .where(eq(premisesTable.sharedWhatsappPhoneNumberId, phoneNumberId));
  return row ?? null;
}

function buildTenantMenu(
  tenants: Array<{ publicLabel: string; sortOrder: number }>,
): string {
  const lines = tenants
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t, i) => `${i + 1}. ${t.publicLabel}`);
  return `Welcome — who would you like to reach?\n${lines.join("\n")}\n\nReply with the number.`;
}

export async function resolveInboundSmsBusiness(
  toNumber: string,
  fromNumber: string,
  body: string,
): Promise<ChannelRouteResult> {
  const normalizedTo = normalizePhone(toNumber);
  const normalizedFrom = normalizePhone(fromNumber);

  const [directBiz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.twilioPhoneNumber, normalizedTo));
  if (directBiz) return { kind: "business", business: directBiz };

  const premises = await findPremisesBySharedPhone(normalizedTo);
  if (!premises) return { kind: "not_found" };

  const detail = await getPremisesDetail(premises.id);
  if (!detail || detail.tenants.length === 0) return { kind: "not_found" };

  if (detail.tenants.length === 1) {
    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, detail.tenants[0].businessId));
    if (biz) return { kind: "business", business: biz };
    return { kind: "not_found" };
  }

  const [routing] = await db
    .select()
    .from(channelPremisesRoutingTable)
    .where(
      and(
        eq(channelPremisesRoutingTable.premisesId, premises.id),
        eq(channelPremisesRoutingTable.customerPhone, normalizedFrom),
      ),
    );

  const trimmed = body.trim();
  const digit = /^[1-9]$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null;

  if (digit !== null && digit >= 1 && digit <= detail.tenants.length) {
    const tenant = [...detail.tenants].sort((a, b) => a.sortOrder - b.sortOrder)[digit - 1];
    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, tenant.businessId));

    if (biz) {
      if (routing) {
        await db
          .update(channelPremisesRoutingTable)
          .set({
            selectedBusinessId: biz.id,
            pendingMenuSentAt: null,
            updatedAt: new Date(),
          })
          .where(eq(channelPremisesRoutingTable.id, routing.id));
      } else {
        await db.insert(channelPremisesRoutingTable).values({
          id: generateId(),
          premisesId: premises.id,
          customerPhone: normalizedFrom,
          selectedBusinessId: biz.id,
        });
      }
      return { kind: "business", business: biz };
    }
  }

  if (routing?.selectedBusinessId) {
    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, routing.selectedBusinessId));
    if (biz) return { kind: "business", business: biz };
  }

  const tenantRows = await db
    .select({
      publicLabel: premisesTenantsTable.publicLabel,
      sortOrder: premisesTenantsTable.sortOrder,
    })
    .from(premisesTenantsTable)
    .where(eq(premisesTenantsTable.premisesId, premises.id))
    .orderBy(asc(premisesTenantsTable.sortOrder));

  const menuText = buildTenantMenu(tenantRows);

  if (routing) {
    await db
      .update(channelPremisesRoutingTable)
      .set({ pendingMenuSentAt: new Date(), updatedAt: new Date() })
      .where(eq(channelPremisesRoutingTable.id, routing.id));
  } else {
    await db.insert(channelPremisesRoutingTable).values({
      id: generateId(),
      premisesId: premises.id,
      customerPhone: normalizedFrom,
      pendingMenuSentAt: new Date(),
    });
  }

  return { kind: "menu_required", premisesId: premises.id, menuText };
}

export async function resolveInboundWhatsappBusiness(
  phoneNumberId: string,
  fromNumber: string,
  body: string,
): Promise<ChannelRouteResult> {
  const premises = await findPremisesBySharedWhatsappId(phoneNumberId);
  if (!premises?.sharedPhone) {
    return { kind: "not_found" };
  }
  return resolveInboundSmsBusiness(premises.sharedPhone, fromNumber, body);
}
