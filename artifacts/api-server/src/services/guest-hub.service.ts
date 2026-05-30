import { randomBytes, randomInt } from "node:crypto";
import {
  db,
  guestFavoritesTable,
  guestIdentitiesTable,
  guestSessionsTable,
  guestShopLinksTable,
  businessesTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  guestOtpCodeMatches,
  normalizeGuestHubPhone,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { getStagingRelaxations } from "../lib/staging-relaxations";

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sessionToken(): string {
  return randomBytes(24).toString("base64url");
}

function otpCode(): string {
  return String(randomInt(100000, 999999));
}

export async function requestGuestHubOtp(rawPhone: string, defaultCountry = "IE") {
  const relax = getStagingRelaxations();
  const phoneMode = relax.active ? relax.guestHub.phoneMode : "strict";
  const phoneE164 = normalizeGuestHubPhone(rawPhone, defaultCountry, phoneMode);
  if (!phoneE164) throw new Error("INVALID_PHONE");

  const token = sessionToken();
  const code = otpCode();
  const expires = new Date(Date.now() + OTP_TTL_MS);

  await db.insert(guestSessionsTable).values({
    token,
    phoneE164,
    otpCode: code,
    otpExpiresAt: expires,
  });

  const exposeDevOtp = relax.guestHub.exposeDevOtp;

  return {
    sessionToken: token,
    phoneE164,
    /** Relaxed staging/local — code shown in UI instead of SMS. */
    devOtp: exposeDevOtp ? code : undefined,
    magicOtpCode: relax.guestHub.magicOtpCode ?? undefined,
    otpMode: relax.guestHub.otpMode,
    expiresAt: expires.toISOString(),
  };
}

export async function verifyGuestHubOtp(sessionTokenValue: string, code: string) {
  const [session] = await db
    .select()
    .from(guestSessionsTable)
    .where(eq(guestSessionsTable.token, sessionTokenValue))
    .limit(1);
  if (!session?.otpCode || !session.otpExpiresAt) return { ok: false as const, reason: "not_found" as const };
  if (session.otpExpiresAt.getTime() < Date.now()) {
    return { ok: false as const, reason: "expired" as const };
  }
  const relax = getStagingRelaxations();
  const otpMode = relax.active ? relax.guestHub.otpMode : "strict";
  if (!guestOtpCodeMatches(session.otpCode, code, otpMode, relax.guestHub.magicOtpCode)) {
    return { ok: false as const, reason: "invalid_code" as const };
  }

  let guestId = session.guestId;
  if (!guestId) {
    const [existing] = await db
      .select({ id: guestIdentitiesTable.id })
      .from(guestIdentitiesTable)
      .where(eq(guestIdentitiesTable.phoneE164, session.phoneE164))
      .limit(1);
    guestId = existing?.id ?? generateId();
    if (!existing) {
      await db.insert(guestIdentitiesTable).values({
        id: guestId,
        phoneE164: session.phoneE164,
        verifiedAt: new Date(),
      });
    } else {
      await db
        .update(guestIdentitiesTable)
        .set({ verifiedAt: new Date() })
        .where(eq(guestIdentitiesTable.id, guestId));
    }
  }

  const hubToken = sessionToken();
  await db.insert(guestSessionsTable).values({
    token: hubToken,
    guestId,
    phoneE164: session.phoneE164,
    verifiedAt: new Date(),
  });

  return { ok: true as const, hubToken, guestId, expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() };
}

export async function getGuestHubSession(hubToken: string) {
  const [session] = await db
    .select()
    .from(guestSessionsTable)
    .where(eq(guestSessionsTable.token, hubToken))
    .limit(1);
  if (!session?.guestId || !session.verifiedAt) return null;
  const created = session.createdAt.getTime();
  if (Date.now() - created > SESSION_TTL_MS) return null;
  return session;
}

export async function getGuestHubView(hubToken: string) {
  const session = await getGuestHubSession(hubToken);
  if (!session?.guestId) return null;

  const shops = await db
    .select({
      businessId: guestShopLinksTable.businessId,
      businessName: businessesTable.name,
      slug: businessesTable.slug,
      vertical: businessesTable.vertical,
      logoUrl: businessesTable.logoUrl,
      firstBookingAt: guestShopLinksTable.firstBookingAt,
      consentAt: guestShopLinksTable.consentAt,
    })
    .from(guestShopLinksTable)
    .innerJoin(businessesTable, eq(guestShopLinksTable.businessId, businessesTable.id))
    .where(eq(guestShopLinksTable.guestId, session.guestId))
    .orderBy(desc(guestShopLinksTable.consentAt));

  const favorites = await db
    .select({ businessId: guestFavoritesTable.businessId })
    .from(guestFavoritesTable)
    .where(eq(guestFavoritesTable.guestId, session.guestId));

  const favoriteSet = new Set(favorites.map((f) => f.businessId));

  return {
    guestId: session.guestId,
    phoneE164: session.phoneE164,
    shops: shops.map((s) => ({
      ...s,
      firstBookingAt: s.firstBookingAt?.toISOString() ?? null,
      consentAt: s.consentAt.toISOString(),
      isFavorite: favoriteSet.has(s.businessId),
      bookUrl: `/b/${s.slug}`,
    })),
  };
}

export async function linkGuestToShop(guestId: string, businessId: string, firstBookingAt?: Date) {
  await db
    .insert(guestShopLinksTable)
    .values({
      guestId,
      businessId,
      firstBookingAt: firstBookingAt ?? null,
      consentAt: new Date(),
    })
    .onConflictDoNothing();
}

export async function toggleGuestFavorite(hubToken: string, businessId: string, pinned: boolean) {
  const session = await getGuestHubSession(hubToken);
  if (!session?.guestId) return null;

  const [linked] = await db
    .select({ guestId: guestShopLinksTable.guestId })
    .from(guestShopLinksTable)
    .where(
      and(
        eq(guestShopLinksTable.guestId, session.guestId),
        eq(guestShopLinksTable.businessId, businessId),
      ),
    )
    .limit(1);
  if (!linked) throw new Error("SHOP_NOT_LINKED");

  if (pinned) {
    await db
      .insert(guestFavoritesTable)
      .values({ guestId: session.guestId, businessId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(guestFavoritesTable)
      .where(
        and(
          eq(guestFavoritesTable.guestId, session.guestId),
          eq(guestFavoritesTable.businessId, businessId),
        ),
      );
  }
  return getGuestHubView(hubToken);
}

/** Opt-in from public book — creates vault row + shop link before OTP verify. */
export async function ensureGuestVaultLinkFromBook(
  phoneRaw: string,
  businessId: string,
  bookingStartAt: Date,
  defaultCountry = "IE",
) {
  const relax = getStagingRelaxations();
  const phoneMode = relax.active ? relax.guestHub.phoneMode : "strict";
  const phoneE164 = normalizeGuestHubPhone(phoneRaw, defaultCountry, phoneMode);
  if (!phoneE164) return null;

  const [existingGuest] = await db
    .select({ id: guestIdentitiesTable.id })
    .from(guestIdentitiesTable)
    .where(eq(guestIdentitiesTable.phoneE164, phoneE164))
    .limit(1);

  const guestId = existingGuest?.id ?? generateId();
  if (!existingGuest) {
    await db.insert(guestIdentitiesTable).values({
      id: guestId,
      phoneE164,
    });
  }

  await linkGuestToShop(guestId, businessId, bookingStartAt);
  return { guestId, phoneE164, myLiviaPath: "/my" };
}
