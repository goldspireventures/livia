import { and, eq } from "drizzle-orm";
import {
  db,
  conversationsTable,
  livActionProposalsTable,
  shiftTemplatesTable,
  staffShiftsTable,
  staffTable,
} from "@workspace/db";
import { createLivProposalIfNeeded } from "./liv-mandate.service";
import { generateId } from "../lib/id";
import { createStaffShift } from "./staff-shifts.service";

/** Idempotent: wire demo cases (Sean refund proposal, shift templates) for showcase shops. */
export async function ensureDemoOperationalCases(
  businessId: string,
  slug: string,
  bookingKeys: Record<string, string>,
): Promise<void> {
  if (slug === "luxe-salon-spa") {
    await ensureSeanRefundProposal(businessId, bookingKeys.sean_today);
  }
  await ensureDefaultShiftTemplates(businessId);
}

async function ensureSeanRefundProposal(businessId: string, bookingId: string | undefined) {
  let bid = bookingId;
  if (!bid) {
    const { bookingsTable, customersTable } = await import("@workspace/db");
    const [row] = await db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .innerJoin(customersTable, eq(customersTable.id, bookingsTable.customerId))
      .where(
        and(
          eq(bookingsTable.businessId, businessId),
          eq(customersTable.displayName, "Sean Kelly"),
          eq(bookingsTable.status, "CONFIRMED"),
        ),
      )
      .limit(1);
    bid = row?.id;
  }
  if (!bid) return;

  const [conv] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.customerName, "Sean Kelly"),
      ),
    )
    .limit(1);

  if (conv) {
    await db
      .update(conversationsTable)
      .set({ linkedBookingId: bid, caseIntent: "refund_request", updatedAt: new Date() })
      .where(eq(conversationsTable.id, conv.id));
  }

  if (!conv) return;

  const [existing] = await db
    .select({ id: livActionProposalsTable.id })
    .from(livActionProposalsTable)
    .where(
      and(
        eq(livActionProposalsTable.businessId, businessId),
        eq(livActionProposalsTable.action, "process_refund"),
        eq(livActionProposalsTable.status, "pending"),
      ),
    )
    .limit(1);

  if (existing) return;

  await createLivProposalIfNeeded({
    businessId,
    action: "process_refund",
    valueMinor: 6000,
    resourceKind: "booking",
    resourceId: bid,
    metadata: {
      bookingId: bid,
      conversationId: conv.id,
      reason: "Late cancellation — Sean Kelly deposit refund",
      customerName: "Sean Kelly",
    },
  });
}

async function ensureDefaultShiftTemplates(businessId: string) {
  const [existing] = await db
    .select({ id: shiftTemplatesTable.id })
    .from(shiftTemplatesTable)
    .where(eq(shiftTemplatesTable.businessId, businessId))
    .limit(1);
  if (existing) return;

  const staffRows = await db
    .select({ id: staffTable.id })
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));

  const templates = [
    { name: "Floor — weekday", dayOfWeek: 2, startTime: "09:00", endTime: "17:00", label: "Floor" },
    { name: "Floor — weekday", dayOfWeek: 3, startTime: "09:00", endTime: "17:00", label: "Floor" },
    { name: "Floor — weekday", dayOfWeek: 4, startTime: "09:00", endTime: "17:00", label: "Floor" },
    { name: "Floor — weekday", dayOfWeek: 5, startTime: "09:00", endTime: "17:00", label: "Floor" },
    { name: "Floor — Saturday", dayOfWeek: 6, startTime: "09:00", endTime: "16:00", label: "Saturday floor" },
  ];

  for (const t of templates) {
    await db.insert(shiftTemplatesTable).values({
      id: generateId(),
      businessId,
      name: t.name,
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      endTime: t.endTime,
      label: t.label,
      minStaff: 1,
    });
  }

  await materializeShiftTemplatesWeek(
    businessId,
    new Date(),
    staffRows.map((s) => s.id),
  );
}

/** Expand templates into concrete staff_shifts for the week containing `anchor`. */
export async function materializeShiftTemplatesWeek(
  businessId: string,
  anchor: Date,
  staffIds?: string[],
): Promise<number> {
  const templates = await db
    .select()
    .from(shiftTemplatesTable)
    .where(eq(shiftTemplatesTable.businessId, businessId));

  if (templates.length === 0) return 0;

  const weekStart = new Date(anchor);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  let created = 0;
  for (const tpl of templates) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + tpl.dayOfWeek);
    if (day < anchor && day.toDateString() !== anchor.toDateString()) continue;

    const [sh, sm] = tpl.startTime.split(":").map(Number);
    const [eh, em] = tpl.endTime.split(":").map(Number);
    const startsAt = new Date(day);
    startsAt.setHours(sh ?? 9, sm ?? 0, 0, 0);
    const endsAt = new Date(day);
    endsAt.setHours(eh ?? 17, em ?? 0, 0, 0);

    const assignStaff = staffIds?.[tpl.dayOfWeek % (staffIds.length || 1)];
    if (!assignStaff) continue;

    const [dup] = await db
      .select({ id: staffShiftsTable.id })
      .from(staffShiftsTable)
      .where(
        and(
          eq(staffShiftsTable.businessId, businessId),
          eq(staffShiftsTable.staffId, assignStaff),
          eq(staffShiftsTable.startsAt, startsAt),
        ),
      )
      .limit(1);
    if (dup) continue;

    await createStaffShift(businessId, {
      staffId: assignStaff,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      label: tpl.label ?? tpl.name,
    });
    created += 1;
  }
  return created;
}
