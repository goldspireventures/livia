import { Router, type IRouter } from "express";
import { publicChatRateLimitOk } from "../lib/public-chat-rate-limit";
import { logRouteError, safeClientMessage, sendError } from "../lib/http-errors";
import { handlePublicChat } from "../services/ai-chat.service";

const router: IRouter = Router();

router.post("/public/b/:slug/chat", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const { conversationId, message, customerName, customerEmail, customerPhone } = req.body ?? {};

  if (!message || typeof message !== "string" || !message.trim()) {
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
    const result = await handlePublicChat({
      slug,
      conversationId: conversationId ?? undefined,
      message: message.trim(),
      customerName,
      customerEmail,
      customerPhone,
    });
    res.json(result);
  } catch (err: any) {
    if (err?.message === "BUSINESS_NOT_FOUND") {
      sendError(res, req, 404, "Business not found");
      return;
    }
    if (err?.message === "AI_DISABLED") {
      sendError(res, req, 400, "AI assistant is disabled for this business");
      return;
    }
    logRouteError(req, err, "Public chat failed", { slug });
    sendError(res, req, 500, safeClientMessage(err, "Chat failed"));
  }
});

export default router;
