import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { userHasAccessToBusiness } from "../services/businesses.service";
import {
  listConversationsForBusiness,
  getConversation,
  listMessagesForConversation,
  updateConversationStatus,
  type ConversationStatus,
} from "../services/conversations.service";

const router: IRouter = Router();

router.get(
  "/businesses/:businessId/conversations",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = Array.isArray(req.params.businessId)
      ? req.params.businessId[0]
      : req.params.businessId;

    const ok = await userHasAccessToBusiness(userId, businessId);
    if (!ok) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const status = req.query.status as ConversationStatus | undefined;
    const rows = await listConversationsForBusiness(businessId, { status });
    res.json(rows);
  },
);

router.get(
  "/businesses/:businessId/conversations/:conversationId",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = Array.isArray(req.params.businessId)
      ? req.params.businessId[0]
      : req.params.businessId;
    const conversationId = Array.isArray(req.params.conversationId)
      ? req.params.conversationId[0]
      : req.params.conversationId;

    const ok = await userHasAccessToBusiness(userId, businessId);
    if (!ok) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const conv = await getConversation(conversationId);
    if (!conv || conv.businessId !== businessId) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = await listMessagesForConversation(conversationId);

    // Build the list-item shape for the conversation header
    const messageCount = messages.length;
    const bookingCount = messages.filter((m) => !!m.bookingId).length;
    const lastMessage =
      [...messages].reverse().find((m) => m.role === "USER" || m.role === "ASSISTANT")?.content ??
      null;

    res.json({
      conversation: {
        ...conv,
        lastMessage,
        messageCount,
        bookingCount,
      },
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        toolName: m.toolName,
        bookingId: m.bookingId,
        createdAt: m.createdAt,
      })),
    });
  },
);

router.patch(
  "/businesses/:businessId/conversations/:conversationId",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = Array.isArray(req.params.businessId)
      ? req.params.businessId[0]
      : req.params.businessId;
    const conversationId = Array.isArray(req.params.conversationId)
      ? req.params.conversationId[0]
      : req.params.conversationId;

    const ok = await userHasAccessToBusiness(userId, businessId);
    if (!ok) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const conv = await getConversation(conversationId);
    if (!conv || conv.businessId !== businessId) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const { status, aiHandled } = req.body ?? {};
    const nextStatus: ConversationStatus = status ?? conv.status;
    // Default aiHandled transitions per status:
    //   HANDED_OFF → AI off (human is driving)
    //   CLOSED     → AI off (conversation finished)
    //   OPEN       → AI on (resume / fresh)
    // Caller can still override by passing an explicit aiHandled flag.
    let nextAiHandled: boolean;
    if (aiHandled !== undefined) {
      nextAiHandled = !!aiHandled;
    } else if (nextStatus === "HANDED_OFF" || nextStatus === "CLOSED") {
      nextAiHandled = false;
    } else if (nextStatus === "OPEN") {
      nextAiHandled = true;
    } else {
      nextAiHandled = conv.aiHandled;
    }

    const updated = await updateConversationStatus(conversationId, nextStatus, nextAiHandled);

    // Return list-item shape for cache consistency
    const messages = await listMessagesForConversation(conversationId);
    const lastMessage =
      [...messages].reverse().find((m) => m.role === "USER" || m.role === "ASSISTANT")?.content ??
      null;
    res.json({
      ...updated,
      lastMessage,
      messageCount: messages.length,
      bookingCount: messages.filter((m) => !!m.bookingId).length,
    });
  },
);

export default router;
