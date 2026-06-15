import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import { replyDomainError } from "../lib/domain-errors";
import { sendError } from "../lib/http-errors";
import { recordOnboardingStateChange } from "../services/onboarding-analytics.service";
import { onboardingStateSchema } from "@workspace/policy";
import {
  getBusinessById,
  createBusiness,
  updateBusiness,
  getBusinessBySlug,
  parseOnboardingStatePatch,
  isOnboardingPatchBlocked,
} from "../services/businesses.service";
import { logEvent } from "../services/events.service";
import { appendHumanAudit } from "../lib/audit";
import { seedBusinessFromOnboardingPack } from "../services/onboarding.service";
import { ensureLiveDayForBusiness } from "../services/demo-live-day.service";
import { db, staffTable, servicesTable, customersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  getOperationalPolicyForBusiness,
  patchOperationalPolicy,
} from "../services/operational-policy.service";
import { notificationPrefsSchema, operationalPolicySchema } from "@workspace/policy";
import {
  getNotificationPreferences,
  patchNotificationPreferences,
} from "../services/notification-preferences.service";
import { EventType } from "@workspace/db";
import { onBusinessCreated } from "../platform/lifecycle";
import {
  businessTierSchema,
  businessVerticalSchema,
  jurisdictionCodeSchema,
  tenantAttestationSchema,
  hasCurrentPlatformLegal,
} from "@workspace/policy";
import { evaluateBetaSignup } from "../lib/beta-signup-gate";
import { isLegalGateSkipped } from "../lib/platform-legal-gate";
import { resolveClerkProfile } from "../lib/clerk-profile.js";
import { getOrCreateUser } from "../services/users.service";
import {
  getPresentationForBusiness,
  patchPresentationForBusiness,
  patchPublicFeaturedServices,
} from "../services/presentation.service";

const router: IRouter = Router();

// Access: authenticated user with platform legal acceptance + beta invite (when configured).
router.post("/businesses", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const profile = await resolveClerkProfile(req);
  const user = await getOrCreateUser(userId, profile.email, profile.fullName);

  if (!isLegalGateSkipped() && !hasCurrentPlatformLegal(user.platformLegal)) {
    sendError(res, req, 403, "Accept Livia Terms and Privacy before creating a business", {
      code: "PLATFORM_LEGAL_REQUIRED",
    });
    return;
  }

  const beta = evaluateBetaSignup(user.email);
  if (!beta.allowed) {
    sendError(res, req, 403, beta.message, { code: beta.code });
    return;
  }

  const {
    name,
    slug,
    description,
    category,
    email,
    phone,
    timezone,
    city,
    country,
    jurisdiction,
    vertical,
    tier,
    logoUrl,
    instagramHandle,
    seedDefaults,
    starterPack,
    subverticalProfileId,
    parentBusinessId,
    structureKind,
    tenantAttestation: tenantAttestationRaw,
  } = req.body;

  const tenantParsed = tenantAttestationSchema.safeParse({
    ...tenantAttestationRaw,
    attestedByUserId: userId,
    attestedAt: tenantAttestationRaw?.attestedAt ?? new Date().toISOString(),
  });
  if (!tenantParsed.success) {
    sendError(
      res,
      req,
      400,
      "tenantAttestation with entityKind is required (sole_trader, partnership, limited_company, or other)",
    );
    return;
  }

  if (!name || !slug) {
    sendError(res, req, 400, "name and slug are required");
    return;
  }

  const existing = await getBusinessBySlug(slug);
  if (existing) {
    sendError(res, req, 409, "Slug already taken");
    return;
  }

  const countryIso =
    jurisdiction && jurisdictionCodeSchema.safeParse(jurisdiction).success
      ? jurisdictionCodeSchema.parse(jurisdiction)
      : country;

  const verticalParsed =
    vertical && businessVerticalSchema.safeParse(vertical).success
      ? businessVerticalSchema.parse(vertical)
      : undefined;

  const tierParsed =
    tier && businessTierSchema.safeParse(tier).success
      ? businessTierSchema.parse(tier)
      : undefined;

  let biz;
  try {
    biz = await createBusiness(userId, {
      name,
      slug,
      description,
      category,
      email,
      phone,
      timezone,
      city,
      country: countryIso ?? country,
      vertical: verticalParsed,
      tier: tierParsed,
      logoUrl,
      instagramHandle,
      parentBusinessId: typeof parentBusinessId === "string" ? parentBusinessId : undefined,
      structureKind:
        structureKind === "location" ||
        structureKind === "brand_entity" ||
        structureKind === "standalone"
          ? structureKind
          : undefined,
      tenantAttestation: tenantParsed.data,
      subverticalProfileId:
        typeof subverticalProfileId === "string" && subverticalProfileId.trim()
          ? subverticalProfileId.trim()
          : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith("NAMING_")) {
      sendError(res, req, 400, msg.replace(/^NAMING_[A-Z]+:/, ""));
      return;
    }
    if (msg === "PARENT_BUSINESS_NOT_FOUND") {
      sendError(res, req, 400, "Parent business not found");
      return;
    }
    throw err;
  }

  const { receipt } = await onBusinessCreated(
    {
      businessId: biz.id,
      ownerId: userId,
      vertical: biz.vertical as import("@workspace/policy").BusinessVertical,
      slug: biz.slug,
      name: biz.name,
    },
    { starterPack: starterPack === true, seedDefaults: seedDefaults === true },
    {
      seedStarterPack: async (businessId) => {
        const { seedVerticalStarterPack } = await import("../services/vertical-starter-pack.service");
        await seedVerticalStarterPack(businessId);
      },
      seedOnboardingPack: async (businessId) => {
        await seedBusinessFromOnboardingPack(businessId, {
          name: biz.name,
          country: biz.country,
          category: biz.category,
          vertical: biz.vertical as import("@workspace/policy").BusinessVertical,
          tier: biz.tier,
        });
      },
    },
  );

  await logEvent({
    type: EventType.BUSINESS_CREATED,
    businessId: biz.id,
    userId,
    entityType: "business",
    entityId: biz.id,
    context: { name, slug, propagation: receipt },
  });

  res.status(201).json(biz);
});

// Access: OWNER+ADMIN+STAFF (read).
router.get(
  "/businesses/:businessId",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const biz = await getBusinessById(id);
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(biz);
  },
);

// Access: OWNER+ADMIN. Editing the shop's identity is not a STAFF action.
router.patch(
  "/businesses/:businessId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;

    const existing = await getBusinessById(id);
    if (!existing) {
      sendError(res, req, 404, "Business not found");
      return;
    }

    const body = { ...req.body } as Record<string, unknown>;
    let onboardingBefore: unknown;
    if ("onboardingState" in body) {
      onboardingBefore = existing.onboardingState;
      const merged = parseOnboardingStatePatch(body.onboardingState, existing.onboardingState);
      if (merged && isOnboardingPatchBlocked(merged)) {
        sendError(res, req, 409, merged.message, { code: merged.code });
        return;
      }
      if (merged) {
        body.onboardingState = merged as unknown as Record<string, unknown>;
      } else {
        delete body.onboardingState;
      }
    }

    const updated = await updateBusiness(id, body);
    if (!updated) {
      sendError(res, req, 404, "Business not found");
      return;
    }

    if (onboardingBefore !== undefined && body.onboardingState) {
      const parsed = onboardingStateSchema.safeParse(body.onboardingState);
      if (parsed.success) {
        await recordOnboardingStateChange({
          businessId: id,
          userId,
          before: onboardingBefore,
          after: parsed.data,
        });
      }
    }

    await logEvent({
      type: EventType.BUSINESS_UPDATED,
      businessId: id,
      userId,
      entityType: "business",
      entityId: id,
    });

    await appendHumanAudit(id, userId, "human.business.update", "business", id, {
      fields: Object.keys(req.body ?? {}),
    });

    res.json(updated);
  },
);

router.get(
  "/businesses/:businessId/operational-policy",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const payload = await getOperationalPolicyForBusiness(id);
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(payload);
  },
);

router.patch(
  "/businesses/:businessId/operational-policy",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const parsed = operationalPolicySchema.partial().safeParse(req.body?.policy ?? req.body);
    if (!parsed.success) {
      sendError(res, req, 400, "Invalid operational policy", { details: parsed.error.flatten() });
      return;
    }
    const payload = await patchOperationalPolicy(id, parsed.data);
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    await appendHumanAudit(id, userId, "human.policy.operational.update", "business", id, {
      fields: Object.keys(parsed.data),
    });
    const { invalidateOwnerIntelligenceCache } = await import("../services/owner-intelligence-cache");
    invalidateOwnerIntelligenceCache(id);
    void import("../services/commerce-signals.service").then((m) =>
      m.syncCommerceIntelligenceLoop(id).catch(() => undefined),
    );
    res.json(payload);
  },
);

router.get(
  "/businesses/:businessId/presentation",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const payload = await getPresentationForBusiness(id);
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(payload);
  },
);

router.patch(
  "/businesses/:businessId/presentation",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    try {
      const payload = await patchPresentationForBusiness(id, {
        presentationPresetId:
          typeof req.body?.presentationPresetId === "string"
            ? req.body.presentationPresetId
            : undefined,
        brandAccentHex:
          req.body?.brandAccentHex === null || typeof req.body?.brandAccentHex === "string"
            ? req.body.brandAccentHex
            : undefined,
      });
      if (!payload) {
        sendError(res, req, 404, "Business not found");
        return;
      }
      await appendHumanAudit(id, userId, "human.presentation.update", "business", id, {
        presetId: payload.presetId,
      });
      await logEvent({
        type: "PRESENTATION_PRESET_CHANGED",
        businessId: id,
        userId,
        entityType: "business",
        entityId: id,
        context: { presetId: payload.presetId, source: "settings" },
      });
      res.json(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      if (msg === "PRESENTATION_PRESETS_DISABLED") {
        sendError(res, req, 403, "Presentation presets are staging-only until prod promotion");
        return;
      }
      if (msg === "INVALID_PRESET") {
        sendError(res, req, 400, "Invalid presentation preset for this vertical");
        return;
      }
      if (msg === "PRESET_DROPS_VERTICAL_GATES") {
        sendError(res, req, 400, "Preset is not compatible with required guest flows for this vertical");
        return;
      }
      if (msg === "INVALID_ACCENT_HEX") {
        sendError(res, req, 400, "brandAccentHex must be #RRGGBB");
        return;
      }
      throw e;
    }
  },
);

router.patch(
  "/businesses/:businessId/public-featured-services",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const raw = req.body?.serviceIds;
    const serviceIds = Array.isArray(raw) ? raw.map(String) : [];
    const payload = await patchPublicFeaturedServices(id, serviceIds);
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    await appendHumanAudit(id, userId, "human.public_featured_services.update", "business", id, {
      count: payload.publicFeaturedServiceIds.length,
    });
    res.json(payload);
  },
);

/** Dev/demo: fill today's calendar, briefing, and activity when a shop feels empty. */
router.post(
  "/businesses/:businessId/simulate-live-day",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    if (process.env.NODE_ENV === "production") {
      sendError(res, req, 404, "Not found");
      return;
    }
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const force = req.body?.force === true;
    const staffRows = await db.select({ id: staffTable.id }).from(staffTable).where(eq(staffTable.businessId, id));
    const serviceRows = await db
      .select({ id: servicesTable.id })
      .from(servicesTable)
      .where(eq(servicesTable.businessId, id));
    const customerRows = await db
      .select({
        id: customersTable.id,
        displayName: customersTable.displayName,
        email: customersTable.email,
        phone: customersTable.phone,
      })
      .from(customersTable)
      .where(eq(customersTable.businessId, id));
    const result = await ensureLiveDayForBusiness(id, {
      force,
      customerSeed: customerRows.map((c) => ({
        id: c.id,
        displayName: c.displayName ?? "Guest",
        email: c.email ?? "",
        phone: c.phone ?? "",
      })),
      staffIds: staffRows.map((s) => s.id),
      serviceIds: serviceRows.map((s) => s.id),
    });
    res.json({ ok: true, ...result });
  },
);

router.get(
  "/businesses/:businessId/notification-preferences",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const payload = await getNotificationPreferences(id);
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(payload);
  },
);

router.patch(
  "/businesses/:businessId/notification-preferences",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const parsed = notificationPrefsSchema.partial().safeParse(req.body?.preferences ?? req.body);
    if (!parsed.success) {
      sendError(res, req, 400, "Invalid notification preferences");
      return;
    }
    const payload = await patchNotificationPreferences(id, parsed.data);
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(payload);
  },
);

export default router;
