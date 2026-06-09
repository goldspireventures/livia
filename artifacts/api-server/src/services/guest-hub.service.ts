import { randomBytes, randomInt } from "node:crypto";
import {
  db,
  bookingGuestAccessTable,
  guestFavoritesTable,
  guestIdentitiesTable,
  guestSessionsTable,
  guestShopLinksTable,
  businessesTable,
  bookingsTable,
  customersTable,
  servicesTable,
  staffTable,
} from "@workspace/db";
import { eq, and, desc, gte, inArray } from "drizzle-orm";
import {
  guestManageVisitPath,
  guestOtpCodeMatches,
  guestShopRelationshipPath,
  migrateLegacyGuestBookPath,
  normalizeGuestHubPhone,
} from "@workspace/policy";
import { resolveGuestBookUrl } from "../lib/guest-public-urls";
import { resolveDemoVerticalImageUrl } from "../lib/demo-public-assets";
import { generateId } from "../lib/id";
import { getStagingRelaxations } from "../lib/staging-relaxations";
import type { BusinessVertical } from "@workspace/policy";
import { ensureBookingGuestAccess } from "./booking-guest-access.service";

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sessionToken(): string {
  return randomBytes(24).toString("base64url");
}

function otpCode(): string {
  return String(randomInt(100000, 999999));
}

function resolveGuestShopImageUrl(shop: {
  logoUrl: string | null;
  coverImageUrl: string | null;
  vertical: string;
}): string | null {
  const logo = shop.logoUrl?.trim();
  if (logo) return logo;
  const cover = shop.coverImageUrl?.trim();
  if (cover) return cover;
  return resolveDemoVerticalImageUrl(shop.vertical as BusinessVertical);
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
      coverImageUrl: businessesTable.coverImageUrl,
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

  const businessIds = shops.map((s) => s.businessId);
  const now = new Date();

  const upcomingRaw =
    businessIds.length > 0
      ? await db
          .select({
            bookingId: bookingsTable.id,
            businessId: bookingsTable.businessId,
            status: bookingsTable.status,
            startAt: bookingsTable.startAt,
            serviceName: servicesTable.name,
            serviceId: bookingsTable.serviceId,
            staffDisplayName: staffTable.displayName,
            businessName: businessesTable.name,
            slug: businessesTable.slug,
          })
          .from(bookingsTable)
          .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
          .innerJoin(businessesTable, eq(bookingsTable.businessId, businessesTable.id))
          .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
          .leftJoin(staffTable, eq(bookingsTable.staffId, staffTable.id))
          .where(
            and(
              eq(customersTable.phone, session.phoneE164),
              inArray(bookingsTable.businessId, businessIds),
              gte(bookingsTable.startAt, now),
              inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
            ),
          )
          .orderBy(bookingsTable.startAt)
          .limit(25)
      : [];

  const lastBookRaw =
    businessIds.length > 0
      ? await db
          .select({
            businessId: bookingsTable.businessId,
            serviceId: bookingsTable.serviceId,
            serviceName: servicesTable.name,
            startAt: bookingsTable.startAt,
          })
          .from(bookingsTable)
          .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
          .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
          .where(
            and(
              eq(customersTable.phone, session.phoneE164),
              inArray(bookingsTable.businessId, businessIds),
              inArray(bookingsTable.status, ["PENDING", "CONFIRMED", "COMPLETED"]),
            ),
          )
          .orderBy(desc(bookingsTable.startAt))
          .limit(50)
      : [];

  const lastByBusiness = new Map<string, { serviceId: string; serviceName: string }>();
  for (const row of lastBookRaw) {
    if (!lastByBusiness.has(row.businessId)) {
      lastByBusiness.set(row.businessId, {
        serviceId: row.serviceId,
        serviceName: row.serviceName,
      });
    }
  }

  const upcomingBookings = await Promise.all(
    upcomingRaw.map(async (b) => {
      const visitToken = await ensureBookingGuestAccess(b.businessId, b.bookingId);
      return {
        bookingId: b.bookingId,
        businessId: b.businessId,
        businessName: b.businessName,
        slug: b.slug,
        status: b.status,
        startAt: b.startAt.toISOString(),
        serviceName: b.serviceName,
        staffDisplayName: b.staffDisplayName,
        visitUrl: guestManageVisitPath(b.slug, b.bookingId),
        visitToken,
      };
    }),
  );

  const visitByBusiness = new Map(
    upcomingBookings.map((b) => [b.businessId, b.visitUrl] as const),
  );

  const { listGuestPackageCreditsForGuest } = await import("./package-credits.service");
  const packageCredits = await listGuestPackageCreditsForGuest(
    session.guestId,
    session.phoneE164,
  );

  const customersForGuest =
    businessIds.length > 0 && session.phoneE164
      ? await db
          .select({
            businessId: customersTable.businessId,
            customerId: customersTable.id,
          })
          .from(customersTable)
          .where(
            and(
              eq(customersTable.phone, session.phoneE164),
              inArray(customersTable.businessId, businessIds),
            ),
          )
      : [];
  const customerByBusiness = new Map(
    customersForGuest.map((c) => [c.businessId, c.customerId] as const),
  );

  const {
    loadGuestVerticalArtifacts,
    summarizeGuestShopHint,
  } = await import("./guest-hub-vertical-artifacts.service");

  const relationshipHintByBusiness = new Map<string, string | null>();
  await Promise.all(
    shops.map(async (s) => {
      const customerId = customerByBusiness.get(s.businessId);
      if (!customerId) {
        relationshipHintByBusiness.set(s.businessId, null);
        return;
      }
      const artifacts = await loadGuestVerticalArtifacts({
        businessId: s.businessId,
        customerId,
        slug: s.slug,
        vertical: s.vertical,
      });
      const pack = packageCredits.find((p) => p.slug === s.slug);
      relationshipHintByBusiness.set(
        s.businessId,
        summarizeGuestShopHint(artifacts, pack ?? null),
      );
    }),
  );

  const [guestRow] = await db
    .select({ preferredModality: guestIdentitiesTable.preferredModality })
    .from(guestIdentitiesTable)
    .where(eq(guestIdentitiesTable.id, session.guestId))
    .limit(1);

  return {
    guestId: session.guestId,
    phoneE164: session.phoneE164,
    preferredModality: guestRow?.preferredModality ?? "ANY",
    packageCredits,
    upcomingBookings,
    shops: shops.map((s) => {
      const last = lastByBusiness.get(s.businessId);
      const bookQuery = last ? `service=${encodeURIComponent(last.serviceId)}` : "";
      const bookUrl = resolveGuestBookUrl(s.slug, bookQuery);
      const imageUrl = resolveGuestShopImageUrl(s);
      return {
        ...s,
        imageUrl,
        firstBookingAt: s.firstBookingAt?.toISOString() ?? null,
        consentAt: s.consentAt.toISOString(),
        isFavorite: favoriteSet.has(s.businessId),
        bookUrl,
        bookPath: `/book/${s.slug}${bookQuery ? `?${bookQuery}` : ""}`,
        shopRelationshipUrl: guestShopRelationshipPath(s.slug),
        manageVisitUrl: visitByBusiness.get(s.businessId) ?? null,
        lastServiceName: last?.serviceName ?? null,
        relationshipHint: relationshipHintByBusiness.get(s.businessId) ?? null,
      };
    }),
  };
}

/** Resolve legacy `/my?visit=token` links to the public visit route. */
export async function resolveGuestVisitPath(token: string): Promise<string | null> {
  const [row] = await db
    .select({
      slug: businessesTable.slug,
      bookingId: bookingGuestAccessTable.bookingId,
    })
    .from(bookingGuestAccessTable)
    .innerJoin(businessesTable, eq(bookingGuestAccessTable.businessId, businessesTable.id))
    .where(eq(bookingGuestAccessTable.token, token))
    .limit(1);
  if (!row?.slug) return null;
  const booking = row;
  if (booking?.bookingId) {
    return guestManageVisitPath(row.slug, booking.bookingId);
  }
  return migrateLegacyGuestBookPath(`/book/${row.slug}/visit/${encodeURIComponent(token)}`);
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

const VALID_MODALITIES = new Set([
  "VOICE",
  "WHATSAPP",
  "SMS",
  "EMAIL",
  "INSTAGRAM",
  "WEB",
  "ANY",
]);

export async function updateGuestPreferredModality(
  hubToken: string,
  modality: string,
): Promise<Awaited<ReturnType<typeof getGuestHubView>> | null> {
  const session = await getGuestHubSession(hubToken);
  if (!session?.guestId) return null;
  const next = VALID_MODALITIES.has(modality) ? modality : "ANY";
  await db
    .update(guestIdentitiesTable)
    .set({ preferredModality: next })
    .where(eq(guestIdentitiesTable.id, session.guestId));

  if (session.phoneE164) {
    await db
      .update(customersTable)
      .set({ preferredModality: next as typeof customersTable.$inferSelect.preferredModality })
      .where(eq(customersTable.phone, session.phoneE164));
  }

  return getGuestHubView(hubToken);
}
