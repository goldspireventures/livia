import { db, supportTicketsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { generateId } from "../lib/id";
import { triageSupportTicket } from "./support-ticket-triage.service";

export type CreateSupportTicketInput = {
  businessId: string;
  userId: string;
  category: "bug" | "billing" | "liv_error" | "feature" | "other";
  severity?: "blocking" | "annoying" | "nice_to_have";
  description: string;
  context?: Record<string, unknown>;
  consentLogsAccess?: boolean;
};

export async function createSupportTicket(input: CreateSupportTicketInput) {
  const id = generateId();
  const triage = triageSupportTicket({
    category: input.category,
    description: input.description,
    severity: input.severity,
    context: input.context as { surfaceId?: string; route?: string } | undefined,
  });
  const context = {
    ...(input.context ?? {}),
    triage,
  };
  const [row] = await db
    .insert(supportTicketsTable)
    .values({
      id,
      businessId: input.businessId,
      userId: input.userId,
      category: input.category,
      severity: input.severity ?? "annoying",
      description: input.description.trim(),
      context,
      consentLogsAccess: input.consentLogsAccess ? "true" : "false",
    })
    .returning();
  return row!;
}

export async function listAllSupportTicketsOpen(limit = 50) {
  return db
    .select()
    .from(supportTicketsTable)
    .where(eq(supportTicketsTable.status, "open"))
    .orderBy(desc(supportTicketsTable.createdAt))
    .limit(limit);
}

export async function listSupportTickets(
  businessId: string,
  status?: "open" | "triaged" | "resolved" | "closed",
) {
  const conditions = [eq(supportTicketsTable.businessId, businessId)];
  if (status) {
    conditions.push(eq(supportTicketsTable.status, status));
  }
  return db
    .select()
    .from(supportTicketsTable)
    .where(and(...conditions))
    .orderBy(desc(supportTicketsTable.createdAt))
    .limit(50);
}
