import { searchAuditLog } from "./audit-log.service";
import { db, bookingsTable } from "@workspace/db";
import { and, eq, gte, lte } from "drizzle-orm";

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function buildEnterpriseAuditExportCsv(args: {
  businessId: string;
  from: Date;
  to: Date;
}): Promise<string> {
  const { businessId, from, to } = args;
  const lines: string[] = [
    "section,id,at,actor,action,resource,detail",
  ];

  const audit = await searchAuditLog(businessId, {
    from: from.toISOString(),
    to: to.toISOString(),
    limit: 5000,
    offset: 0,
  });

  for (const row of audit.data) {
    lines.push(
      [
        "audit",
        row.id,
        row.occurredAt,
        row.actorId,
        row.actionClass,
        row.resourceKind,
        csvEscape(JSON.stringify(row.payload ?? {})),
      ].join(","),
    );
  }

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, from),
        lte(bookingsTable.startAt, to),
      ),
    )
    .limit(5000);

  for (const b of bookings) {
    lines.push(
      [
        "booking",
        b.id,
        b.startAt.toISOString(),
        "",
        b.status,
        "booking",
        csvEscape(b.pendingReason ?? ""),
      ].join(","),
    );
  }

  return lines.join("\n");
}
