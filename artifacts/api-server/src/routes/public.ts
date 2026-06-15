import { Router, type IRouter, type Request, type Response } from "express";
import { publicBookingRateLimitOk } from "../lib/public-booking-rate-limit";
import { toPublicStaffDto } from "../lib/public-staff-dto";
import { logRouteError, safeClientMessage, sendError } from "../lib/http-errors";
import { replyDomainError } from "../lib/domain-errors";
import { markOnboardingTestBooking } from "../services/onboarding-progress.service";
import { getBusinessBySlug } from "../services/businesses.service";
import { listServices } from "../services/services.service";
import { getServiceById } from "../services/services.service";
import { listStaff } from "../services/staff.service";
import { getAvailableSlots } from "../services/slots.service";
import { findOrCreateCustomer, updateCustomer } from "../services/customers.service";
import {
  attachPetsToBooking,
  findOrCreatePetByName,
  listPetsForCustomer,
} from "../services/pets.service";
import {
  createDesignProof,
  updateDesignProofStatus,
} from "../services/design-proofs.service";
import { joinSlotWaitlist } from "../services/waitlist.service";
import {
  listPublicFitnessClasses,
  publicEnrollInClass,
} from "../services/fitness-public.service";
import { createBooking, getBookingById } from "../services/bookings.service";
import { createCouplesBookingPair } from "../services/wellness-couples.service";
import { buildPublicNextSteps } from "../services/booking-continuity.service";
import { readPublicFeaturedServiceIds } from "../lib/business-public-featured";
import { logEvent } from "../services/events.service";
import { policiesFromBusiness } from "../services/policies.service";
import { emitBookingCreated } from "../lib/booking-events";
import { EventType } from "@workspace/db";
import {
  getBookingGuardsForVertical,
  getContinuityTemplate,
  formatGuardAnswersForNotes,
  getVerticalPlaybook,
  resolvePresentationPreset,
  PLATFORM_DEFAULT_PRESET_ID,
  validateBeautyPatchTestGate,
  validateFitnessParqGate,
  guestManageVisitPath,
  guestBookPath,
} from "@workspace/policy";
import type { BusinessVertical } from "@workspace/policy";
import type { Service } from "@workspace/db";
import { listMedspaProcedures, recordPublicMedspaConsent } from "../services/medspa.service";
import { getPremisesBySlug } from "../services/premises.service";
import { buildCountryPackForBusiness } from "../services/country-pack.service";
import { getPublicDayPackages, bookDayPackage } from "../services/day-packages.service";
import {
  computeDepositDueMinor,
} from "../services/guest-deposit-pay.service";
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
import { db, visitFeedbackTable, bookingsTable, customersTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { socialProofForVertical } from "../lib/public-social-proof";
import { inferDemoServiceImageUrl, publicExperienceSkin } from "../lib/experience-skin";
import { resolvePublicServiceImageUrl } from "@workspace/policy";
import { getSignInAppearanceHintForEmail } from "../services/sign-in-appearance-hint.service";
import { purchaseWellnessGiftPackage } from "../services/wellness-gift.service";
import { isWellnessGiftPublicBookEnabled } from "@workspace/policy";
import {
  acceptPublicQuote,
  declinePublicQuote,
  decidePublicMoodBoard,
  getPublicEventSite,
  getPublicMoodBoardByToken,
  getPlannerPortalByToken,
  getPublicQuoteByToken,
  renderPublicQuoteHtml,
  submitPublicEnquiry,
} from "../services/consult-first.service";
import {
  createGuestQuoteDepositCheckout,
  confirmGuestQuoteDepositCheckout,
  getGuestQuotePayView,
} from "../services/guest-quote-pay.service";
import {
  createPublicRetailOrder,
  createRetailOrderCheckout,
  getRetailOrderByToken,
  listActiveRetailProducts,
  resolveRetailOrderLines,
} from "../services/beauty-retail.service";
import { parseBeautyRetailStoreSettings, normalizeGuestRetailFulfillmentMode, guestRetailFulfillmentOptions } from "@workspace/policy";
import { getDashboardUrl } from "../lib/public-urls";
import { resolveGuestTokenUrl } from "../lib/guest-public-urls";
import { guestMaySimulatePayments, isStripeConfigured } from "../lib/stripe";

const router: IRouter = Router();

function toPublicServiceDto(row: Service, vertical?: BusinessVertical | null) {
  const imageUrl =
    resolvePublicServiceImageUrl(row.name, undefined, row.imageUrl) ??
    inferDemoServiceImageUrl(row.name, vertical ?? undefined) ??
    null;
  const base = {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    durationMinutes: row.durationMinutes,
    priceMinor: row.priceMinor,
    currency: row.currency,
    imageUrl,
    sortOrder: row.sortOrder,
  };
  if (vertical === "beauty") {
    return {
      ...base,
      serviceKind: row.serviceKind ?? null,
      rebookIntervalDays: row.rebookIntervalDays ?? null,
      requiresPatchTest: row.requiresPatchTest ?? false,
    };
  }
  return base;
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

/** Pre-auth tenant skin preview on W2 sign-in (no secrets). */
router.get("/public/sign-in-appearance-hint", async (req, res): Promise<void> => {
  if (!(await enforcePublicBookingRateLimit(req, res))) return;
  const email = typeof req.query.email === "string" ? req.query.email : "";
  if (!email.trim() || !email.includes("@")) {
    res.json(null);
    return;
  }
  try {
    const hint = await getSignInAppearanceHintForEmail(email);
    res.json(hint);
  } catch (e) {
    logRouteError(req, e, "sign-in appearance hint");
    sendError(res, req, 500, safeClientMessage(e));
  }
});

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

  const { listPublicDesignShowcase } = await import("../services/design-proofs.service");
  const [services, staff, dayPackages, designShowcase] = await Promise.all([
    listServices(biz.id, true),
    listStaff(biz.id, { isActive: true }),
    getPublicDayPackages(biz.id),
    biz.vertical === "body-art" ? listPublicDesignShowcase(biz.id) : Promise.resolve([]),
  ]);

  const retailSettings = parseBeautyRetailStoreSettings(biz.retailStore);
  const { isPublicRetailVertical } = await import("@workspace/policy");
  const { tenantHasEntitlementForBusiness } = await import("../services/billing.service");
  const retailEntitled = await tenantHasEntitlementForBusiness(biz.id, "retail_pack");
  const retailProducts =
    isPublicRetailVertical(biz.vertical) && retailSettings.enabled && retailEntitled
      ? await listActiveRetailProducts(biz.id)
      : [];

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
    privacyNoticeBlock: policies.privacyNoticeBlock,
    depositPolicySummary: policies.depositPolicySummary,
    vertical: biz.vertical,
    bookingGuards: getBookingGuardsForVertical(biz.vertical as BusinessVertical),
    medspaProcedures:
      biz.vertical === "medspa" ? listMedspaProcedures() : undefined,
    regulatoryFooter: [],
    publicFeaturedServiceIds: readPublicFeaturedServiceIds(biz),
    publicCta: getVerticalPlaybook(biz.vertical as BusinessVertical).publicCta,
    policyTrust: {
      cancelWindowHours: policies.operational.cancelWindowHours,
      lateGraceMinutes: policies.operational.lateGraceMinutes,
      depositRequired: policies.operational.depositRequired,
      depositPercent: policies.operational.depositPercent ?? 0,
    },
    services: services
      .map((row) => toPublicServiceDto(row, biz.vertical as BusinessVertical))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    staff: staff.map(toPublicStaffDto),
    dayPackages,
    countryPack: buildCountryPackForBusiness({
      country: biz.country,
      locale: biz.locale,
      name: biz.name,
    }),
    experienceSkin: (() => {
      const preset = resolvePresentationPreset(
        biz.vertical as BusinessVertical,
        biz.presentationPresetId ?? PLATFORM_DEFAULT_PRESET_ID,
      );
      return {
        ...publicExperienceSkin(biz.vertical, biz.country),
        presentation: preset.cssPreset,
        presentationColorMode: preset.tokens.colorMode,
        brandAccentHex: biz.brandAccentHex ?? null,
      };
    })(),
    socialProof: socialProofForVertical(biz.vertical),
    retailStore:
      isPublicRetailVertical(biz.vertical) && retailEntitled
        ? {
            settings: retailSettings,
            products: retailProducts.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              priceMinor: p.priceMinor,
              currency: p.currency,
              sku: p.sku,
              imageUrl: p.imageUrl,
              category: p.category,
              stockQuantity: p.stockQuantity,
              inStock: p.stockQuantity == null || p.stockQuantity > 0,
            })),
          }
        : undefined,
    designShowcase:
      biz.vertical === "body-art" && designShowcase.length > 0 ? designShowcase : undefined,
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

router.get("/public/b/:slug/guest-context", async (req, res): Promise<void> => {
  if (!(await enforcePublicBookingRateLimit(req, res))) return;
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const phone = typeof req.query.phone === "string" ? req.query.phone.trim() : "";
  if (!phone || phone.length < 6) {
    sendError(res, req, 400, "phone query is required");
    return;
  }
  const biz = await getBusinessBySlug(slug);
  if (!biz) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  try {
    if (biz.vertical === "beauty") {
      const { resolvePublicBeautyGuestContext } = await import("../services/beauty-ops.service");
      res.json(await resolvePublicBeautyGuestContext(biz.id, phone));
      return;
    }
    if (biz.vertical === "hair") {
      const { resolvePublicHairGuestContext } = await import("../services/hair-ops.service");
      res.json(await resolvePublicHairGuestContext(biz.id, phone));
      return;
    }
    if (biz.vertical === "pet-grooming") {
      const { normalizePhoneE164 } = await import("@workspace/policy");
      const normalized = normalizePhoneE164(phone) ?? phone;
      const [customer] = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(
          and(eq(customersTable.businessId, biz.id), eq(customersTable.phone, normalized)),
        )
        .limit(1);
      if (!customer) {
        res.json({ recognized: false });
        return;
      }
      const pets = await listPetsForCustomer(biz.id, customer.id);
      res.json({
        recognized: true,
        pets: pets.map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
        })),
      });
      return;
    }
    res.json({ recognized: false });
  } catch (e) {
    logRouteError(req, e, "public guest-context");
    sendError(res, req, 500, safeClientMessage(e));
  }
});

router.get("/public/b/:slug/manifest.webmanifest", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const biz = await getBusinessBySlug(slug);
  if (!biz) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  const host = (req.get("x-forwarded-host") ?? req.get("host") ?? "localhost").split(",")[0]!.trim();
  const proto = (req.get("x-forwarded-proto") ?? req.protocol ?? "http").split(",")[0]!.trim();
  const origin = `${proto}://${host}`;
  const accent = biz.brandAccentHex?.trim() || "#6366f1";
  const scope = `${origin}/book/${slug}/`;
  const icons = biz.logoUrl
    ? [{ src: biz.logoUrl, sizes: "192x192", type: "image/png", purpose: "any maskable" }]
    : [{ src: `${origin}/favicon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" }];

  res.type("application/manifest+json").json({
    name: biz.name,
    short_name: biz.name.slice(0, 12),
    description: `Book with ${biz.name}`,
    start_url: `${origin}/book/${slug}`,
    scope,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: accent,
    icons,
  });
});
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

router.post("/public/b/:slug/gift-package", async (req, res): Promise<void> => {
  if (!(await enforcePublicBookingRateLimit(req, res))) return;
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const biz = await getBusinessBySlug(slug);
  if (!biz) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  if (!isWellnessGiftPublicBookEnabled(biz.vertical, biz.category)) {
    sendError(res, req, 400, "Gift packages are not enabled for this studio");
    return;
  }
  const {
    presetId,
    purchaserFirstName,
    purchaserLastName,
    purchaserEmail,
    purchaserPhone,
    recipientFirstName,
    recipientLastName,
    recipientEmail,
    recipientPhone,
  } = req.body ?? {};
  if (!presetId || !purchaserFirstName || !recipientFirstName) {
    sendError(res, req, 400, "presetId, purchaserFirstName, and recipientFirstName are required");
    return;
  }
  try {
    const result = await purchaseWellnessGiftPackage(biz.id, {
      presetId: String(presetId),
      purchaser: {
        firstName: String(purchaserFirstName),
        lastName: purchaserLastName ? String(purchaserLastName) : undefined,
        email: purchaserEmail ? String(purchaserEmail) : undefined,
        phone: purchaserPhone ? String(purchaserPhone) : undefined,
      },
      recipient: {
        firstName: String(recipientFirstName),
        lastName: recipientLastName ? String(recipientLastName) : undefined,
        email: recipientEmail ? String(recipientEmail) : undefined,
        phone: recipientPhone ? String(recipientPhone) : undefined,
      },
    });
    if (recipientPhone) {
      void ensureGuestVaultLinkFromBook(
        String(recipientPhone),
        biz.id,
        new Date(),
        biz.country?.slice(0, 2) ?? "IE",
      ).catch(() => undefined);
    }
    res.status(201).json({
      ...result,
      bookUrl: guestBookPath(biz.slug),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_PRESET") {
      sendError(res, req, 400, "Invalid gift package");
      return;
    }
    logRouteError(req, e, "public gift package");
    sendError(res, req, 500, safeClientMessage(e));
  }
});

router.get("/public/b/:slug/classes", async (req, res): Promise<void> => {
  if (!(await enforcePublicBookingRateLimit(req, res))) return;
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const biz = await getBusinessBySlug(slug);
  if (!biz) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  if (biz.vertical !== "fitness") {
    res.json({ classes: [] });
    return;
  }
  try {
    const { ensureFitnessShowcaseClasses } = await import("../services/fitness-demo-depth");
    await ensureFitnessShowcaseClasses(biz.id).catch(() => undefined);
    res.json({ classes: await listPublicFitnessClasses(biz.id) });
  } catch (e) {
    logRouteError(req, e, "public classes");
    sendError(res, req, 500, safeClientMessage(e));
  }
});

router.post("/public/b/:slug/classes/:sessionId/enroll", async (req, res): Promise<void> => {
  if (!(await enforcePublicBookingRateLimit(req, res))) return;
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const sessionId = Array.isArray(req.params.sessionId)
    ? req.params.sessionId[0]
    : req.params.sessionId;
  const biz = await getBusinessBySlug(slug);
  if (!biz) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  if (biz.vertical !== "fitness") {
    sendError(res, req, 400, "Class enroll is only for fitness studios");
    return;
  }
  const {
    customerFirstName,
    customerLastName,
    customerEmail,
    customerPhone,
    saveToMyLivia,
  } = req.body ?? {};
  if (!customerFirstName) {
    sendError(res, req, 400, "customerFirstName is required");
    return;
  }
  try {
    const customer = await findOrCreateCustomer(biz.id, {
      firstName: String(customerFirstName),
      lastName: customerLastName ? String(customerLastName) : undefined,
      email: customerEmail ? String(customerEmail) : undefined,
      phone: customerPhone ? String(customerPhone) : undefined,
    });
    const result = await publicEnrollInClass(biz.id, sessionId, customer.id);
    if ("error" in result) {
      sendError(res, req, 409, result.error === "full" ? "Class is full" : "Session not found");
      return;
    }
    if (saveToMyLivia !== false && customerPhone) {
      void ensureGuestVaultLinkFromBook(
        String(customerPhone),
        biz.id,
        new Date(),
        biz.country?.slice(0, 2) ?? "IE",
      ).catch(() => undefined);
    }
    res.status(201).json({
      enrollmentId: result.enrollment.id,
      status: result.enrollment.status,
      waitlistPosition: result.enrollment.waitlistPosition,
    });
  } catch (e) {
    logRouteError(req, e, "public class enroll");
    sendError(res, req, 500, safeClientMessage(e));
  }
});

router.post("/public/b/:slug/waitlist/join", async (req, res): Promise<void> => {
  if (!(await enforcePublicBookingRateLimit(req, res))) return;
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const biz = await getBusinessBySlug(slug);
  if (!biz) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  const {
    serviceId,
    staffId,
    customerFirstName,
    customerLastName,
    customerEmail,
    customerPhone,
    notes,
  } = req.body ?? {};
  if (!serviceId) {
    sendError(res, req, 400, "serviceId is required");
    return;
  }
  if (!customerPhone && !customerEmail) {
    sendError(res, req, 400, "phone or email is required");
    return;
  }
  try {
    let customerId: string | undefined;
    if (customerFirstName && (customerPhone || customerEmail)) {
      const customer = await findOrCreateCustomer(biz.id, {
        firstName: String(customerFirstName),
        lastName: customerLastName ? String(customerLastName) : undefined,
        email: customerEmail ? String(customerEmail) : undefined,
        phone: customerPhone ? String(customerPhone) : undefined,
      });
      customerId = customer.id;
    }
    const entry = await joinSlotWaitlist({
      businessId: biz.id,
      serviceId: String(serviceId),
      preferredStaffId: staffId ? String(staffId) : undefined,
      customerId,
      phone: customerPhone ? String(customerPhone) : undefined,
      email: customerEmail ? String(customerEmail) : undefined,
      notes: notes ? String(notes) : undefined,
    });
    res.status(201).json({ waitlistId: entry.id, status: entry.status });
  } catch (e) {
    logRouteError(req, e, "public waitlist join");
    sendError(res, req, 500, safeClientMessage(e));
  }
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
    partnerFirstName, partnerLastName, partnerEmail, partnerPhone,
    rememberStylist, petIds, consultReferenceUrl,
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

    if (staffId && rememberStylist !== false) {
      await updateCustomer(biz.id, customer.id, { preferredStaffId: String(staffId) });
    }

    const guards = getBookingGuardsForVertical(biz.vertical as BusinessVertical);
    const guardNote =
      guardAnswers && typeof guardAnswers === "object"
        ? formatGuardAnswersForNotes(guards, guardAnswers as Record<string, string>)
        : "";
    const mergedNotes = [notes, guardNote].filter(Boolean).join("\n\n") || undefined;

    if (biz.vertical === "beauty") {
      const service = await getServiceById(biz.id, serviceId);
      if (service) {
        const gate = validateBeautyPatchTestGate({
          service: {
            requiresPatchTest: service.requiresPatchTest,
            serviceKind: service.serviceKind as import("@workspace/policy").BeautyServiceKind | null,
            category: service.category,
          },
          customerPatchTestAt: customer.patchTestCompletedAt,
          guardAnswers:
            guardAnswers && typeof guardAnswers === "object"
              ? (guardAnswers as Record<string, string>)
              : undefined,
        });
        if (!gate.ok) {
          sendError(res, req, 422, gate.message);
          return;
        }
      }
    }

    if (biz.vertical === "fitness") {
      const [priorRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookingsTable)
        .where(
          and(eq(bookingsTable.businessId, biz.id), eq(bookingsTable.customerId, customer.id)),
        );
      const parqGate = validateFitnessParqGate({
        isFirstBooking: (priorRow?.count ?? 0) === 0,
        guardAnswers:
          guardAnswers && typeof guardAnswers === "object"
            ? (guardAnswers as Record<string, string>)
            : undefined,
      });
      if (!parqGate.ok) {
        sendError(res, req, 422, parqGate.message);
        return;
      }
    }

    const guardMap =
      guardAnswers && typeof guardAnswers === "object"
        ? (guardAnswers as Record<string, string>)
        : {};
    const isCouplesBook =
      biz.vertical === "wellness" && guardMap.couples_or_shared === "couples";

    let booking: Awaited<ReturnType<typeof createBooking>>;
    if (isCouplesBook) {
      if (!String(partnerFirstName ?? "").trim()) {
        sendError(res, req, 400, "partnerFirstName is required for couples bookings");
        return;
      }
      if (!String(partnerPhone ?? "").trim() && !String(partnerEmail ?? "").trim()) {
        sendError(res, req, 400, "Partner phone or email is required for couples bookings");
        return;
      }
      const partnerCustomer = await findOrCreateCustomer(biz.id, {
        firstName: String(partnerFirstName).trim(),
        lastName: partnerLastName ? String(partnerLastName) : undefined,
        email: partnerEmail ? String(partnerEmail) : undefined,
        phone: partnerPhone ? String(partnerPhone) : undefined,
      });
      const service = await getServiceById(biz.id, serviceId);
      if (!service) {
        sendError(res, req, 400, "Service not found");
        return;
      }
      const start = new Date(startAt);
      const end = new Date(
        start.getTime() + (service.durationMinutes + service.bufferAfterMinutes) * 60_000,
      );
      const pair = await createCouplesBookingPair(biz.id, {
        primary: {
          customerId: customer.id,
          serviceId,
          staffId,
          startAt: start,
          endAt: end,
        },
        partner: {
          customerId: partnerCustomer.id,
          displayName: [partnerCustomer.firstName, partnerCustomer.lastName]
            .filter(Boolean)
            .join(" ")
            .trim(),
        },
      });
      const primary = await getBookingById(biz.id, pair.primaryBookingId);
      if (!primary) {
        sendError(res, req, 500, "Could not load couples booking");
        return;
      }
      booking = primary;
    } else {
      const usePackage =
        biz.vertical === "wellness" && req.body?.usePackageCredit === true;
      booking = await createBooking(biz.id, {
        serviceId,
        customerId: customer.id,
        staffId,
        startAt,
        channelType: channelType ?? "WEB",
        source: "web",
        notes: mergedNotes,
        usePackageCredit: usePackage,
      });
    }

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

    if (biz.vertical === "pet-grooming") {
      const linkedPetIds: string[] = Array.isArray(petIds)
        ? petIds.map(String).filter(Boolean)
        : [];
      const guardMap =
        guardAnswers && typeof guardAnswers === "object"
          ? (guardAnswers as Record<string, string>)
          : {};
      const petName = guardMap.pet_name?.trim();
      if (petName) {
        const pet = await findOrCreatePetByName(biz.id, customer.id, {
          name: petName,
          species: guardMap.pet_species?.trim() || "dog",
          breed: guardMap.pet_breed?.trim(),
          behaviourNotes: guardMap.behaviour_notes?.trim(),
        });
        linkedPetIds.push(pet.id);
      }
      if (linkedPetIds.length > 0) {
        await attachPetsToBooking(booking.id, linkedPetIds);
      }
    }

    if (biz.vertical === "body-art") {
      const service = await getServiceById(biz.id, serviceId);
      const isConsult =
        /consult/i.test(service?.name ?? "") || /consult/i.test(service?.category ?? "");
      const refUrl =
        typeof consultReferenceUrl === "string" ? consultReferenceUrl.trim() : "";
      if (isConsult && refUrl) {
        const { listDesignProofs } = await import("../services/design-proofs.service");
        const existing = await listDesignProofs(biz.id);
        const openForCustomer = existing.find(
          (p) => p.customerId === customer.id && p.status === "pending_review",
        );
        if (!openForCustomer) {
          const proof = await createDesignProof(biz.id, {
            customerId: customer.id,
            bookingId: booking.id,
            imageUrl: refUrl,
            note: "Guest reference on consult book",
          });
          await updateDesignProofStatus(biz.id, proof.id, "pending_review");
        }
      }
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

    const guestToken = await ensureBookingGuestAccess(biz.id, booking.id);
    const visitPath = guestManageVisitPath(biz.slug, booking.id);

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
      visitUrl: visitPath,
    });

    let myLivia: { myLiviaPath: string } | null = null;
    if (saveToMyLivia !== false && customerPhone) {
      myLivia = await ensureGuestVaultLinkFromBook(
        customerPhone,
        biz.id,
        new Date(booking.startAt),
        biz.country?.slice(0, 2) ?? "IE",
      );
    }

    void markOnboardingTestBooking({
      businessId: biz.id,
      bookingId: booking.id,
      source: "public",
    }).catch(() => undefined);

    const opPolicies = policiesFromBusiness(biz).operational;
    const servicePriceMinor = booking.service?.priceMinor ?? 0;
    const depositDueMinor =
      booking.status === "PENDING" &&
      opPolicies.depositRequired &&
      (booking.depositPaidEurCents ?? 0) === 0
        ? computeDepositDueMinor({
            priceMinor: servicePriceMinor,
            depositPercent: opPolicies.depositPercent ?? 0,
            depositRequired: true,
            depositPaidMinor: booking.depositPaidEurCents ?? 0,
          })
        : 0;
    const depositPayUrl =
      depositDueMinor > 0 && guestToken
        ? resolveGuestTokenUrl(biz.slug, "pay", guestToken)
        : null;

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
      depositDueMinor: depositDueMinor > 0 ? depositDueMinor : null,
      depositPayUrl,
      currency: booking.service?.currency ?? "EUR",
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
  const { guestVisitDepositLine } = await import("@workspace/policy");
  res.json({
    ...publicView,
    startAt: view.startAt.toISOString(),
    endAt: view.endAt.toISOString(),
    feedbackSubmitted: !!existing,
    feedbackScore: existing?.score ?? null,
    depositLine: guestVisitDepositLine({
      vertical: view.vertical,
      status: view.status,
      depositPaidEurCents: view.depositPaidEurCents,
      priceMinor: view.priceMinor,
      currency: view.currency,
      pendingReason: view.pendingReason,
    }),
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
  const preset = resolvePresentationPreset(
    view.vertical as BusinessVertical,
    view.presentationPresetId ?? PLATFORM_DEFAULT_PRESET_ID,
  );
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
    version: view.version,
    versions: view.versions,
    experienceSkin: {
      ...publicExperienceSkin(view.vertical, view.country),
      presentation: preset.cssPreset,
      presentationColorMode: preset.tokens.colorMode,
      brandAccentHex: view.brandAccentHex ?? null,
    },
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
  res.json({
    ok: true,
    status: result.row?.status ?? decision,
    depositBind: result.depositBind ?? null,
  });
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

router.get("/public/b/:slug/pay/:token", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const { getGuestDepositPayView } = await import("../services/guest-deposit-pay.service");
  const view = await getGuestDepositPayView(slug, token);
  if (!view) {
    sendError(res, req, 404, "Payment link not found or expired");
    return;
  }
  res.json(view);
});

router.post("/public/b/:slug/pay/:token/checkout", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const { createGuestDepositCheckout } = await import("../services/guest-deposit-pay.service");
  try {
    const result = await createGuestDepositCheckout(slug, token);
    if (result.mode === "error") {
      sendError(res, req, 400, result.message);
      return;
    }
    res.json(result);
  } catch (err) {
    sendError(res, req, 500, err instanceof Error ? err.message : "Checkout failed");
  }
});

router.post("/public/b/:slug/pay/:token/checkout-combined", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const body = req.body as {
    items?: { productId: string; quantity: number }[];
    fulfillmentMode?: string;
    fulfillmentDetail?: string;
  };
  const { createGuestCombinedCheckout } = await import("../services/guest-combined-checkout.service");
  try {
    const result = await createGuestCombinedCheckout({
      slug,
      payToken: token,
      items: body.items ?? [],
      fulfillmentMode: body.fulfillmentMode,
      fulfillmentDetail: body.fulfillmentDetail,
    });
    if (result.mode === "error") {
      sendError(res, req, 400, result.message);
      return;
    }
    res.json(result);
  } catch (err) {
    sendError(res, req, 500, err instanceof Error ? err.message : "Checkout failed");
  }
});

router.get("/public/b/:slug/shop/:token", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const hit = await getRetailOrderByToken(slug, token);
  if (!hit) {
    sendError(res, req, 404, "Order not found");
    return;
  }
  const { order, product, business } = hit;
  const lines = await resolveRetailOrderLines(order);
  res.json({
    orderId: order.id,
    status: order.status,
    quantity: order.quantity,
    amountMinor: order.amountMinor,
    currency: order.currency,
    productName: lines.length === 1 ? lines[0]!.productName : `${lines.length} items`,
    productDescription:
      lines.length === 1 ? lines[0]!.productDescription : product.description,
    productImageUrl: lines.length === 1 ? lines[0]!.productImageUrl : product.imageUrl,
    lines,
    lineCount: lines.length,
    businessName: business.name,
    slug: business.slug,
    vertical: business.vertical,
    logoUrl: business.logoUrl,
    fulfillmentMode: order.fulfillmentMode,
    fulfillmentDetail: order.fulfillmentDetail,
    checkoutAvailable:
      order.status !== "PAID" && (isStripeConfigured() || guestMaySimulatePayments()),
  });
});

router.post("/public/b/:slug/shop/:token/checkout", async (req, res): Promise<void> => {
  if (!(await enforcePublicBookingRateLimit(req, res))) return;
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  try {
    const result = await createRetailOrderCheckout(slug, token);
    if (result.mode === "error") {
      sendError(res, req, 400, result.message);
      return;
    }
    res.json(result);
  } catch (err) {
    sendError(res, req, 500, err instanceof Error ? err.message : "Checkout failed");
  }
});

router.post("/public/b/:slug/retail/order", async (req, res): Promise<void> => {
  if (!(await enforcePublicBookingRateLimit(req, res))) return;
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const biz = await getBusinessBySlug(slug);
  if (!biz) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  const settings = parseBeautyRetailStoreSettings(biz.retailStore);
  if (!settings.enabled) {
    sendError(res, req, 403, "Store is not available");
    return;
  }
  const { tenantHasEntitlementForBusiness } = await import("../services/billing.service");
  const retailEntitled = await tenantHasEntitlementForBusiness(biz.id, "retail_pack");
  if (!retailEntitled) {
    sendError(res, req, 403, "Store is not available");
    return;
  }
  const { productId, items, guestName, guestEmail, guestPhone, quantity, fulfillmentMode, fulfillmentDetail, bookingId } =
    req.body ?? {};
  const hasItems = Array.isArray(items) && items.length > 0;
  if (!hasItems && !productId) {
    sendError(res, req, 400, "productId or items is required");
    return;
  }
  const fulfillmentOpts = guestRetailFulfillmentOptions({
    vertical: biz.vertical,
    category: biz.category,
    hasLinkedBooking: Boolean(bookingId),
  });
  const normalizedFulfillment = normalizeGuestRetailFulfillmentMode(fulfillmentMode, fulfillmentOpts);
  if (
    fulfillmentOpts.find((o) => o.mode === normalizedFulfillment)?.requiresAddress &&
    !String(fulfillmentDetail ?? "").trim()
  ) {
    sendError(res, req, 400, "Delivery address is required for shipping");
    return;
  }
  const created = await createPublicRetailOrder({
    businessId: biz.id,
    productId: hasItems ? undefined : productId,
    items: hasItems ? items : undefined,
    guestName,
    guestEmail,
    guestPhone,
    quantity,
    bookingId: bookingId ? String(bookingId) : undefined,
    fulfillmentMode: normalizedFulfillment,
    fulfillmentDetail: fulfillmentDetail ? String(fulfillmentDetail) : undefined,
  });
  if (!created) {
    sendError(res, req, 404, "Product not found or out of stock");
    return;
  }
  res.status(201).json({
    orderId: created.order.id,
    payToken: created.payToken,
    payUrl: resolveGuestTokenUrl(slug, "shop", created.payToken),
    amountMinor: created.order.amountMinor,
    currency: created.order.currency,
    lineCount: created.lines.length,
    productName:
      created.lines.length === 1
        ? created.lines[0]!.product.name
        : `${created.lines.length} items`,
  });
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

router.get("/public/:slug/event-site", async (req, res) => {
  const site = await getPublicEventSite(req.params.slug);
  if (!site) {
    sendError(res, req, 404, "not_found");
    return;
  }
  res.json(site);
});

router.post("/public/:slug/enquire", async (req, res) => {
  const row = await submitPublicEnquiry(req.params.slug, req.body ?? {});
  if (!row) {
    sendError(res, req, 404, "not_found");
    return;
  }
  res.status(201).json({ ok: true, enquiryId: row.id });
});

router.get("/public/:slug/q/:token", async (req, res) => {
  const data = await getPublicQuoteByToken(req.params.slug, req.params.token);
  if (!data) {
    sendError(res, req, 404, "not_found");
    return;
  }
  res.json(data);
});

router.post("/public/:slug/q/:token/accept", async (req, res) => {
  const row = await acceptPublicQuote(req.params.slug, req.params.token);
  if (!row) {
    sendError(res, req, 404, "not_found");
    return;
  }
  const { onQuoteAccepted } = await import("../services/event-vendor-lifecycle.service");
  void onQuoteAccepted(row.businessId, row.id).catch(() => undefined);
  res.json({ ok: true, status: row.status });
});

router.post("/public/:slug/q/:token/decline", async (req, res) => {
  const row = await declinePublicQuote(req.params.slug, req.params.token);
  if (!row) {
    sendError(res, req, 404, "not_found");
    return;
  }
  res.json({ ok: true, status: row.status });
});

router.get("/public/:slug/q/:token/html", async (req, res) => {
  const html = await renderPublicQuoteHtml(req.params.slug, req.params.token);
  if (!html) {
    sendError(res, req, 404, "not_found");
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

router.get("/public/:slug/q/:token/pay", async (req, res) => {
  const view = await getGuestQuotePayView(req.params.slug, req.params.token);
  if (!view) {
    sendError(res, req, 404, "not_found");
    return;
  }
  res.json(view);
});

router.post("/public/:slug/q/:token/pay/confirm", async (req, res) => {
  try {
    const sessionId =
      typeof req.body?.sessionId === "string"
        ? req.body.sessionId
        : typeof req.query.session_id === "string"
          ? req.query.session_id
          : null;
    if (!sessionId) {
      sendError(res, req, 400, "bad_request", { message: "Missing checkout session" });
      return;
    }
    const result = await confirmGuestQuoteDepositCheckout(
      req.params.slug,
      req.params.token,
      sessionId,
    );
    if (result.mode === "error") {
      sendError(res, req, 400, "bad_request", { message: result.message });
      return;
    }
    res.json(result);
  } catch (err) {
    logRouteError(req, err, "[public] guest quote pay confirm failed");
    sendError(res, req, 500, "internal_error", {
      message: safeClientMessage(err, "Could not confirm payment"),
    });
  }
});

router.post("/public/:slug/q/:token/pay/checkout", async (req, res) => {
  try {
    const result = await createGuestQuoteDepositCheckout(req.params.slug, req.params.token);
    if (result.mode === "error") {
      sendError(res, req, 400, "bad_request", { message: result.message });
      return;
    }
    res.json(result);
  } catch (err) {
    logRouteError(req, err, "[public] guest quote pay checkout failed");
    sendError(res, req, 500, "internal_error", {
      message: safeClientMessage(err, "Could not start checkout"),
    });
  }
});

router.get("/public/:slug/mood/:token", async (req, res) => {
  const data = await getPublicMoodBoardByToken(req.params.slug, req.params.token);
  if (!data) {
    sendError(res, req, 404, "not_found");
    return;
  }
  res.json(data);
});

router.post("/public/:slug/mood/:token/decision", async (req, res) => {
  const decision = req.body?.decision === "approved" ? "approved" : "changes_requested";
  const row = await decidePublicMoodBoard(
    req.params.slug,
    req.params.token,
    decision,
    req.body?.note as string | undefined,
  );
  if (!row) {
    sendError(res, req, 404, "not_found");
    return;
  }
  res.json(row);
});

router.get("/public/:slug/planner/:token", async (req, res) => {
  const data = await getPlannerPortalByToken(req.params.slug, req.params.token);
  if (!data) {
    sendError(res, req, 404, "not_found");
    return;
  }
  res.json(data);
});

export default router;
