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
import { eq, and, desc, gte, inArray, sql, or } from "drizzle-orm";
import {
  curateGuestHubUpcoming,
  guestBookPath,
  guestManageVisitPath,
  guestOtpCodeMatches,
  guestShopRelationshipPath,
  guestPreferredModalitySchema,
  normalizeGuestHubPhone,
  normalizeGuestHubEmail,
  type GuestHubAuthChannel,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { resolveGuestBookUrl } from "../lib/guest-public-urls";
import { getStagingRelaxations } from "../lib/staging-relaxations";
import { deliverGuestHubOtp } from "./guest-hub-otp-delivery.service";
const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sessionToken(): string {
  return randomBytes(24).toString("base64url");
}

function otpCode(): string {
  return String(randomInt(100000, 999999));
}

/** Match customer.phone whether stored as +353871000001 or +353 87 100 0001. */
function customerPhoneMatchesE164(phoneE164: string) {
  const digits = phoneE164.replace(/\D/g, "");
  return sql`regexp_replace(coalesce(${customersTable.phone}, ''), '[^0-9]', '', 'g') = ${digits}`;
}

function customerEmailMatches(email: string) {
  const normalized = email.trim().toLowerCase();
  return sql`lower(trim(coalesce(${customersTable.email}, ''))) = ${normalized}`;
}

function customerMatchesGuest(contact: { phoneE164?: string | null; email?: string | null }) {
  const parts = [];
  if (contact.phoneE164?.trim()) {
    parts.push(customerPhoneMatchesE164(contact.phoneE164));
  }
  if (contact.email?.trim()) {
    parts.push(customerEmailMatches(contact.email));
  }
  if (parts.length === 0) return sql`false`;
  if (parts.length === 1) return parts[0]!;
  return or(...parts);
}

function otpSessionPayload(
  relax: ReturnType<typeof getStagingRelaxations>,
  code: string,
  expires: Date,
  extras: { phoneE164?: string | null; email?: string | null; authChannel: GuestHubAuthChannel },
) {
  const exposeDevOtp = relax.guestHub.exposeDevOtp;
  return {
    ...extras,
    /** Relaxed staging/local — code shown in UI instead of SMS/email. */
    devOtp: exposeDevOtp ? code : undefined,
    magicOtpCode: relax.guestHub.magicOtpCode ?? undefined,
    otpMode: relax.guestHub.otpMode,
    expiresAt: expires.toISOString(),
  };
}

export async function requestGuestHubOtp(
  input: string | { phone?: string; email?: string; country?: string },
  defaultCountry = "IE",
) {
  const body =
    typeof input === "string"
      ? { phone: input, country: defaultCountry }
      : { country: defaultCountry, ...input };

  if (body.email?.trim()) {
    return requestGuestHubEmailOtp(body.email);
  }
  if (!body.phone?.trim()) throw new Error("INVALID_IDENTIFIER");
  return requestGuestHubPhoneOtp(body.phone, body.country ?? defaultCountry);
}

export async function requestGuestHubPhoneOtp(rawPhone: string, defaultCountry = "IE") {
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
    authChannel: "phone",
    otpCode: code,
    otpExpiresAt: expires,
  });

  await deliverGuestHubOtp({ channel: "phone", phoneE164, code });

  return {
    sessionToken: token,
    ...otpSessionPayload(relax, code, expires, { phoneE164, authChannel: "phone" }),
  };
}

export async function requestGuestHubEmailOtp(rawEmail: string) {
  const email = normalizeGuestHubEmail(rawEmail);
  if (!email) throw new Error("INVALID_EMAIL");

  const relax = getStagingRelaxations();
  const token = sessionToken();
  const code = otpCode();
  const expires = new Date(Date.now() + OTP_TTL_MS);

  await db.insert(guestSessionsTable).values({
    token,
    email,
    authChannel: "email",
    otpCode: code,
    otpExpiresAt: expires,
  });

  await deliverGuestHubOtp({ channel: "email", email, code });

  return {
    sessionToken: token,
    ...otpSessionPayload(relax, code, expires, { email, authChannel: "email" }),
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
  const authChannel = (session.authChannel ?? "phone") as GuestHubAuthChannel;
  if (!guestId) {
    const [existing] = session.email
      ? await db
          .select({ id: guestIdentitiesTable.id })
          .from(guestIdentitiesTable)
          .where(eq(guestIdentitiesTable.email, session.email))
          .limit(1)
      : await db
          .select({ id: guestIdentitiesTable.id })
          .from(guestIdentitiesTable)
          .where(eq(guestIdentitiesTable.phoneE164, session.phoneE164!))
          .limit(1);
    guestId = existing?.id ?? generateId();
    if (!existing) {
      await db.insert(guestIdentitiesTable).values({
        id: guestId,
        phoneE164: session.phoneE164 ?? null,
        email: session.email ?? null,
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
    phoneE164: session.phoneE164 ?? null,
    email: session.email ?? null,
    authChannel,
    verifiedAt: new Date(),
  });

  return {
    ok: true as const,
    hubToken,
    guestId,
    authChannel,
    isNewGuest: !session.guestId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
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

  const [guestIdentity] = await db
    .select({
      preferredModality: guestIdentitiesTable.preferredModality,
      phoneE164: guestIdentitiesTable.phoneE164,
      email: guestIdentitiesTable.email,
      displayName: guestIdentitiesTable.displayName,
      createdAt: guestIdentitiesTable.createdAt,
      welcomeCompletedAt: guestIdentitiesTable.welcomeCompletedAt,
    })
    .from(guestIdentitiesTable)
    .where(eq(guestIdentitiesTable.id, session.guestId))
    .limit(1);

  const guestContact = {
    phoneE164: guestIdentity?.phoneE164 ?? session.phoneE164,
    email: guestIdentity?.email ?? session.email,
  };

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
            notes: bookingsTable.notes,
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
              customerMatchesGuest(guestContact),
              inArray(bookingsTable.businessId, businessIds),
              gte(bookingsTable.startAt, now),
              inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
            ),
          )
          .orderBy(bookingsTable.startAt)
          .limit(40)
      : [];

  const upcomingCurated = curateGuestHubUpcoming(
    upcomingRaw.map((b) => ({
      bookingId: b.bookingId,
      businessId: b.businessId,
      startAt: b.startAt,
      status: b.status,
      notes: b.notes,
    })),
  );
  const curatedIds = new Set(upcomingCurated.map((b) => b.bookingId));
  const upcomingFiltered = upcomingRaw.filter((b) => curatedIds.has(b.bookingId));

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
              customerMatchesGuest(guestContact),
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

  const upcomingBookings = upcomingFiltered.map((b) => ({
    bookingId: b.bookingId,
    businessId: b.businessId,
    businessName: b.businessName,
    slug: b.slug,
    status: b.status,
    startAt: b.startAt.toISOString(),
    serviceName: b.serviceName,
    staffDisplayName: b.staffDisplayName,
    visitUrl: guestManageVisitPath(b.slug, b.bookingId),
  }));

  const visitByBusiness = new Map(
    upcomingBookings.map((b) => [b.businessId, b.visitUrl] as const),
  );

  const { listGuestPackageCreditsForGuest } = await import("./package-credits.service");
  const packageCredits = await listGuestPackageCreditsForGuest(session.guestId, guestContact);

  const shopsMapped = shops.map((s) => {
      const last = lastByBusiness.get(s.businessId);
      const bookUrl = last
        ? resolveGuestBookUrl(s.slug, `service=${encodeURIComponent(last.serviceId)}&hub=1`)
        : resolveGuestBookUrl(s.slug, "hub=1");
      return {
        ...s,
        firstBookingAt: s.firstBookingAt?.toISOString() ?? null,
        consentAt: s.consentAt.toISOString(),
        isFavorite: favoriteSet.has(s.businessId),
        bookUrl,
        shopRelationshipUrl: guestShopRelationshipPath(s.slug),
        manageVisitUrl: visitByBusiness.get(s.businessId) ?? null,
        lastServiceName: last?.serviceName ?? null,
      };
    });

  return {
    guestId: session.guestId,
    phoneE164: guestContact.phoneE164 ?? "",
    email: guestContact.email ?? null,
    displayName: guestIdentity?.displayName ?? null,
    authChannel: (session.authChannel ?? "phone") as GuestHubAuthChannel,
    memberSince: guestIdentity?.createdAt?.toISOString() ?? null,
    welcomeCompleted: Boolean(guestIdentity?.welcomeCompletedAt),
    isColdStart: shopsMapped.length === 0 && upcomingBookings.length === 0,
    preferredModality: guestIdentity?.preferredModality ?? "ANY",
    packageCredits,
    upcomingBookings,
    shops: shopsMapped,
  };
}

export async function patchGuestHubPreferences(
  hubToken: string,
  body: { preferredModality?: string; displayName?: string; welcomeCompleted?: boolean },
) {
  const session = await getGuestHubSession(hubToken);
  if (!session?.guestId) return null;

  const updates: {
    preferredModality?: string;
    displayName?: string | null;
    welcomeCompletedAt?: Date | null;
  } = {};

  if (body.preferredModality != null) {
    const parsed = guestPreferredModalitySchema.safeParse(body.preferredModality);
    if (!parsed.success) throw new Error("INVALID_PREFERENCE");
    updates.preferredModality = parsed.data;
  }

  if (body.displayName != null) {
    const trimmed = body.displayName.trim();
    updates.displayName = trimmed.length > 0 ? trimmed.slice(0, 80) : null;
  }

  if (body.welcomeCompleted === true) {
    updates.welcomeCompletedAt = new Date();
  } else if (body.welcomeCompleted === false) {
    updates.welcomeCompletedAt = null;
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(guestIdentitiesTable)
      .set(updates)
      .where(eq(guestIdentitiesTable.id, session.guestId));
  }

  return getGuestHubView(hubToken);
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
  if (!row?.slug || !row.bookingId) return null;
  return guestManageVisitPath(row.slug, row.bookingId);
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
