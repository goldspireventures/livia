import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { bookingsTable, conversationsTable, db } from "@workspace/db";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import { createSupportTicket, listSupportTickets } from "../services/support-tickets.service";
import { sendSupportTicketAckEmails } from "../services/support-ticket-notifications.service";
import { appendHumanAudit } from "../lib/audit";
import { inngest, isInngestWorkflowsEnabled } from "../lib/inngest";
import { sendError } from "../lib/http-errors";
import { replyDomainError } from "../lib/domain-errors";

const router: IRouter = Router();

const CATEGORIES = new Set(["bug", "billing", "liv_error", "feature", "other"]);
const SEVERITIES = new Set(["blocking", "annoying", "nice_to_have"]);

router.post(
  "/businesses/:businessId/support/tickets",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = Array.isArray(req.params.businessId)
      ? req.params.businessId[0]
      : req.params.businessId;
    const { category, severity, description, context, consentLogsAccess } = req.body ?? {};

    if (!category || !CATEGORIES.has(category)) {
      sendError(res, req, 400, "Invalid category");
      return;
    }
    if (typeof description !== "string" || description.trim().length < 10) {
      sendError(res, req, 400, "description must be at least 10 characters");
      return;
    }
    if (severity && !SEVERITIES.has(severity)) {
      sendError(res, req, 400, "Invalid severity");
      return;
    }

    const ctx =
      context && typeof context === "object" && !Array.isArray(context)
        ? (context as Record<string, unknown>)
        : {};

    if (typeof ctx.conversationId === "string" && ctx.conversationId.trim()) {
      const [conv] = await db
        .select({ id: conversationsTable.id })
        .from(conversationsTable)
        .where(
          and(
            eq(conversationsTable.id, ctx.conversationId.trim()),
            eq(conversationsTable.businessId, businessId),
          ),
        )
        .limit(1);
      if (!conv) {
        sendError(res, req, 400, "Conversation not found for this business");
        return;
      }
    }

    if (typeof ctx.bookingId === "string" && ctx.bookingId.trim()) {
      const [booking] = await db
        .select({ id: bookingsTable.id })
        .from(bookingsTable)
        .where(
          and(eq(bookingsTable.id, ctx.bookingId.trim()), eq(bookingsTable.businessId, businessId)),
        )
        .limit(1);
      if (!booking) {
        sendError(res, req, 400, "Booking not found for this business");
        return;
      }
    }

    const reqId = (req as { id?: string }).id;
    const ticket = await createSupportTicket({
      businessId,
      userId,
      category,
      severity,
      description,
      context: {
        ...ctx,
        requestId: reqId,
        route: typeof ctx.route === "string" ? ctx.route : undefined,
      },
      consentLogsAccess: Boolean(consentLogsAccess),
    });

    await appendHumanAudit(businessId, userId, "human.support.ticket.create", "support_ticket", ticket.id, {
      category,
      severity: ticket.severity,
    });

    void sendSupportTicketAckEmails({
      businessId,
      userId,
      ticketId: ticket.id,
      category,
      severity: ticket.severity,
    }).catch(() => {
      /* non-blocking — ticket already persisted */
    });

    if (category === "liv_error") {
      const payload = {
        businessId,
        ticketId: ticket.id,
        description: description.trim(),
        conversationId: typeof ctx.conversationId === "string" ? ctx.conversationId : undefined,
        bookingId: typeof ctx.bookingId === "string" ? ctx.bookingId : undefined,
        reporterUserId: userId,
      };
      if (isInngestWorkflowsEnabled()) {
        void inngest.send({
          name: "support/liv_error.reported",
          data: payload,
        });
      } else {
        void import("../services/liv-correction.service").then(({ processLivErrorReport }) =>
          processLivErrorReport(payload).catch(() => undefined),
        );
      }
    }

    res.status(201).json(ticket);
  },
);

router.get(
  "/businesses/:businessId/support/tickets",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = Array.isArray(req.params.businessId)
      ? req.params.businessId[0]
      : req.params.businessId;
    const status = req.query.status as string | undefined;
    const allowed = new Set(["open", "triaged", "resolved", "closed"]);
    if (status && !allowed.has(status)) {
      sendError(res, req, 400, "Invalid status filter");
      return;
    }

    const tickets = await listSupportTickets(
      businessId,
      status as "open" | "triaged" | "resolved" | "closed" | undefined,
    );
    res.json(tickets);
  },
);

export default router;
