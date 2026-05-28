import { Router, type IRouter } from "express";
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

    const reqId = (req as { id?: string }).id;
    const ticket = await createSupportTicket({
      businessId,
      userId,
      category,
      severity,
      description,
      context: {
        ...(context && typeof context === "object" && !Array.isArray(context)
          ? (context as Record<string, unknown>)
          : {}),
        requestId: reqId,
        route: typeof context === "object" && context && "route" in (context as object)
          ? (context as { route?: string }).route
          : undefined,
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

    if (category === "liv_error" && isInngestWorkflowsEnabled()) {
      const ctx =
        context && typeof context === "object" && !Array.isArray(context)
          ? (context as Record<string, unknown>)
          : {};
      void inngest.send({
        name: "support/liv_error.reported",
        data: {
          businessId,
          ticketId: ticket.id,
          conversationId: typeof ctx.conversationId === "string" ? ctx.conversationId : undefined,
          bookingId: typeof ctx.bookingId === "string" ? ctx.bookingId : undefined,
        },
      });
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
