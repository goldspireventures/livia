import { db, timeOffRequestsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { generateId } from "../lib/id";
import { publishDomainEvent } from "../lib/domain-events";
import { createTimeOff } from "./availability.service";

export async function proposeTimeOff(input: {
  businessId: string;
  staffId: string;
  requestedByMembershipId: string;
  kind: "annual_leave" | "sick" | "training" | "personal" | "bereavement" | "parental" | "block";
  startAt: Date;
  endAt: Date;
  reason?: string;
}) {
  const id = generateId();
  const [row] = await db
    .insert(timeOffRequestsTable)
    .values({
      id,
      businessId: input.businessId,
      staffId: input.staffId,
      requestedByMembershipId: input.requestedByMembershipId,
      kind: input.kind,
      startAt: input.startAt,
      endAt: input.endAt,
      reason: input.reason,
      status: "PENDING_APPROVAL",
    })
    .returning();

  await publishDomainEvent(
    "time-off.proposed",
    { businessId: input.businessId, requestId: id },
    `${input.businessId}:${id}:proposed`,
  );

  return row;
}

export async function approveTimeOffRequest(
  businessId: string,
  requestId: string,
  opts: { decidedByMembershipId: string | null; decisionNote?: string },
) {
  const existing = await getTimeOffRequest(businessId, requestId);
  if (!existing) return null;
  if (existing.status === "APPROVED") return existing;

  const [updated] = await db
    .update(timeOffRequestsTable)
    .set({
      status: "APPROVED",
      decidedByMembershipId: opts.decidedByMembershipId,
      decisionNote: opts.decisionNote,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(timeOffRequestsTable.id, requestId),
        eq(timeOffRequestsTable.businessId, businessId),
      ),
    )
    .returning();

  if (updated) {
    await createTimeOff(businessId, {
      staffId: updated.staffId,
      startsAt: updated.startAt.toISOString(),
      endsAt: updated.endAt.toISOString(),
      reason: updated.reason ?? `Approved leave (${updated.kind})`,
    });
    await publishDomainEvent(
      "time-off.approved",
      { businessId, requestId },
      `${businessId}:${requestId}:approved`,
    );
  }

  return updated ?? null;
}

export async function listTimeOffRequests(
  businessId: string,
  opts?: { staffId?: string },
) {
  const conditions = [eq(timeOffRequestsTable.businessId, businessId)];
  if (opts?.staffId) conditions.push(eq(timeOffRequestsTable.staffId, opts.staffId));
  return db
    .select()
    .from(timeOffRequestsTable)
    .where(and(...conditions))
    .orderBy(desc(timeOffRequestsTable.createdAt))
    .limit(50);
}

export async function getTimeOffRequest(businessId: string, requestId: string) {
  const [row] = await db
    .select()
    .from(timeOffRequestsTable)
    .where(
      and(
        eq(timeOffRequestsTable.id, requestId),
        eq(timeOffRequestsTable.businessId, businessId),
      ),
    );
  return row ?? null;
}
