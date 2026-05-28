import { Router, type IRouter } from "express";
import { db, premisesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import {
  createPremises,
  getPremisesDetail,
  getPremisesForBusiness,
  linkBusinessToPremises,
  listPremisesForUser,
  provisionCoTenantAtPremises,
} from "../services/premises.service";
import type { BusinessVertical, BusinessTier } from "@workspace/policy";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get("/me/premises", requireAuth, async (req, res): Promise<void> => {
  res.json(await listPremisesForUser(getUserId(req)));
});

router.post("/me/premises", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const {
    displayName,
    slug,
    addressLine1,
    city,
    country,
    sharedPhone,
    routingMode,
    anchorBusinessId,
    anchorPublicLabel,
  } = req.body ?? {};

  if (!displayName || !anchorBusinessId) {
    sendError(res, req, 400, "displayName and anchorBusinessId are required");
    return;
  }

  try {
    const detail = await createPremises(userId, {
      displayName,
      slug,
      addressLine1,
      city,
      country,
      sharedPhone,
      routingMode: routingMode === "default" ? "default" : "menu",
      anchorBusinessId,
      anchorPublicLabel,
    });
    res.status(201).json(detail);
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === "FORBIDDEN") {
      sendError(res, req, 403, e.message);
      return;
    }
    throw err;
  }
});

router.get(
  "/businesses/:businessId/premises",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const detail = await getPremisesForBusiness(businessId);
    if (!detail) {
      sendError(res, req, 404, "No premises linked");
      return;
    }
    res.json(detail);
  },
);

router.post(
  "/premises/:premisesId/tenants",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const premisesId = getBizId(req.params.premisesId);
    const { businessId, publicLabel, sortOrder, isPrimary } = req.body ?? {};
    if (!businessId || !publicLabel) {
      sendError(res, req, 400, "businessId and publicLabel are required");
      return;
    }
    try {
      res.json(
        await linkBusinessToPremises(userId, premisesId, {
          businessId,
          publicLabel,
          sortOrder,
          isPrimary,
        }),
      );
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === "FORBIDDEN") {
        sendError(res, req, 403, e.message);
        return;
      }
      throw err;
    }
  },
);

router.post(
  "/premises/:premisesId/provision-tenant",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const premisesId = getBizId(req.params.premisesId);
    const { name, slug, publicLabel, vertical, tier, email, phone } = req.body ?? {};
    if (!name || !slug || !publicLabel || !vertical) {
      sendError(res, req, 400, "name, slug, publicLabel, and vertical are required");
      return;
    }
    try {
      res.status(201).json(
        await provisionCoTenantAtPremises(userId, premisesId, {
          name,
          slug,
          publicLabel,
          vertical: vertical as BusinessVertical,
          tier: tier as BusinessTier | undefined,
          email,
          phone,
        }),
      );
    } catch (err) {
      const e = err as Error & { message?: string; code?: string };
      if (e.code === "FORBIDDEN") {
        sendError(res, req, 403, e.message);
        return;
      }
      if (e.message?.startsWith("NAMING_")) {
        sendError(res, req, 400, e.message);
        return;
      }
      throw err;
    }
  },
);

router.patch("/premises/:premisesId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const premisesId = getBizId(req.params.premisesId);
  const { sharedPhone, sharedWhatsappPhoneNumberId, routingMode, defaultBusinessId } =
    req.body ?? {};
  const [prem] = await db
    .select()
    .from(premisesTable)
    .where(eq(premisesTable.id, premisesId));
  if (!prem || prem.ownerUserId !== userId) {
    sendError(res, req, 403, "Forbidden");
    return;
  }
  await db
    .update(premisesTable)
    .set({
      sharedPhone: sharedPhone ?? prem.sharedPhone,
      sharedWhatsappPhoneNumberId:
        sharedWhatsappPhoneNumberId ?? prem.sharedWhatsappPhoneNumberId,
      routingMode: routingMode ?? prem.routingMode,
      defaultBusinessId: defaultBusinessId ?? prem.defaultBusinessId,
      updatedAt: new Date(),
    })
    .where(eq(premisesTable.id, premisesId));
  const detail = await getPremisesDetail(premisesId);
  res.json(detail);
});

router.get("/premises/:premisesId", requireAuth, async (req, res): Promise<void> => {
  const premisesId = getBizId(req.params.premisesId);
  const detail = await getPremisesDetail(premisesId);
  if (!detail) {
    sendError(res, req, 404, "Premises not found");
    return;
  }
  res.json(detail);
});

export default router;
