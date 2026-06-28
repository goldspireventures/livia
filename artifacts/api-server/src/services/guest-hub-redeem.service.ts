import {
  db,
  businessesTable,
  customersTable,
  guestIdentitiesTable,
  packageCreditLedgerTable,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { generateId } from "../lib/id";
import {
  getGuestHubSession,
  getGuestHubView,
  linkGuestToShop,
} from "./guest-hub.service";
import { findBrandWideRedemptionCode } from "./wellness-guest-vault.service";

function customerEmailMatches(email: string) {
  const normalized = email.trim().toLowerCase();
  return sql`lower(trim(coalesce(${customersTable.email}, ''))) = ${normalized}`;
}

function customerPhoneMatchesE164(phoneE164: string) {
  const digits = phoneE164.replace(/\D/g, "");
  return sql`regexp_replace(coalesce(${customersTable.phone}, ''), '[^0-9]', '', 'g') = ${digits}`;
}

async function ensureGuestCustomerAtBusiness(
  guestId: string,
  businessId: string,
  contact: { phoneE164?: string | null; email?: string | null },
): Promise<string> {
  const phone = contact.phoneE164?.trim() || null;
  const email = contact.email?.trim().toLowerCase() || null;

  if (phone) {
    const [byPhone] = await db
      .select({ id: customersTable.id })
      .from(customersTable)
      .where(and(eq(customersTable.businessId, businessId), customerPhoneMatchesE164(phone)))
      .limit(1);
    if (byPhone) return byPhone.id;
  }

  if (email) {
    const [byEmail] = await db
      .select({ id: customersTable.id })
      .from(customersTable)
      .where(and(eq(customersTable.businessId, businessId), customerEmailMatches(email)))
      .limit(1);
    if (byEmail) return byEmail.id;
  }

  const id = generateId();
  const [guest] = await db
    .select({
      displayName: guestIdentitiesTable.displayName,
      phoneE164: guestIdentitiesTable.phoneE164,
      email: guestIdentitiesTable.email,
    })
    .from(guestIdentitiesTable)
    .where(eq(guestIdentitiesTable.id, guestId))
    .limit(1);

  await db.insert(customersTable).values({
    id,
    businessId,
    displayName:
      guest?.displayName?.trim() ||
      (phone ? "Guest" : email?.split("@")[0] || "Guest"),
    phone: guest?.phoneE164 ?? phone,
    email: guest?.email ?? email,
  });

  return id;
}

async function findLedgerByRedemptionCode(code: string) {
  const brand = await findBrandWideRedemptionCode(code);
  if (brand) {
    const [biz] = await db
      .select({ name: businessesTable.name, slug: businessesTable.slug })
      .from(businessesTable)
      .where(eq(businessesTable.id, brand.businessId))
      .limit(1);
    return {
      ledger: brand.ledger,
      businessId: brand.businessId,
      businessName: biz?.name ?? "Business",
      slug: biz?.slug ?? "",
    };
  }

  const normalized = code.trim().toUpperCase();
  const [row] = await db
    .select({
      ledger: packageCreditLedgerTable,
      businessId: businessesTable.id,
      businessName: businessesTable.name,
      slug: businessesTable.slug,
    })
    .from(packageCreditLedgerTable)
    .innerJoin(businessesTable, eq(packageCreditLedgerTable.businessId, businessesTable.id))
    .where(eq(packageCreditLedgerTable.redemptionCode, normalized))
    .limit(1);

  if (!row) return null;
  return {
    ledger: row.ledger,
    businessId: row.businessId,
    businessName: row.businessName,
    slug: row.slug ?? "",
  };
}

export type GuestHubRedeemResult =
  | { ok: true; view: NonNullable<Awaited<ReturnType<typeof getGuestHubView>>>; packageName: string; businessName: string }
  | { ok: false; reason: "session" | "invalid" | "not_found" | "depleted" | "not_for_account" };

export async function redeemGuestHubPackCode(
  hubToken: string,
  rawCode: string,
): Promise<GuestHubRedeemResult> {
  const session = await getGuestHubSession(hubToken);
  if (!session?.guestId) return { ok: false, reason: "session" };

  const code = rawCode.trim();
  if (!code) return { ok: false, reason: "invalid" };

  const match = await findLedgerByRedemptionCode(code);
  if (!match) return { ok: false, reason: "not_found" };
  if (match.ledger.creditsRemaining <= 0) return { ok: false, reason: "depleted" };

  const [guest] = await db
    .select({
      phoneE164: guestIdentitiesTable.phoneE164,
      email: guestIdentitiesTable.email,
    })
    .from(guestIdentitiesTable)
    .where(eq(guestIdentitiesTable.id, session.guestId))
    .limit(1);
  if (!guest) return { ok: false, reason: "session" };

  await linkGuestToShop(session.guestId, match.businessId);
  const customerId = await ensureGuestCustomerAtBusiness(session.guestId, match.businessId, {
    phoneE164: guest.phoneE164 ?? session.phoneE164,
    email: guest.email ?? session.email,
  });

  const ledgerOwnerId = match.ledger.customerId;
  if (ledgerOwnerId && ledgerOwnerId !== customerId) {
    return { ok: false, reason: "not_for_account" };
  }

  if (!ledgerOwnerId) {
    await db
      .update(packageCreditLedgerTable)
      .set({ customerId, updatedAt: new Date() })
      .where(eq(packageCreditLedgerTable.id, match.ledger.id));
  }

  const view = await getGuestHubView(hubToken);
  if (!view) return { ok: false, reason: "session" };

  return {
    ok: true,
    view,
    packageName: match.ledger.packageName,
    businessName: match.businessName,
  };
}
