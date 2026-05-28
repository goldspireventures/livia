// Inbox / conversations.
// Access: OWNER+ADMIN. STAFF do not see customer conversations in v1
// (the inbox is a brand-tone surface; staff training to handle the
// AI's hand-off voice is a deliberate future task).

import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import { appendHumanAudit } from "../lib/audit";
import { publishDomainEvent } from "../lib/domain-events";
import {
  listConversationsForBusiness,
  getConversation,
  listMessagesForConversation,
  updateConversationStatus,
  sendStaffMessage,
  type ConversationStatus,
} from "../services/conversations.service";
import { resolveConversationCase, type CaseOutcome } from "../services/conversation-case.service";

import { sendError } from "../lib/http-errors";
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
      sendError(res, req, 404, "Conversation not found");
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
        authorUserId: m.authorUserId,
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
      sendError(res, req, 404, "Conversation not found");
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
    const userId = getUserId(req);
    await appendHumanAudit(businessId, userId, "human.conversation.update", "conversation", conversationId, {
      previousStatus: conv.status,
      status: nextStatus,
      aiHandled: nextAiHandled,
    });
    void publishDomainEvent(
      "conversation.updated",
      {
        businessId,
        conversationId,
        status: nextStatus,
        aiHandled: nextAiHandled,
      },
      `${businessId}:${conversationId}:status:${nextStatus}`,
    ).catch(() => undefined);
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

router.post(
  "/businesses/:businessId/conversations/:conversationId/resolve",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const conversationId = getBizId(req.params.conversationId);
    const userId = getUserId(req);
    const body = req.body ?? {};
    const outcome = body.outcome as CaseOutcome;
    const allowed: CaseOutcome[] = [
      "refund_and_cancel",
      "cancel_no_refund",
      "reschedule",
      "close_no_action",
    ];
    if (!allowed.includes(outcome)) {
      sendError(res, req, 400, "outcome is required (refund_and_cancel | cancel_no_refund | reschedule | close_no_action)");
      return;
    }
    const result = await resolveConversationCase({
      businessId,
      conversationId,
      outcome,
      userId,
      bookingId: typeof body.bookingId === "string" ? body.bookingId : undefined,
      refundMinor: typeof body.refundMinor === "number" ? body.refundMinor : undefined,
      startAt: typeof body.startAt === "string" ? body.startAt : undefined,
      endAt: typeof body.endAt === "string" ? body.endAt : undefined,
      customerMessage: typeof body.customerMessage === "string" ? body.customerMessage : undefined,
    });
    if (!result.ok) {
      sendError(res, req, 400, result.error ?? "Could not resolve case");
      return;
    }
    await appendHumanAudit(businessId, userId, "human.conversation.resolve", "conversation", conversationId, {
      outcome,
      effects: result.effects,
    });
    const conv = await getConversation(conversationId);
    res.json({ conversation: conv, effects: result.effects });
  },
);

router.post(
  "/businesses/:businessId/conversations/:conversationId/messages",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const conversationId = getBizId(req.params.conversationId);
    const content = typeof req.body?.content === "string" ? req.body.content : "";
    if (!content.trim()) {
      sendError(res, req, 400, "content is required");
      return;
    }
    try {
      const userId = getUserId(req);
      const message = await sendStaffMessage({
        businessId,
        conversationId,
        authorUserId: userId,
        content,
      });
      await appendHumanAudit(businessId, userId, "human.conversation.reply", "conversation", conversationId, {
        messageId: message.id,
      });
      res.status(201).json({
        id: message.id,
        conversationId: message.conversationId,
        role: message.role,
        content: message.content,
        authorUserId: message.authorUserId,
        createdAt: message.createdAt,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "CONVERSATION_NOT_FOUND") {
        sendError(res, req, 404, "Conversation not found");
        return;
      }
      sendError(res, req, 400, msg);
    }
  },
);

export default router;
