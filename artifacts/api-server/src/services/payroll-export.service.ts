import { and, eq, gte, lte, inArray } from "drizzle-orm";
import {
  db,
  staffShiftsTable,
  staffTable,
  bookingsTable,
  timeOffRequestsTable,
} from "@workspace/db";
import { listStaffShifts } from "./staff-shifts.service";

export type PayrollPreflightIssue = {
  code: string;
  message: string;
  staffId?: string;
  shiftId?: string;
};

export type PayrollExportRow = {
  staffId: string;
  staffName: string;
  date: string;
  hours: number;
  source: "shift" | "completed_booking";
  label?: string;
};

function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
}

function isoDate(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export async function runPayrollPreflight(
  businessId: string,
  from: Date,
  to: Date,
): Promise<{ ok: boolean; issues: PayrollPreflightIssue[] }> {
  const issues: PayrollPreflightIssue[] = [];
  const shifts = await listStaffShifts(businessId, { from, to });

  for (const s of shifts) {
    if (s.endsAt <= s.startsAt) {
      issues.push({
        code: "invalid_shift_range",
        message: "Shift end is before start",
        staffId: s.staffId,
        shiftId: s.id,
      });
    }
  }

  const pendingTimeOff = await db
    .select({ id: timeOffRequestsTable.id, staffId: timeOffRequestsTable.staffId })
    .from(timeOffRequestsTable)
    .where(
      and(
        eq(timeOffRequestsTable.businessId, businessId),
        inArray(timeOffRequestsTable.status, ["PROPOSED", "PENDING_APPROVAL", "ESCALATED"]),
        lte(timeOffRequestsTable.startAt, to),
        gte(timeOffRequestsTable.endAt, from),
      ),
    );

  if (pendingTimeOff.length > 0) {
    issues.push({
      code: "pending_time_off",
      message: `${pendingTimeOff.length} time-off request(s) still pending approval in this period`,
    });
  }

  return { ok: issues.length === 0, issues };
}

export async function buildPayrollExportCsv(args: {
  businessId: string;
  from: Date;
  to: Date;
  timezone: string;
  format: "ie" | "gb";
}): Promise<{ csv: string; rows: PayrollExportRow[]; preflight: Awaited<ReturnType<typeof runPayrollPreflight>> }> {
  const preflight = await runPayrollPreflight(args.businessId, args.from, args.to);
  const shifts = await listStaffShifts(args.businessId, { from: args.from, to: args.to });

  const staffIds = [...new Set(shifts.map((s) => s.staffId))];
  const staffRows =
    staffIds.length > 0
      ? await db
          .select({
            id: staffTable.id,
            displayName: staffTable.displayName,
          })
          .from(staffTable)
          .where(
            and(eq(staffTable.businessId, args.businessId), inArray(staffTable.id, staffIds)),
          )
      : [];

  const staffName = new Map(staffRows.map((s) => [s.id, s.displayName]));
  const rows: PayrollExportRow[] = [];

  for (const s of shifts) {
    rows.push({
      staffId: s.staffId,
      staffName: staffName.get(s.staffId) ?? s.staffId,
      date: isoDate(s.startsAt, args.timezone),
      hours: Math.round(hoursBetween(s.startsAt, s.endsAt) * 100) / 100,
      source: "shift",
      label: s.label ?? undefined,
    });
  }

  const completed = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, args.businessId),
        eq(bookingsTable.status, "COMPLETED"),
        gte(bookingsTable.startAt, args.from),
        lte(bookingsTable.startAt, args.to),
      ),
    );

  for (const b of completed) {
    if (!b.staffId) continue;
    const name =
      staffName.get(b.staffId) ??
      (
        await db
          .select({ displayName: staffTable.displayName })
          .from(staffTable)
          .where(eq(staffTable.id, b.staffId))
          .then((r) => r[0]?.displayName)
      ) ??
      b.staffId;
    rows.push({
      staffId: b.staffId,
      staffName: name,
      date: isoDate(b.startAt, args.timezone),
      hours: Math.round(hoursBetween(b.startAt, b.endAt) * 100) / 100,
      source: "completed_booking",
      label: `booking:${b.id.slice(-6)}`,
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || a.staffName.localeCompare(b.staffName));

  const header =
    args.format === "gb"
      ? "Staff ID,Staff Name,Date,Hours,Source,Notes"
      : "Staff ID,Staff Name,Date,Hours,Source,Notes";

  const lines = [
    header,
    ...rows.map((r) =>
      [
        r.staffId,
        `"${r.staffName.replace(/"/g, '""')}"`,
        r.date,
        r.hours.toFixed(2),
        r.source,
        r.label ? `"${r.label.replace(/"/g, '""')}"` : "",
      ].join(","),
    ),
  ];

  return { csv: lines.join("\n"), rows, preflight };
}
