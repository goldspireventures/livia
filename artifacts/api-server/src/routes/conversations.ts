// Inbox / conversations.
// Access: OWNER+ADMIN. STAFF do not see customer conversations in v1
// (the inbox is a brand-tone surface; staff training to handle the
// AI's hand-off voice is a deliberate future task).

import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import {
  listConversationsForBusiness,
  getConversation,
  listMessagesForConversation,
  updateConversationStatus,
  type ConversationStatus,
} from "../services/conversations.service";

const router: IRouter = Router();
const getBizId = (param: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

router.get(
  "/businesses/:businessId/conversations",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const status = req.query.status as ConversationStatus | undefined;
    const rows = await listConversationsForBusiness(businessId, { status });
    res.json(rows);
  },
);

router.get(
  "/businesses/:businessId/conversations/:conversationId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const conversationId = getBizId(req.params.conversationId);

    const conv = await getConversation(conversationId);
    if (!conv || conv.businessId !== businessId) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = await listMessagesForConversation(conversationId);
    const messageCount = messages.length;
    const bookingCount = messages.filter((m) => !!m.bookingId).length;
    const lastMessage =
      [...messages].reverse().find((m) => m.role === "USER" || m.role === "ASSISTANT")?.content ??
      null;

    res.json({
      conversation: { ...conv, lastMessage, messageCount, bookingCount },
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
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const conversationId = getBizId(req.params.conversationId);

    const conv = await getConversation(conversationId);
    if (!conv || conv.businessId !== businessId) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const { status, aiHandled } = req.body ?? {};
    const nextStatus: ConversationStatus = status ?? conv.status;
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
