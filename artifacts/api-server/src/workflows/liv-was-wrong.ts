import { inngest } from "../lib/inngest";
import { db, eventsTable } from "@workspace/db";
import { generateId } from "../lib/id";
import { logger } from "../lib/logger";

/**
 * Triage scaffold for Liv error reports — pauses automation intent, logs incident.
 * Full auto/human rollback per docs/workflows/liv-was-wrong.md in Phase 5+.
 */
export const livWasWrong = inngest.createFunction(
  { id: "liv-was-wrong-triage", retries: 3 },
  { event: "support/liv_error.reported" },
  async ({ event, step }) => {
    const data = event.data as {
      businessId: string;
      ticketId: string;
      conversationId?: string;
      bookingId?: string;
    };

    await step.run("incident-log", async () => {
      await db.insert(eventsTable).values({
        id: generateId(),
        type: "INCIDENT_CREATED",
        source: "workflow:liv-was-wrong",
        level: "WARN",
        businessId: data.businessId,
        entityType: "support_ticket",
        entityId: data.ticketId,
        context: {
          conversationId: data.conversationId ?? null,
          bookingId: data.bookingId ?? null,
        },
      });
      logger.warn(
        { businessId: data.businessId, ticketId: data.ticketId },
        "liv-was-wrong triage — human review required",
      );
    });

    return { triaged: true, ticketId: data.ticketId };
  },
);
