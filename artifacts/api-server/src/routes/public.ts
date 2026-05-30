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
  resolvePresentationPreset,
  PLATFORM_DEFAULT_PRESET_ID,
} from "@workspace/policy";
import type { BusinessVertical } from "@workspace/policy";
import type { Service } from "@workspace/db";
import { listMedspaProcedures, recordPublicMedspaConsent } from "../services/medspa.service";
import { getPremisesBySlug } from "../services/premises.service";
import { buildCountryPackForBusiness } from "../services/country-pack.service";
import { getPublicDayPackages, bookDayPackage } from "../services/day-packages.service";
import { ensureBookingGuestAccess, getGuestBookingByToken } from "../services/booking-guest-access.service";
import { ensureGuestVaultLinkFromBook } from "../services/guest-hub.service";
import {
  getGuestProofByToken,
  submitGuestProofDecision,
} from "../services/design-proof-guest-access.service";
import {
  getGuestIntakeByToken,
  submitGuestIntakeByToken,
} from "../services/medical-intake-guest-access.service";
import {
  acceptGuestWaitlistOfferByToken,
  getGuestWaitlistOfferByToken,
} from "../services/waitlist-guest-access.service";
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
    experienceSkin: {
      ...publicExperienceSkin(biz.vertical, biz.country),
      presentation: resolvePresentationPreset(
        biz.vertical as BusinessVertical,
        biz.presentationPresetId ?? PLATFORM_DEFAULT_PRESET_ID,
      ).cssPreset,
      brandAccentHex: biz.brandAccentHex ?? null,
    },
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
    notes, channelType, guardAnswers, medspaConsent, saveToMyLivia,
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

    let myLivia: { myLiviaPath: string } | null = null;
    if (saveToMyLivia !== false && customerPhone) {
      myLivia = await ensureGuestVaultLinkFromBook(
        customerPhone,
        biz.id,
        new Date(booking.startAt),
        biz.country?.slice(0, 2) ?? "IE",
      );
    }

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
      myLiviaPath: myLivia?.myLiviaPath ?? null,
      savedToMyLivia: Boolean(myLivia),
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

router.get("/public/b/:slug/proof/:token", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const view = await getGuestProofByToken(slug, token);
  if (!view) {
    sendError(res, req, 404, "Proof link not found");
    return;
  }
  res.json({
    proofId: view.proofId,
    businessName: view.businessName,
    slug: view.slug,
    vertical: view.vertical,
    status: view.status,
    imageUrl: view.imageUrl,
    note: view.note,
    customerFirstName: view.customerFirstName,
    logoUrl: view.logoUrl,
    createdAt: view.createdAt.toISOString(),
  });
});

router.post("/public/b/:slug/proof/:token/decision", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const decision = req.body?.decision;
  if (decision !== "approved" && decision !== "rejected") {
    sendError(res, req, 400, "decision must be approved or rejected");
    return;
  }
  const comment = typeof req.body?.comment === "string" ? req.body.comment : undefined;
  const result = await submitGuestProofDecision(slug, token, decision, comment);
  if (!result.ok) {
    if (result.reason === "not_found") {
      sendError(res, req, 404, "Proof link not found");
      return;
    }
    sendError(res, req, 409, "Proof is no longer awaiting review");
    return;
  }
  res.json({ ok: true, status: result.row?.status ?? decision });
});

router.get("/public/b/:slug/intake/:token", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const view = await getGuestIntakeByToken(slug, token);
  if (!view) {
    sendError(res, req, 404, "Intake link not found");
    return;
  }
  res.json(view);
});

router.post("/public/b/:slug/intake/:token", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const result = await submitGuestIntakeByToken(slug, token, {
    allergies: typeof req.body?.allergies === "string" ? req.body.allergies : undefined,
    medications: typeof req.body?.medications === "string" ? req.body.medications : undefined,
    conditions: typeof req.body?.conditions === "string" ? req.body.conditions : undefined,
    priorProcedures:
      typeof req.body?.priorProcedures === "string" ? req.body.priorProcedures : undefined,
    notes: typeof req.body?.notes === "string" ? req.body.notes : undefined,
  });
  if (!result) {
    sendError(res, req, 404, "Intake link not found");
    return;
  }
  if ("error" in result && result.error === "already_submitted") {
    sendError(res, req, 409, "Intake already submitted");
    return;
  }
  res.json({ ok: true, status: result.row?.status ?? "submitted" });
});

router.get("/public/b/:slug/waitlist/:token", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const view = await getGuestWaitlistOfferByToken(slug, token);
  if (!view) {
    sendError(res, req, 404, "Waitlist offer not found");
    return;
  }
  res.json(view);
});

router.post("/public/b/:slug/waitlist/:token/accept", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const result = await acceptGuestWaitlistOfferByToken(slug, token);
  if (!result.ok) {
    const code =
      result.error === "expired" || result.error === "slot_taken" || result.error === "already_accepted"
        ? 409
        : 404;
    sendError(res, req, code, result.error);
    return;
  }
  res.json(result);
});

router.get("/public/vertical-coverage", async (_req, res): Promise<void> => {
  const { listVerticalCoverage } = await import("@workspace/policy");
  res.json({ data: listVerticalCoverage() });
});

router.get("/public/wedge-demo/:vertical", async (req, res): Promise<void> => {
  const vertical = Array.isArray(req.params.vertical) ? req.params.vertical[0] : req.params.vertical;
  const { resolveWedgeDemoStory, listWedgeDemoVerticals } = await import("@workspace/policy");
  const story = resolveWedgeDemoStory(vertical);
  if (!story) {
    sendError(res, req, 404, "Unknown or deferred vertical");
    return;
  }
  res.json({ data: story, verticals: listWedgeDemoVerticals() });
});

router.get("/public/wedge-demo", async (_req, res): Promise<void> => {
  const { listWedgeDemoVerticals, getWedgeDemoStory } = await import("@workspace/policy");
  const verticals = listWedgeDemoVerticals();
  res.json({
    data: verticals
      .map((v) => getWedgeDemoStory(v))
      .filter((s): s is NonNullable<typeof s> => s != null),
  });
});

export default router;
