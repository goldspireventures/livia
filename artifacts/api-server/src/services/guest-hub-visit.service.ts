import {
  db,
  bookingsTable,
  businessesTable,
  customersTable,
  servicesTable,
  staffTable,
  conversationsTable,
  conversationMessagesTable,
} from "@workspace/db";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import {
  guestManageVisitPath,
  guestShopRelationshipPath,
  guestMyVisitPrep,
  guestPublicExperience,
  guestVisitDepositLine,
  normalizePhoneE164,
  parseBeautyPreferences,
  beautyClientPatchTestLabel,
  type BusinessVertical,
} from "@workspace/policy";
import { resolveGuestBookUrl, resolveGuestTokenUrl } from "../lib/guest-public-urls";
import { generateId } from "../lib/id";
import { getGuestHubSession } from "./guest-hub.service";
import { ensureBookingGuestAccess } from "./booking-guest-access.service";
import { createConversation } from "./conversations.service";
import { getRelationshipSummary } from "./relationship.service";
import { listGuestPackageCreditsForGuest } from "./package-credits.service";
import { loadGuestVerticalArtifacts } from "./guest-hub-vertical-artifacts.service";
import { fanOutSideEffect } from "../lib/side-effect-emitter";

function guestBookUrlForSlug(slug: string, query = ""): string {
  return resolveGuestBookUrl(slug, query);
}

async function assertGuestBookingAccess(
  hubToken: string,
  slug: string,
  bookingId: string,
): Promise<{
  session: NonNullable<Awaited<ReturnType<typeof getGuestHubSession>>>;
  booking: {
    bookingId: string;
    businessId: string;
    businessName: string;
    slug: string;
    vertical: string | null;
    logoUrl: string | null;
    timezone: string;
    status: string;
    pendingReason: string | null;
    startAt: Date;
    endAt: Date;
    serviceName: string;
    serviceId: string;
    staffDisplayName: string | null;
    customerId: string;
    customerFirstName: string | null;
    customerPhone: string | null;
    priceMinor: number;
    currency: string;
    depositPaidEurCents: number;
  };
}> {
  const session = await getGuestHubSession(hubToken);
  if (!session?.guestId || !session.phoneE164) {
    throw new Error("UNAUTHORIZED");
  }

  const [row] = await db
    .select({
      bookingId: bookingsTable.id,
      businessId: bookingsTable.businessId,
      status: bookingsTable.status,
      pendingReason: bookingsTable.pendingReason,
      startAt: bookingsTable.startAt,
      endAt: bookingsTable.endAt,
      depositPaidEurCents: bookingsTable.depositPaidEurCents,
      businessName: businessesTable.name,
      slug: businessesTable.slug,
      vertical: businessesTable.vertical,
      logoUrl: businessesTable.logoUrl,
      timezone: businessesTable.timezone,
      serviceName: servicesTable.name,
      serviceId: bookingsTable.serviceId,
      priceMinor: servicesTable.priceMinor,
      currency: servicesTable.currency,
      staffDisplayName: staffTable.displayName,
      customerId: customersTable.id,
      customerFirstName: customersTable.firstName,
      customerPhone: customersTable.phone,
    })
    .from(bookingsTable)
    .innerJoin(businessesTable, eq(bookingsTable.businessId, businessesTable.id))
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(staffTable, eq(bookingsTable.staffId, staffTable.id))
    .where(and(eq(bookingsTable.id, bookingId), eq(businessesTable.slug, slug)))
    .limit(1);

  const sessionDigits = normalizePhoneE164(session.phoneE164)?.replace(/\D/g, "") ?? "";
  const customerDigits = normalizePhoneE164(row?.customerPhone ?? "")?.replace(/\D/g, "") ?? "";
  if (!row || !sessionDigits || sessionDigits !== customerDigits) throw new Error("NOT_FOUND");
  return { session, booking: { ...row, customerPhone: row.customerPhone } };
}

export async function getGuestShopRelationship(hubToken: string, slug: string) {
  const session = await getGuestHubSession(hubToken);
  if (!session?.guestId || !session.phoneE164) return null;

  const [shop] = await db
    .select({
      businessId: businessesTable.id,
      businessName: businessesTable.name,
      slug: businessesTable.slug,
      vertical: businessesTable.vertical,
      logoUrl: businessesTable.logoUrl,
    })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!shop) return null;

  const [customer] = await db
    .select({
      id: customersTable.id,
      firstName: customersTable.firstName,
      beautyPreferences: customersTable.beautyPreferences,
      patchTestCompletedAt: customersTable.patchTestCompletedAt,
    })
    .from(customersTable)
    .where(
      and(eq(customersTable.businessId, shop.businessId), eq(customersTable.phone, session.phoneE164)),
    )
    .limit(1);

  const now = new Date();
  const upcoming = customer
    ? await db
        .select({
          bookingId: bookingsTable.id,
          status: bookingsTable.status,
          startAt: bookingsTable.startAt,
          serviceName: servicesTable.name,
          staffDisplayName: staffTable.displayName,
        })
        .from(bookingsTable)
        .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
        .leftJoin(staffTable, eq(bookingsTable.staffId, staffTable.id))
        .where(
          and(
            eq(bookingsTable.customerId, customer.id),
            gte(bookingsTable.startAt, now),
            inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
          ),
        )
        .orderBy(bookingsTable.startAt)
        .limit(5)
    : [];

  const rel = customer
    ? await getRelationshipSummary(shop.businessId, customer.id).catch(() => null)
    : null;

  const packageCredits = await listGuestPackageCreditsForGuest(session.guestId, session.phoneE164);
  const shopCredits = packageCredits.filter((p) => p.slug === slug);

  const lastBook = customer
    ? await db
        .select({ serviceId: bookingsTable.serviceId, serviceName: servicesTable.name })
        .from(bookingsTable)
        .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
        .where(
          and(
            eq(bookingsTable.customerId, customer.id),
            inArray(bookingsTable.status, ["PENDING", "CONFIRMED", "COMPLETED"]),
          ),
        )
        .orderBy(desc(bookingsTable.startAt))
        .limit(1)
    : [];

  const rebookUrl =
    lastBook[0]?.serviceId
      ? guestBookUrlForSlug(slug, `service=${encodeURIComponent(lastBook[0].serviceId)}`)
      : guestBookUrlForSlug(slug);

  const verticalArtifacts = customer
    ? await loadGuestVerticalArtifacts({
        businessId: shop.businessId,
        customerId: customer.id,
        slug,
        vertical: (shop.vertical ?? "beauty") as BusinessVertical,
      })
    : {
        pets: [],
        proofs: [],
        vehicleHighlight: null,
        consentItems: [],
        carePlan: null,
        wellnessPrep: [],
      };

  const beautyPrefs =
    shop.vertical === "beauty" && customer?.beautyPreferences
      ? parseBeautyPreferences(customer.beautyPreferences)
      : null;

  return {
    shop,
    customer: customer
      ? {
          firstName: customer.firstName,
          patchTestLabel:
            shop.vertical === "beauty"
              ? beautyClientPatchTestLabel(customer.patchTestCompletedAt)
              : null,
          beautyPreferences: beautyPrefs,
        }
      : null,
    relationship: rel
      ? {
          headline: rel.headline,
          memoryHighlight: rel.memoryHighlight,
          visitCount: rel.completedVisits,
          stageLabel: rel.stageLabel,
        }
      : null,
    upcomingBookings: upcoming.map((b) => ({
      ...b,
      startAt: b.startAt.toISOString(),
      manageUrl: guestManageVisitPath(slug, b.bookingId),
    })),
    packageCredits: shopCredits,
    verticalArtifacts,
    bookUrl: rebookUrl,
    shopRelationshipUrl: guestShopRelationshipPath(slug),
  };
}

export async function getGuestVisitManage(hubToken: string, slug: string, bookingId: string) {
  const { session, booking } = await assertGuestBookingAccess(hubToken, slug, bookingId);
  const visitToken = await ensureBookingGuestAccess(booking.businessId, booking.bookingId);
  let depositPayUrl: string | null = null;
  if (
    booking.status === "PENDING" &&
    (booking.pendingReason === "awaiting_deposit" || booking.depositPaidEurCents <= 0)
  ) {
    depositPayUrl = resolveGuestTokenUrl(slug, "pay", visitToken);
  }

  const rel = await getRelationshipSummary(booking.businessId, booking.customerId).catch(
    () => null,
  );

  const packageCredits = await listGuestPackageCreditsForGuest(session.guestId!, session.phoneE164!);
  const shopCredits = packageCredits.filter((p) => p.slug === slug);

  const beautyPrefs =
    booking.vertical === "beauty"
      ? await db
          .select({
            beautyPreferences: customersTable.beautyPreferences,
            patchTestCompletedAt: customersTable.patchTestCompletedAt,
          })
          .from(customersTable)
          .where(eq(customersTable.id, booking.customerId))
          .limit(1)
          .then(([c]) =>
            c
              ? {
                  preferences: parseBeautyPreferences(c.beautyPreferences),
                  patchTestLabel: beautyClientPatchTestLabel(c.patchTestCompletedAt),
                }
              : null,
          )
      : null;

  const guestExp = guestPublicExperience(booking.vertical, null);

  const verticalArtifacts =
    booking.vertical != null
      ? await loadGuestVerticalArtifacts({
          businessId: booking.businessId,
          customerId: booking.customerId,
          slug,
          vertical: booking.vertical as BusinessVertical,
        })
      : {
          pets: [],
          proofs: [],
          vehicleHighlight: null,
          consentItems: [],
          carePlan: null,
          wellnessPrep: [],
        };

  return {
    booking: {
      bookingId: booking.bookingId,
      businessId: booking.businessId,
      businessName: booking.businessName,
      slug: booking.slug,
      vertical: booking.vertical,
      logoUrl: booking.logoUrl,
      timezone: booking.timezone,
      status: booking.status,
      startAt: booking.startAt.toISOString(),
      endAt: booking.endAt.toISOString(),
      serviceName: booking.serviceName,
      serviceId: booking.serviceId,
      staffDisplayName: booking.staffDisplayName,
      customerFirstName: booking.customerFirstName,
      priceMinor: booking.priceMinor,
      currency: booking.currency,
      depositPaidEurCents: booking.depositPaidEurCents,
      pendingReason: booking.pendingReason,
      depositLine: guestVisitDepositLine({
        vertical: booking.vertical,
        status: booking.status,
        depositPaidEurCents: booking.depositPaidEurCents,
        priceMinor: booking.priceMinor,
        currency: booking.currency,
        pendingReason: booking.pendingReason,
      }),
      visitToken,
    },
    prepNotes: guestMyVisitPrep(booking.vertical),
    visitGreeting: guestExp.visitGreeting(booking.customerFirstName),
    relationship: rel
      ? { headline: rel.headline, memoryHighlight: rel.memoryHighlight }
      : null,
    beautyPrefs,
    packageCredits: shopCredits,
    verticalArtifacts,
    bookUrl: guestBookUrlForSlug(slug, `service=${encodeURIComponent(booking.serviceId)}`),
    shopRelationshipUrl: guestShopRelationshipPath(slug),
    depositPayUrl,
  };
}

export async function postGuestVisitRunningLate(
  hubToken: string,
  slug: string,
  bookingId: string,
  minutesLate: number,
) {
  const { booking } = await assertGuestBookingAccess(hubToken, slug, bookingId);
  const token = await ensureBookingGuestAccess(booking.businessId, booking.bookingId);

  const { notifyBusinessCustomerRunningLate } = await import(
    "./customer-running-late.service"
  );
  const result = await notifyBusinessCustomerRunningLate(slug, token, minutesLate);
  if (!result.ok) throw new Error("NOT_FOUND");
  return { ok: true as const };
}

export async function postGuestVisitMessage(
  hubToken: string,
  slug: string,
  bookingId: string,
  content: string,
) {
  const { session, booking } = await assertGuestBookingAccess(hubToken, slug, bookingId);
  const trimmed = content.trim().slice(0, 2000);
  if (!trimmed) throw new Error("EMPTY");

  const [existing] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, booking.businessId),
        eq(conversationsTable.customerId, booking.customerId),
        inArray(conversationsTable.status, ["OPEN", "HANDED_OFF"]),
      ),
    )
    .orderBy(desc(conversationsTable.updatedAt))
    .limit(1);

  let conversationId = existing?.id;
  if (!conversationId) {
    const conv = await createConversation({
      businessId: booking.businessId,
      channel: "WEB",
      customerName: booking.customerFirstName ?? "Guest",
      customerPhone: session.phoneE164!,
    });
    conversationId = conv.id;
    await db
      .update(conversationsTable)
      .set({ customerId: booking.customerId, aiHandled: false, status: "HANDED_OFF" })
      .where(eq(conversationsTable.id, conversationId));
  } else {
    await db
      .update(conversationsTable)
      .set({ aiHandled: false, status: "HANDED_OFF", updatedAt: new Date() })
      .where(eq(conversationsTable.id, conversationId));
  }

  const messageId = generateId();
  await db.insert(conversationMessagesTable).values({
    id: messageId,
    conversationId,
    role: "USER",
    content: trimmed,
    bookingId: booking.bookingId,
  });

  fanOutSideEffect(
    "guest.visit.message",
    async () => {
      const { notifyInboxInbound } = await import("./notification-orchestrator.service");
      await notifyInboxInbound({
        businessId: booking.businessId,
        conversationId,
        channel: "WEB",
        customerName: booking.customerFirstName,
        preview: trimmed.slice(0, 120),
        livWillReply: false,
      });
    },
    { conversationId, bookingId: booking.bookingId },
  );

  return { ok: true as const, conversationId, messageId };
}
