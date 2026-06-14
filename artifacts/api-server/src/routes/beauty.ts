import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { withBusinessFeature } from "../lib/wedge-api-gate.js";
import {
  getBeautyFillCycleRadar,
  getBeautyStationCompass,
  getBeautyTvQueue,
  getBeautyWalletPassMeta,
  proposeBeautyWalkIn,
} from "../services/beauty-ops.service";
import { sendBeautyFillCycleNudges } from "../services/beauty-fill-cycle.service";
import {
  createRetailPayLinkForStaff,
  createRetailProduct,
  getRetailStoreBundle,
  seedRetailTemplatesForBusiness,
  updateRetailProduct,
  updateRetailStoreSettings,
} from "../services/beauty-retail.service";
import { sendError, logRouteError } from "../lib/http-errors";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => (Array.isArray(param) ? param[0] : param);

router.get(
  "/businesses/:businessId/beauty/fill-cycle",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      res.json(await getBeautyFillCycleRadar(businessId));
    } catch (e) {
      logRouteError(req, e, "beauty fill-cycle");
      sendError(res, req, 500, "Could not load fill cycle radar");
    }
  },
);

router.post(
  "/businesses/:businessId/beauty/fill-cycle/nudge",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      const body = (req.body ?? {}) as {
        customerIds?: string[];
        dryRun?: boolean;
        limit?: number;
      };
      res.json(
        await sendBeautyFillCycleNudges(businessId, {
          customerIds: body.customerIds,
          dryRun: body.dryRun === true,
          limit: body.limit,
        }),
      );
    } catch (e) {
      logRouteError(req, e, "beauty fill-cycle nudge");
      sendError(res, req, 500, "Could not send fill-cycle nudges");
    }
  },
);

router.get(
  "/businesses/:businessId/beauty/station-compass",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      res.json(await getBeautyStationCompass(businessId));
    } catch (e) {
      logRouteError(req, e, "beauty station-compass");
      sendError(res, req, 500, "Could not load station compass");
    }
  },
);

router.post(
  "/businesses/:businessId/beauty/walk-in",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      const { serviceId, staffId, preferredStart } = req.body ?? {};
      if (!serviceId) {
        sendError(res, req, 400, "serviceId is required");
        return;
      }
      res.json(await proposeBeautyWalkIn(businessId, { serviceId, staffId, preferredStart }));
    } catch (e) {
      logRouteError(req, e, "beauty walk-in");
      sendError(res, req, 500, "Could not propose walk-in slot");
    }
  },
);

router.get(
  "/businesses/:businessId/beauty/tv-queue",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      res.json(await getBeautyTvQueue(businessId));
    } catch (e) {
      logRouteError(req, e, "beauty tv-queue");
      sendError(res, req, 500, "Could not load TV queue");
    }
  },
);

router.get(
  "/businesses/:businessId/beauty/wallet-pass/:bookingId",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      const bookingId = getBizId(req.params.bookingId);
      const base =
        process.env.PUBLIC_APP_URL ??
        process.env.DASHBOARD_URL ??
        "https://app.livia-hq.com";
      const meta = await getBeautyWalletPassMeta(businessId, bookingId, base);
      if (!meta) {
        sendError(res, req, 404, "Booking not found");
        return;
      }
      res.json(meta);
    } catch (e) {
      logRouteError(req, e, "beauty wallet-pass");
      sendError(res, req, 500, "Could not load wallet pass");
    }
  },
);

// --- Retail mini-store (appointment verticals; gated by retail_pack add-on) ---

router.get(
  "/businesses/:businessId/retail/store",
  ...withBusinessFeature("retail", "ADMIN", async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      const bundle = await getRetailStoreBundle(businessId);
      if (!bundle) {
        sendError(res, req, 404, "Business not found");
        return;
      }
      res.json(bundle);
    } catch (e) {
      logRouteError(req, e, "retail store get");
      sendError(res, req, 500, "Could not load store");
    }
  }),
);

router.patch(
  "/businesses/:businessId/retail/settings",
  ...withBusinessFeature("retail", "ADMIN", async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      const settings = await updateRetailStoreSettings(businessId, req.body ?? {});
      if (!settings) {
        sendError(res, req, 404, "Business not found");
        return;
      }
      res.json(settings);
    } catch (e) {
      logRouteError(req, e, "retail settings patch");
      sendError(res, req, 500, "Could not update store settings");
    }
  }),
);

router.post(
  "/businesses/:businessId/retail/products",
  ...withBusinessFeature("retail", "ADMIN", async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      const { name, description, priceMinor, currency, sku, imageUrl, sortOrder, category, stockQuantity } =
        req.body ?? {};
      if (!name || priceMinor == null) {
        sendError(res, req, 400, "name and priceMinor are required");
        return;
      }
      res.status(201).json(
        await createRetailProduct(businessId, {
          name,
          description,
          priceMinor: Number(priceMinor),
          currency,
          sku,
          imageUrl,
          sortOrder,
          category,
          stockQuantity,
        }),
      );
    } catch (e) {
      logRouteError(req, e, "retail product create");
      sendError(res, req, 500, "Could not create product");
    }
  }),
);

router.patch(
  "/businesses/:businessId/retail/products/:productId",
  ...withBusinessFeature("retail", "ADMIN", async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      const productId = getBizId(req.params.productId);
      const body = req.body ?? {};
      const patch = { ...body } as Record<string, unknown>;
      if ("stockQuantity" in patch) {
        patch.stockQuantity =
          patch.stockQuantity == null || patch.stockQuantity === ""
            ? null
            : Math.max(0, Math.floor(Number(patch.stockQuantity)));
      }
      const row = await updateRetailProduct(businessId, productId, patch);
      if (!row) {
        sendError(res, req, 404, "Product not found");
        return;
      }
      res.json(row);
    } catch (e) {
      logRouteError(req, e, "retail product patch");
      sendError(res, req, 500, "Could not update product");
    }
  }),
);

router.post(
  "/businesses/:businessId/retail/seed-templates",
  ...withBusinessFeature("retail", "ADMIN", async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      res.json(await seedRetailTemplatesForBusiness(businessId));
    } catch (e) {
      logRouteError(req, e, "retail seed");
      sendError(res, req, 500, "Could not seed templates");
    }
  }),
);

router.post(
  "/businesses/:businessId/retail/pay-link",
  ...withBusinessFeature("retail", "STAFF", async (req, res): Promise<void> => {
    try {
      const businessId = getBizId(req.params.businessId);
      const { productId, guestName } = req.body ?? {};
      if (!productId) {
        sendError(res, req, 400, "productId is required");
        return;
      }
      const link = await createRetailPayLinkForStaff({ businessId, productId, guestName });
      if (!link) {
        sendError(res, req, 404, "Product not found");
        return;
      }
      res.json(link);
    } catch (e) {
      logRouteError(req, e, "retail pay-link");
      sendError(res, req, 500, "Could not create pay link");
    }
  }),
);

export default router;
