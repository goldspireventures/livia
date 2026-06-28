import { Router, type IRouter } from "express";
import {
  guestHubOtpRequestRateLimitOk,
  guestHubOtpVerifyRateLimitOk,
  publicChatRateLimitOk,
} from "../lib/public-chat-rate-limit";
import { logRouteError, safeClientMessage, sendError } from "../lib/http-errors";
import {
  getGuestHubView,
  requestGuestHubOtp,
  resolveGuestVisitPath,
  toggleGuestFavorite,
  verifyGuestHubOtp,
} from "../services/guest-hub.service";
import { buildPublicSurfaceConfig } from "../lib/staging-relaxations";
import { GUEST_HUB_COPY } from "@workspace/policy";
import { GuestHubOtpDeliveryError } from "../services/guest-hub-otp-delivery.service";

const router: IRouter = Router();

function clientIp(req: { headers: Record<string, unknown>; socket: { remoteAddress?: string | null } }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

router.get("/public/surface-config", (_req, res): void => {
  res.json(buildPublicSurfaceConfig());
});

router.post("/public/guest-hub/otp/request", async (req, res): Promise<void> => {
  const limit = await guestHubOtpRequestRateLimitOk(clientIp(req));
  if (!limit.ok) {
    sendError(res, req, 429, "Too many code requests — try again in a few minutes.");
    return;
  }
  try {
    const phone = typeof req.body?.phone === "string" ? req.body.phone : "";
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    const country = typeof req.body?.country === "string" ? req.body.country : "IE";
    const result = email.trim()
      ? await requestGuestHubOtp({ email, country })
      : await requestGuestHubOtp({ phone, country });
    res.status(201).json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_PHONE") {
      sendError(res, req, 400, "Enter a valid mobile number");
      return;
    }
    if (e instanceof Error && e.message === "INVALID_EMAIL") {
      sendError(res, req, 400, "Enter a valid email address");
      return;
    }
    if (e instanceof Error && e.message === "INVALID_IDENTIFIER") {
      sendError(res, req, 400, "Enter a mobile number or email");
      return;
    }
    if (e instanceof GuestHubOtpDeliveryError) {
      const msg =
        e.code === "OTP_DELIVERY_FAILED"
          ? GUEST_HUB_COPY.otpDeliveryFailed
          : GUEST_HUB_COPY.otpDeliveryNotConfigured;
      sendError(res, req, e.code.startsWith("OTP_EMAIL") ? 503 : 503, msg);
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
  const limit = await guestHubOtpVerifyRateLimitOk(sessionToken);
  if (!limit.ok) {
    sendError(res, req, 429, "Too many attempts — request a new code.");
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
  const token = typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
  if (!token) {
    sendError(res, req, 401, "Guest hub token required");
    return;
  }
  try {
    const { patchGuestHubPreferences } = await import("../services/guest-hub.service");
    const result = await patchGuestHubPreferences(token, {
      preferredModality:
        typeof req.body?.preferredModality === "string" ? req.body.preferredModality : undefined,
      displayName: typeof req.body?.displayName === "string" ? req.body.displayName : undefined,
      welcomeCompleted:
        typeof req.body?.welcomeCompleted === "boolean" ? req.body.welcomeCompleted : undefined,
    });
    if (!result) {
      sendError(res, req, 401, "Session expired");
      return;
    }
    res.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_PREFERENCE") {
      sendError(res, req, 400, "Invalid channel preference");
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
  const { getGuestShopRelationship } = await import("../services/guest-hub-visit.service");
  const payload = await getGuestShopRelationship(token, slug ?? "");
  if (!payload) {
    sendError(res, req, 404, "Studio not in your vault");
    return;
  }
  res.json(payload);
});

router.get(
  "/public/guest-hub/shops/:slug/proofs/:proofId/versions",
  async (req, res): Promise<void> => {
    const token = typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const proofId = Array.isArray(req.params.proofId) ? req.params.proofId[0] : req.params.proofId;
    if (!token) {
      sendError(res, req, 401, "Guest hub token required");
      return;
    }
    const { getGuestProofVersions } = await import("../services/guest-hub-vertical-artifacts.service");
    const payload = await getGuestProofVersions({
      hubToken: token,
      slug: slug ?? "",
      proofId: proofId ?? "",
    });
    if (!payload) {
      sendError(res, req, 404, "Proof not found");
      return;
    }
    res.json(payload);
  },
);

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
    const payload = await getGuestVisitManage(token, slug ?? "", bookingId ?? "");
    res.json(payload);
  } catch (e) {
    if (e instanceof Error && (e.message === "NOT_FOUND" || e.message === "UNAUTHORIZED")) {
      sendError(res, req, 404, "Visit not found");
      return;
    }
    throw e;
  }
});

router.post(
  "/public/guest-hub/shops/:slug/visits/:bookingId/running-late",
  async (req, res): Promise<void> => {
    const token = typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const bookingId = Array.isArray(req.params.bookingId)
      ? req.params.bookingId[0]
      : req.params.bookingId;
    const minutesLate = Number(req.body?.minutesLate);
    if (!token) {
      sendError(res, req, 401, "Guest hub token required");
      return;
    }
    if (!Number.isFinite(minutesLate) || minutesLate < 1 || minutesLate > 120) {
      sendError(res, req, 400, "minutesLate must be between 1 and 120");
      return;
    }
    try {
      const { postGuestVisitRunningLate } = await import("../services/guest-hub-visit.service");
      const result = await postGuestVisitRunningLate(token, slug ?? "", bookingId ?? "", minutesLate);
      res.json(result);
    } catch (e) {
      if (e instanceof Error && (e.message === "NOT_FOUND" || e.message === "UNAUTHORIZED")) {
        sendError(res, req, 404, "Visit not found");
        return;
      }
      throw e;
    }
  },
);

router.get(
  "/public/guest-hub/shops/:slug/visits/:bookingId/messages",
  async (req, res): Promise<void> => {
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
      const { listGuestVisitMessages } = await import("../services/guest-hub-visit.service");
      res.json(await listGuestVisitMessages(token, slug ?? "", bookingId ?? ""));
    } catch (e) {
      if (e instanceof Error && (e.message === "NOT_FOUND" || e.message === "UNAUTHORIZED")) {
        sendError(res, req, 404, "Visit not found");
        return;
      }
      throw e;
    }
  },
);

router.post(
  "/public/guest-hub/shops/:slug/visits/:bookingId/message",
  async (req, res): Promise<void> => {
    const token = typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const bookingId = Array.isArray(req.params.bookingId)
      ? req.params.bookingId[0]
      : req.params.bookingId;
    const content = typeof req.body?.content === "string" ? req.body.content : "";
    if (!token) {
      sendError(res, req, 401, "Guest hub token required");
      return;
    }
    if (!content.trim()) {
      sendError(res, req, 400, "content is required");
      return;
    }
    try {
      const { postGuestVisitMessage } = await import("../services/guest-hub-visit.service");
      const result = await postGuestVisitMessage(token, slug ?? "", bookingId ?? "", content);
      res.json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "EMPTY") {
        sendError(res, req, 400, "content is required");
        return;
      }
      if (e instanceof Error && (e.message === "NOT_FOUND" || e.message === "UNAUTHORIZED")) {
        sendError(res, req, 404, "Visit not found");
        return;
      }
      throw e;
    }
  },
);

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

router.post("/public/guest-hub/redeem", async (req, res): Promise<void> => {
  const token = typeof req.headers["x-guest-hub-token"] === "string" ? req.headers["x-guest-hub-token"] : "";
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  if (!token) {
    sendError(res, req, 401, "Guest hub token required");
    return;
  }
  if (!code.trim()) {
    sendError(res, req, 400, "code is required");
    return;
  }
  try {
    const { redeemGuestHubPackCode } = await import("../services/guest-hub-redeem.service");
    const result = await redeemGuestHubPackCode(token, code);
    if (!result.ok) {
      const msg =
        result.reason === "not_found"
          ? "Code not found"
          : result.reason === "depleted"
            ? "No sessions left on this code"
            : result.reason === "not_for_account"
              ? GUEST_HUB_COPY.redeemNotForAccount
              : "Session expired";
      sendError(
        res,
        req,
        result.reason === "session" ? 401 : result.reason === "not_for_account" ? 403 : 404,
        msg,
      );
      return;
    }
    res.json({
      ok: true,
      packageName: result.packageName,
      businessName: result.businessName,
      view: result.view,
    });
  } catch (e) {
    logRouteError(req, e, "Guest hub redeem failed");
    sendError(res, req, 500, safeClientMessage(e, "Redeem failed"));
  }
});

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
