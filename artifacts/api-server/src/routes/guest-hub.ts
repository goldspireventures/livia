import { Router, type IRouter } from "express";
import { sendError } from "../lib/http-errors";
import {
  getGuestHubView,
  requestGuestHubOtp,
  toggleGuestFavorite,
  verifyGuestHubOtp,
} from "../services/guest-hub.service";
import { buildPublicSurfaceConfig } from "../lib/staging-relaxations";

const router: IRouter = Router();

router.get("/public/surface-config", (_req, res): void => {
  res.json(buildPublicSurfaceConfig());
});

router.post("/public/guest-hub/otp/request", async (req, res): Promise<void> => {
  try {
    const phone = typeof req.body?.phone === "string" ? req.body.phone : "";
    const country = typeof req.body?.country === "string" ? req.body.country : "IE";
    const result = await requestGuestHubOtp(phone, country);
    res.status(201).json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_PHONE") {
      sendError(res, req, 400, "Enter a valid mobile number");
      return;
    }
    throw e;
  }
});

router.post("/public/guest-hub/otp/verify", async (req, res): Promise<void> => {
  const sessionToken = typeof req.body?.sessionToken === "string" ? req.body.sessionToken : "";
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  if (!sessionToken || !code) {
    sendError(res, req, 400, "sessionToken and code required");
    return;
  }
  const result = await verifyGuestHubOtp(sessionToken, code);
  if (!result.ok) {
    const msg =
      result.reason === "expired"
        ? "Code expired — request a new one"
        : result.reason === "invalid_code"
          ? "Incorrect code"
          : "Session not found";
    sendError(res, req, 400, msg);
    return;
  }
  res.json(result);
});

router.get("/public/guest-hub/me", async (req, res): Promise<void> => {
  const token =
    (typeof req.headers["x-guest-hub-token"] === "string"
      ? req.headers["x-guest-hub-token"]
      : typeof req.query.token === "string"
        ? req.query.token
        : "") || "";
  if (!token) {
    sendError(res, req, 401, "Guest hub token required");
    return;
  }
  const view = await getGuestHubView(token);
  if (!view) {
    sendError(res, req, 401, "Session expired — verify your phone again");
    return;
  }
  res.json(view);
});

router.post("/public/guest-hub/favorites/:businessId", async (req, res): Promise<void> => {
  const token = typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
  const businessId = Array.isArray(req.params.businessId)
    ? req.params.businessId[0]
    : req.params.businessId;
  const pinned = req.body?.pinned !== false;
  if (!token) {
    sendError(res, req, 401, "Guest hub token required");
    return;
  }
  try {
    const view = await toggleGuestFavorite(token, businessId, pinned);
    if (!view) {
      sendError(res, req, 401, "Session expired");
      return;
    }
    res.json(view);
  } catch (e) {
    if (e instanceof Error && e.message === "SHOP_NOT_LINKED") {
      sendError(res, req, 404, "Shop not in your vault yet");
      return;
    }
    throw e;
  }
});

export default router;
