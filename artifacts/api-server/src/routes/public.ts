import { Router, type IRouter, type Request, type Response } from "express";
import { publicBookingRateLimitOk } from "../lib/public-booking-rate-limit";
import { toPublicStaffDto } from "../lib/public-staff-dto";
import { logRouteError, safeClientMessage, sendError } from "../lib/http-errors";
import { replyDomainError } from "../lib/domain-errors";
import { markOnboardingTestBooking } from "../services/onboarding-progress.service";
import { getBusinessBySlug } from "../services/businesses.service";
import { listServices } from "../services/services.service";
import { listStaff } from "../services/staff.service";
import { getAvailableSlots } from "../services/slots.service";
import { findOrCreateCustomer } from "../services/customers.service";
import { createBooking } from "../services/bookings.service";
import { buildPublicNextSteps } from "../services/booking-continuity.service";
import { logEvent } from "../services/events.service";
import { policiesFromBusiness } from "../services/policies.service";
import { emitBookingCreated } from "../lib/booking-events";
import { EventType } from "@workspace/db";
import {
  getBookingGuardsForVertical,
  getContinuityTemplate,
  formatGuardAnswersForNotes,
  getRegulatoryOverlay,
  resolveJurisdictionCode,
  getVerticalPlaybook,
} from "@workspace/policy";
import type { BusinessVertical } from "@workspace/policy";
import type { Service } from "@workspace/db";
import { listMedspaProcedures, recordPublicMedspaConsent } from "../services/medspa.service";
import { getPremisesBySlug } from "../services/premises.service";
import { buildCountryPackForBusiness } from "../services/country-pack.service";
import { getPublicDayPackages, bookDayPackage } from "../services/day-packages.service";
import { ensureBookingGuestAccess, getGuestBookingByToken } from "../services/booking-guest-access.service";
import { db, visitFeedbackTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { socialProofForVertical } from "../lib/public-social-proof";
import { publicExperienceSkin } from "../lib/experience-skin";

const router: IRouter = Router();

function toPublicServiceDto(row: Service) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    durationMinutes: row.durationMinutes,
    priceMinor: row.priceMinor,
    currency: row.currency,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
  };
}

async function enforcePublicBookingRateLimit(req: Request, res: Response): Promise<boolean> {
  const ip = (req.ip || req.socket.remoteAddress || "unknown") as string;
  const limit = await publicBookingRateLimitOk(ip);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfter ?? 60));
    sendError(res, req, 429, "Too many booking attempts. Please wait a moment.");
    return false;
  }
  return true;
}

router.get("/public/p/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const detail = await getPremisesBySlug(slug);
  if (!detail) {
    sendError(res, req, 404, "Premises not found");
    return;
  }
  res.json(detail);
});

async function getPublicBusinessProfile(req: Request, res: Response): Promise<void> {
  const raw = req.params.slug;
  const slug = Array.isArray(raw) ? raw[0] : raw;
  if (!slug) {
    sendError(res, req, 400, "slug is required");
    return;
  }
  const biz = await getBusinessBySlug(slug);
  if (!biz) { sendError(res, req, 404, "Business not found"); return; }

  const [services, staff, dayPackages] = await Promise.all([
    listServices(biz.id, true),
    listStaff(biz.id, { isActive: true }),
    getPublicDayPackages(biz.id),
  ]);

  const policies = policiesFromBusiness(biz);
  const aiDisclosure = policies.aiDisclosure;

  res.json({
    id: biz.id,
    name: biz.name,
    slug: biz.slug,
    description: biz.description,
    category: biz.category,
    city: biz.city,
    state: biz.state,
    postalCode: biz.postalCode,
    addressLine1: biz.addressLine1,
    addressLine2: biz.addressLine2,
    country: biz.country,
    locale: biz.locale,
    logoUrl: biz.logoUrl,
    coverImageUrl: biz.coverImageUrl,
    instagramHandle: biz.instagramHandle,
    timezone: biz.timezone,
    aiEnabled: biz.aiEnabled ?? "true",
    aiGreeting: biz.aiGreeting ?? null,
    aiDisclosureChatFirstMessage: aiDisclosure.chatFirstMessage(biz.name),
    aiDisclosureFooterLine: aiDisclosure.chatFooterLine,
    bookingTermsBlock: policies.bookingTermsBlock,
    depositPolicySummary: policies.depositPolicySummary,
    vertical: biz.vertical,
    bookingGuards: getBookingGuardsForVertical(biz.vertical as BusinessVertical),
    medspaProcedures:
      biz.vertical === "medspa" ? listMedspaProcedures() : undefined,
    regulatoryFooter: getRegulatoryOverlay(resolveJurisdictionCode(biz.country), {
      name: biz.name,
      city: biz.city,
      email: null,
    }).footerLines,
    publicCta: getVerticalPlaybook(biz.vertical as BusinessVertical).publicCta,
    policyTrust: {
      cancelWindowHours: policies.operational.cancelWindowHours,
      lateGraceMinutes: policies.operational.lateGraceMinutes,
      depositRequired: policies.operational.depositRequired,
    },
    services: services
      .map(toPublicServiceDto)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    staff: staff.map(toPublicStaffDto),
    dayPackages,
    countryPack: buildCountryPackForBusiness({
      country: biz.country,
      locale: biz.locale,
      name: biz.name,
    }),
    experienceSkin: publicExperienceSkin(biz.vertical, biz.country),
    socialProof: socialProofForVertical(biz.vertical),
  });
}

router.post("/public/b/:slug/day-packages/:packageId/book", async (req, res): Promise<void> => {
  if (!(await enforcePublicBookingRateLimit(req, res))) return;
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const packageId = Array.isArray(req.params.packageId)
    ? req.params.packageId[0]
    : req.params.packageId;
  const biz = await getBusinessBySlug(slug);
  if (!biz) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  const {
    itineraryStartAt,
    customerFirstName,
    customerLastName,
    customerEmail,
    customerPhone,
    staffId,
  } = req.body ?? {};
  if (!itineraryStartAt || !customerFirstName) {
    sendError(res, req, 400, "itineraryStartAt and customerFirstName required");
    return;
  }
  try {
    const customer = await findOrCreateCustomer(biz.id, {
      firstName: customerFirstName,
      lastName: customerLastName,
      email: customerEmail,
      phone: customerPhone,
    });
    const result = await bookDayPackage(biz.id, {
      packageId,
      customerId: customer.id,
      itineraryStartAt,
      staffId,
      channelType: "WEB",
    });
    res.status(201).json(result);
  } catch (err: unknown) {
    if (replyDomainError(req, res, err)) return;
    throw err;
  }
});

router.get("/public/b/:slug", getPublicBusinessProfile);
/** Legacy path used by E2E and older clients — same payload as /public/b/:slug */
router.get("/public/businesses/:slug", getPublicBusinessProfile);

router.get("/public/b/:slug/slots", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const biz = await getBusinessBySlug(slug);
  if (!biz) { sendError(res, req, 404, "Business not found"); return; }

  const { serviceId, date, staffId } = req.query;
  if (!serviceId || !date) {
    sendError(res, req, 400, "serviceId and date are required"); return;
  }

  const slots = await getAvailableSlots({
    businessId: biz.id,
    serviceId: serviceId as string,
    date: date as string,
    staffId: staffId as string | undefined,
    timezone: biz.timezone,
  });

  res.json({ date, serviceId, slots });
});

router.post("/public/b/:slug/book", async (req, res): Promise<void> => {
  if (!(await enforcePublicBookingRateLimit(req, res))) return;
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const biz = await getBusinessBySlug(slug);
  if (!biz) { sendError(res, req, 404, "Business not found"); return; }

  const {
    serviceId, staffId, startAt,
    customerFirstName, customerLastName, customerEmail, customerPhone,
    notes, channelType, guardAnswers, medspaConsent,
  } = req.body;

  if (!serviceId || !startAt || !customerFirstName) {
    sendError(res, req, 400, "serviceId, startAt, and customerFirstName are required"); return;
  }

  try {
    const customer = await findOrCreateCustomer(biz.id, {
      firstName: customerFirstName,
      lastName: customerLastName,
      email: customerEmail,
      phone: customerPhone,
    });

    const guards = getBookingGuardsForVertical(biz.vertical as BusinessVertical);
    const guardNote =
      guardAnswers && typeof guardAnswers === "object"
        ? formatGuardAnswersForNotes(guards, guardAnswers as Record<string, string>)
        : "";
    const mergedNotes = [notes, guardNote].filter(Boolean).join("\n\n") || undefined;

    const booking = await createBooking(biz.id, {
      serviceId,
      customerId: customer.id,
      staffId,
      startAt,
      channelType: channelType ?? "WEB",
      source: "web",
      notes: mergedNotes,
    });

    await logEvent({
      type: EventType.BOOKING_CREATED,
      businessId: biz.id,
      entityType: "booking",
      entityId: booking.id,
      context: { channel: channelType ?? "WEB", source: "public" },
    });

    if (biz.vertical === "medspa") {
      const procedureCode =
        medspaConsent && typeof medspaConsent === "object"
          ? String((medspaConsent as { procedureCode?: string }).procedureCode ?? "")
          : "";
      const signatureName =
        medspaConsent && typeof medspaConsent === "object"
          ? String((medspaConsent as { signatureName?: string }).signatureName ?? "").trim()
          : "";
      if (!procedureCode || !signatureName) {
        sendError(res, req, 400, "medspaConsent.procedureCode and signatureName required for medspa bookings",);
        return;
      }
      await recordPublicMedspaConsent({
        businessId: biz.id,
        customerId: customer.id,
        bookingId: booking.id,
        procedureCode,
        signatureName,
        marketCode: biz.locale?.startsWith("de") ? "DE" : "IE",
      });
    }

    void emitBookingCreated({
      id: booking.id,
      businessId: biz.id,
      customerId: customer.id,
      serviceId: booking.serviceId,
      staffId: booking.staffId,
      source: "web",
      sourceConversationId: booking.sourceConversationId,
      startAt: booking.startAt,
      status: booking.status,
    }).catch(() => undefined);

    const template = getContinuityTemplate(biz.vertical as BusinessVertical, biz.locale);
    const bookingRef = booking.id.slice(-8).toUpperCase();
    const igDeepLink = template.igDeepLinkHint?.({
      businessName: biz.name,
      serviceName: booking.service?.name ?? "",
      staffDisplayName: booking.staff?.displayName ?? null,
      startAtLocal: booking.startAt.toISOString(),
      bookingRef,
      instagramHandle: biz.instagramHandle,
    });

    const nextSteps = buildPublicNextSteps({
      vertical: biz.vertical,
      businessName: biz.name,
      serviceName: booking.service?.name ?? "",
      staffDisplayName: booking.staff?.displayName ?? null,
      startAt: new Date(booking.startAt).toISOString(),
      timezone: biz.timezone,
      locale: biz.locale,
      bookingId: booking.id,
      instagramHandle: biz.instagramHandle,
      status: booking.status,
      pendingReason: booking.pendingReason,
    });

    const guestToken = await ensureBookingGuestAccess(biz.id, booking.id);
    const visitPath = `/b/${biz.slug}/visit/${guestToken}`;

    void markOnboardingTestBooking(biz.id).catch(() => undefined);

    res.status(201).json({
      bookingId: booking.id,
      status: booking.status,
      pendingReason: booking.pendingReason,
      startAt: booking.startAt,
      endAt: booking.endAt,
      serviceName: booking.service?.name ?? "",
      staffDisplayName: booking.staff?.displayName ?? null,
      businessName: biz.name,
      nextSteps,
      instagramDeepLink: igDeepLink ?? null,
      guestToken,
      visitPath,
    });
  } catch (err: unknown) {
    if (replyDomainError(req, res, err)) return;
    throw err;
  }
});

router.get("/public/b/:slug/visit/:token", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const view = await getGuestBookingByToken(slug, token);
  if (!view) {
    sendError(res, req, 404, "Visit link not found");
    return;
  }
  const [existing] = await db
    .select({ id: visitFeedbackTable.id, score: visitFeedbackTable.score })
    .from(visitFeedbackTable)
    .where(eq(visitFeedbackTable.bookingId, view.bookingId))
    .limit(1);

  const { customerId: _cid, ...publicView } = view;
  res.json({
    ...publicView,
    startAt: view.startAt.toISOString(),
    endAt: view.endAt.toISOString(),
    feedbackSubmitted: !!existing,
    feedbackScore: existing?.score ?? null,
  });
});

router.post("/public/b/:slug/visit/:token/running-late", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const minutesLate = Number(req.body?.minutesLate ?? 10);
  if (!Number.isFinite(minutesLate) || minutesLate < 1) {
    sendError(res, req, 400, "minutesLate required");
    return;
  }
  try {
    const { notifyBusinessCustomerRunningLate } = await import(
      "../services/customer-running-late.service"
    );
    const result = await notifyBusinessCustomerRunningLate(slug, token, minutesLate);
    if (!result.ok) {
      sendError(res, req, 404, "Not found");
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "BOOKING_NOT_ACTIVE") {
      sendError(res, req, 409, e.message);
      return;
    }
    logRouteError(req, e, "Customer running late failed");
    sendError(res, req, 500, safeClientMessage(e, "Could not notify the business"));
  }
});

router.post("/public/b/:slug/visit/:token/feedback", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const score = Number(req.body?.score);
  const comment = typeof req.body?.comment === "string" ? req.body.comment : undefined;
  const view = await getGuestBookingByToken(slug, token);
  if (!view) {
    sendError(res, req, 404, "Not found");
    return;
  }
  try {
    const { submitVisitFeedback } = await import("../services/visit-feedback.service");
    const row = await submitVisitFeedback({
      businessId: view.businessId,
      bookingId: view.bookingId,
      customerId: view.customerId,
      score,
      comment,
    });
    res.status(201).json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "INVALID_SCORE") {
      sendError(res, req, 400, "score must be 1–5");
      return;
    }
    if (msg === "BOOKING_NOT_COMPLETED" || msg === "ALREADY_SUBMITTED") {
      sendError(res, req, 409, msg);
      return;
    }
    logRouteError(req, e, "Visit feedback failed");
    sendError(res, req, 500, safeClientMessage(e, "Could not save feedback"));
  }
});

router.get("/public/vertical-coverage", async (_req, res): Promise<void> => {
  const { listVerticalCoverage } = await import("@workspace/policy");
  res.json({ data: listVerticalCoverage() });
});

export default router;
