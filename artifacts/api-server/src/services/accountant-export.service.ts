import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db, bookingsTable, servicesTable } from "@workspace/db";
import { buildPayrollExportCsv, runPayrollPreflight } from "./payroll-export.service";
import { getBusinessById } from "./businesses.service";

export type AccountantPreview = {
  businessName: string;
  period: { from: string; to: string };
  revenue: {
    completedBookings: number;
    grossMinor: number;
    currency: string;
  };
  payroll: {
    preflightOk: boolean;
    issueCount: number;
    csvPreviewLines: string[];
  };
  disclaimer: string;
};

export async function buildAccountantPreview(
  businessId: string,
  days = 7,
): Promise<AccountantPreview | null> {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  const [rev] = await db
    .select({
      count: sql<number>`count(*)::int`,
      gross: sql<number>`coalesce(sum(${servicesTable.priceMinor}), 0)::int`,
    })
    .from(bookingsTable)
    .innerJoin(servicesTable, eq(servicesTable.id, bookingsTable.serviceId))
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "COMPLETED"),
        gte(bookingsTable.startAt, from),
        lte(bookingsTable.startAt, to),
      ),
    );

  const preflight = await runPayrollPreflight(businessId, from, to);
  const payrollExport = await buildPayrollExportCsv({
    businessId,
    from,
    to,
    timezone: biz.timezone ?? "Europe/Dublin",
    format: biz.country === "GB" ? "gb" : "ie",
  });
  const csvLines = payrollExport.csv.split("\n").slice(0, 8);

  return {
    businessName: biz.name,
    period: { from: from.toISOString(), to: to.toISOString() },
    revenue: {
      completedBookings: rev?.count ?? 0,
      grossMinor: rev?.gross ?? 0,
      currency: biz.currency ?? "EUR",
    },
    payroll: {
      preflightOk: preflight.ok,
      issueCount: preflight.issues.length,
      csvPreviewLines: csvLines,
    },
    disclaimer:
      "Read-only preview for your accountant — not tax advice. Full export ships with payroll integration.",
  };
}

export function accountantPreviewToCsv(preview: AccountantPreview): string {
  const lines = [
    "section,value",
    `business,${JSON.stringify(preview.businessName)}`,
    `completed_bookings,${preview.revenue.completedBookings}`,
    `gross_minor,${preview.revenue.grossMinor}`,
    `currency,${preview.revenue.currency}`,
    `payroll_preflight_ok,${preview.payroll.preflightOk}`,
    "",
    "--- payroll hours preview ---",
    ...preview.payroll.csvPreviewLines,
  ];
  return lines.join("\n");
}
