import { Router, type IRouter } from "express";
import { publicChatRateLimitOk } from "../lib/public-chat-rate-limit";
import { logRouteError, safeClientMessage, sendError } from "../lib/http-errors";
import {
  getGuestHubView,
  requestGuestHubOtp,
  resolveGuestVisitPath,
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

router.get("/public/guest-hub/visit/:token", async (req, res): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  if (!token) {
    sendError(res, req, 400, "token required");
    return;
  }
  const path = await resolveGuestVisitPath(token);
  if (!path) {
    sendError(res, req, 404, "Visit not found");
    return;
  }
  res.json({ path });
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

router.patch("/public/guest-hub/preferences", async (req, res): Promise<void> => {
  const token =
    typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
  const { preferredModality } = req.body ?? {};
  if (!token) {
    sendError(res, req, 401, "Guest hub token required");
    return;
  }
  const { updateGuestPreferredModality } = await import("../services/guest-hub.service");
  const view = await updateGuestPreferredModality(token, String(preferredModality ?? "ANY"));
  if (!view) {
    sendError(res, req, 401, "Session expired");
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

router.get("/public/guest-hub/shops/:slug", async (req, res): Promise<void> => {
  const token = typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  if (!token) {
    sendError(res, req, 401, "Guest hub token required");
    return;
  }
  try {
    const { getGuestShopRelationship } = await import("../services/guest-hub-visit.service");
    const view = await getGuestShopRelationship(token, slug ?? "");
    if (!view) {
      sendError(res, req, 404, "Shop not found");
      return;
    }
    res.json(view);
  } catch (e) {
    logRouteError(req, e, "Guest shop relationship failed");
    sendError(res, req, 500, safeClientMessage(e, "Could not load shop"));
  }
});

router.get("/public/guest-hub/shops/:slug/visits/:bookingId", async (req, res): Promise<void> => {
  const token = typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const bookingId = Array.isArray(req.params.bookingId)
    ? req.params.bookingId[0]
    : req.params.bookingId;
  if (!token) {
    sendError(res, req, 401, "Guest hub token required");
    return;
  }
  try {
    const { getGuestVisitManage } = await import("../services/guest-hub-visit.service");
    const view = await getGuestVisitManage(token, slug ?? "", bookingId ?? "");
    res.json(view);
  } catch (e) {
    if (e instanceof Error && (e.message === "UNAUTHORIZED" || e.message === "NOT_FOUND")) {
      sendError(res, req, e.message === "UNAUTHORIZED" ? 401 : 404, "Visit not found");
      return;
    }
    logRouteError(req, e, "Guest visit manage failed");
    sendError(res, req, 500, safeClientMessage(e, "Could not load visit"));
  }
});

router.post(
  "/public/guest-hub/shops/:slug/visits/:bookingId/running-late",
  async (req, res): Promise<void> => {
    const token =
      typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const bookingId = Array.isArray(req.params.bookingId)
      ? req.params.bookingId[0]
      : req.params.bookingId;
    const minutesLate = Number(req.body?.minutesLate ?? 10);
    if (!token) {
      sendError(res, req, 401, "Guest hub token required");
      return;
    }
    try {
      const { postGuestVisitRunningLate } = await import("../services/guest-hub-visit.service");
      await postGuestVisitRunningLate(token, slug ?? "", bookingId ?? "", minutesLate);
      res.json({ ok: true });
    } catch (e) {
      if (e instanceof Error && (e.message === "UNAUTHORIZED" || e.message === "NOT_FOUND")) {
        sendError(res, req, e.message === "UNAUTHORIZED" ? 401 : 404, "Visit not found");
        return;
      }
      logRouteError(req, e, "Guest running late failed");
      sendError(res, req, 500, safeClientMessage(e, "Could not notify studio"));
    }
  },
);

router.post(
  "/public/guest-hub/shops/:slug/visits/:bookingId/message",
  async (req, res): Promise<void> => {
    const token =
      typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const bookingId = Array.isArray(req.params.bookingId)
      ? req.params.bookingId[0]
      : req.params.bookingId;
    const content = typeof req.body?.content === "string" ? req.body.content : "";
    if (!token) {
      sendError(res, req, 401, "Guest hub token required");
      return;
    }
    try {
      const { postGuestVisitMessage } = await import("../services/guest-hub-visit.service");
      const result = await postGuestVisitMessage(token, slug ?? "", bookingId ?? "", content);
      res.json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "EMPTY") {
        sendError(res, req, 400, "Message required");
        return;
      }
      if (e instanceof Error && (e.message === "UNAUTHORIZED" || e.message === "NOT_FOUND")) {
        sendError(res, req, e.message === "UNAUTHORIZED" ? 401 : 404, "Visit not found");
        return;
      }
      logRouteError(req, e, "Guest message failed");
      sendError(res, req, 500, safeClientMessage(e, "Could not send message"));
    }
  },
);

router.post("/public/guest-hub/chat", async (req, res): Promise<void> => {
  const token =
    (typeof req.headers["x-guest-hub-token"] === "string"
      ? req.headers["x-guest-hub-token"]
      : typeof req.body?.hubToken === "string"
        ? req.body.hubToken
        : "") || "";
  const message = typeof req.body?.message === "string" ? req.body.message : "";
  if (!token) {
    sendError(res, req, 401, "Guest hub token required");
    return;
  }
  if (!message.trim()) {
    sendError(res, req, 400, "message is required");
    return;
  }
  if (message.length > 2000) {
    sendError(res, req, 400, "message too long (max 2000 chars)");
    return;
  }

  const ip = (req.ip || req.socket.remoteAddress || "unknown") as string;
  const limit = await publicChatRateLimitOk(ip);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfter ?? 60));
    sendError(res, req, 429, "Too many messages. Please wait a moment.");
    return;
  }

  try {
    const { handleGuestHubChat } = await import("../services/guest-hub-orchestrator.service");
    const result = await handleGuestHubChat(token, message);
    if (!result) {
      sendError(res, req, 401, "Session expired — verify your phone again");
      return;
    }
    res.json(result);
  } catch (err) {
    logRouteError(req, err, "Guest hub chat failed");
    sendError(res, req, 500, safeClientMessage(err, "Chat failed"));
  }
});

export default router;
