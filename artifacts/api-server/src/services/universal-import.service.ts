import { db, customersTable, servicesTable, staffTable, bookingsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import {
  type ImportEntityKind,
  IMPORT_KIND_LABELS,
  normalizeAppointmentRow,
  normalizeClientRow,
  normalizeServiceRow,
  normalizeStaffRow,
  parseCsvImport,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { createCustomer } from "./customers.service";
import { createService } from "./services.service";
import { createStaff } from "./staff.service";
import { getBusinessById } from "./businesses.service";
import {
  applyImportToOnboarding,
  type ImportOnboardingSideEffects,
} from "./import-onboarding.service";

export type UniversalImportResult = {
  kind: ImportEntityKind | "unknown";
  kindLabel: string;
  imported: number;
  skipped: number;
  errors: string[];
  detectedHeaders: string[];
  onboarding?: ImportOnboardingSideEffects;
};

async function findCustomerByEmailOrPhone(
  businessId: string,
  email?: string,
  phone?: string,
) {
  if (email) {
    const [c] = await db
      .select()
      .from(customersTable)
      .where(and(eq(customersTable.businessId, businessId), eq(customersTable.email, email)))
      .limit(1);
    if (c) return c;
  }
  if (phone) {
    const [c] = await db
      .select()
      .from(customersTable)
      .where(and(eq(customersTable.businessId, businessId), eq(customersTable.phone, phone)))
      .limit(1);
    if (c) return c;
  }
  return null;
}

async function findServiceByName(businessId: string, name: string) {
  const services = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.businessId, businessId));
  const lower = name.toLowerCase();
  return services.find((s) => s.name.toLowerCase() === lower) ?? null;
}

async function findStaffByName(businessId: string, name: string) {
  const staff = await db
    .select()
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));
  const lower = name.toLowerCase();
  return (
    staff.find(
      (s) =>
        s.displayName.toLowerCase() === lower ||
        `${s.firstName} ${s.lastName ?? ""}`.trim().toLowerCase() === lower,
    ) ?? null
  );
}

function parseAppointmentStart(dateRaw: string, timeRaw?: string, timezone = "Europe/Dublin"): Date | null {
  const combined = timeRaw ? `${dateRaw} ${timeRaw}` : dateRaw;
  const parsed = new Date(combined);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const isoTry = Date.parse(combined);
  if (!Number.isNaN(isoTry)) return new Date(isoTry);
  void timezone;
  return null;
}

async function importClients(
  businessId: string,
  records: Record<string, string>[],
  columnMap: Record<string, string>,
): Promise<Pick<UniversalImportResult, "imported" | "skipped" | "errors">> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const normalized = normalizeClientRow(records[i]!, columnMap);
    if (!normalized) {
      skipped++;
      continue;
    }
    const existing = await findCustomerByEmailOrPhone(
      businessId,
      normalized.email,
      normalized.phone,
    );
    if (existing) {
      skipped++;
      continue;
    }
    try {
      await createCustomer(businessId, {
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        email: normalized.email,
        phone: normalized.phone,
        notes: normalized.notes,
      });
      imported++;
    } catch {
      errors.push(`Row ${i + 2}: could not import client`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

async function importServices(
  businessId: string,
  records: Record<string, string>[],
  columnMap: Record<string, string>,
): Promise<Pick<UniversalImportResult, "imported" | "skipped" | "errors">> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const normalized = normalizeServiceRow(records[i]!, columnMap);
    if (!normalized) {
      skipped++;
      continue;
    }
    const existing = await findServiceByName(businessId, normalized.name);
    if (existing) {
      skipped++;
      continue;
    }
    try {
      await createService(businessId, normalized);
      imported++;
    } catch {
      errors.push(`Row ${i + 2}: could not import service`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

async function importStaffRows(
  businessId: string,
  records: Record<string, string>[],
  columnMap: Record<string, string>,
): Promise<Pick<UniversalImportResult, "imported" | "skipped" | "errors">> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const normalized = normalizeStaffRow(records[i]!, columnMap);
    if (!normalized) {
      skipped++;
      continue;
    }
    const displayName =
      normalized.displayName ??
      [normalized.firstName, normalized.lastName].filter(Boolean).join(" ");
    const existing = await findStaffByName(businessId, displayName);
    if (existing) {
      skipped++;
      continue;
    }
    try {
      await createStaff(businessId, {
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        displayName,
        email: normalized.email,
        color: "#6366f1",
      });
      imported++;
    } catch {
      errors.push(`Row ${i + 2}: could not import team member`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

async function importAppointments(
  businessId: string,
  records: Record<string, string>[],
  columnMap: Record<string, string>,
): Promise<Pick<UniversalImportResult, "imported" | "skipped" | "errors">> {
  const biz = await getBusinessById(businessId);
  const timezone = biz?.timezone ?? "Europe/Dublin";
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const normalized = normalizeAppointmentRow(records[i]!, columnMap);
    if (!normalized?.date) {
      skipped++;
      continue;
    }
    const startAt = parseAppointmentStart(normalized.date, normalized.time, timezone);
    if (!startAt) {
      errors.push(`Row ${i + 2}: could not parse date/time`);
      skipped++;
      continue;
    }

    let customer = await findCustomerByEmailOrPhone(
      businessId,
      normalized.email,
      normalized.phone,
    );
    if (!customer && (normalized.firstName || normalized.email || normalized.phone)) {
      try {
        customer = await createCustomer(businessId, {
          firstName: normalized.firstName || "Imported",
          lastName: normalized.lastName,
          email: normalized.email,
          phone: normalized.phone,
        });
      } catch {
        errors.push(`Row ${i + 2}: could not create client for appointment`);
        skipped++;
        continue;
      }
    }
    if (!customer) {
      skipped++;
      continue;
    }

    let service = await findServiceByName(businessId, normalized.serviceName);
    if (!service) {
      try {
        service = await createService(businessId, {
          name: normalized.serviceName,
          durationMinutes: 60,
          priceMinor: 0,
          category: "Imported",
        });
      } catch {
        errors.push(`Row ${i + 2}: could not resolve service`);
        skipped++;
        continue;
      }
    }

    const staff = normalized.staffName
      ? await findStaffByName(businessId, normalized.staffName)
      : null;

    const endAt = new Date(startAt.getTime() + (service.durationMinutes ?? 60) * 60_000);

    try {
      await db.insert(bookingsTable).values({
        id: generateId(),
        businessId,
        serviceId: service.id,
        customerId: customer.id,
        staffId: staff?.id ?? null,
        startAt,
        endAt,
        status: "CONFIRMED",
        source: "google-cal-import",
        channelType: "WEB",
        notes: normalized.status ? `Imported — prior status: ${normalized.status}` : "Imported appointment",
      });
      imported++;
    } catch {
      errors.push(`Row ${i + 2}: could not create booking`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

export async function runUniversalCsvImport(
  businessId: string,
  csvText: string,
  opts?: { kindHint?: ImportEntityKind; applyOnboarding?: boolean },
): Promise<UniversalImportResult> {
  const { format, records, headers } = parseCsvImport(csvText);
  const kind = opts?.kindHint ?? format?.kind ?? "clients";

  if (records.length === 0) {
    return {
      kind: "unknown",
      kindLabel: "Unknown",
      imported: 0,
      skipped: 0,
      errors: ["Empty file or no data rows"],
      detectedHeaders: headers,
    };
  }

  const columnMap = format?.columnMap ?? {};
  if (opts?.kindHint && format && format.kind !== opts.kindHint) {
    // Re-detect with forced kind — use same headers with kind-specific normalize
  }

  let result: Pick<UniversalImportResult, "imported" | "skipped" | "errors">;
  switch (kind) {
    case "services":
      result = await importServices(businessId, records, columnMap);
      break;
    case "appointments":
      result = await importAppointments(businessId, records, columnMap);
      break;
    case "staff":
      result = await importStaffRows(businessId, records, columnMap);
      break;
    case "clients":
    default:
      result = await importClients(businessId, records, columnMap);
      break;
  }

  const onboarding =
    opts?.applyOnboarding !== false && result.imported > 0
      ? await applyImportToOnboarding(businessId, kind, result.imported)
      : undefined;

  return {
    kind,
    kindLabel: IMPORT_KIND_LABELS[kind] ?? kind,
    ...result,
    detectedHeaders: headers,
    onboarding,
  };
}

/** Auto-detect and import — Liv magic setup from a single paste. */
export async function runMagicStudioImport(
  businessId: string,
  bundles: { clientsCsv?: string; servicesCsv?: string; appointmentsCsv?: string; staffCsv?: string },
): Promise<{
  results: UniversalImportResult[];
  onboarding: ImportOnboardingSideEffects;
}> {
  const results: UniversalImportResult[] = [];
  const merged: ImportOnboardingSideEffects = {
    actsCompleted: [],
    checklistUpdates: {},
  };

  const entries: [ImportEntityKind, string | undefined][] = [
    ["services", bundles.servicesCsv],
    ["staff", bundles.staffCsv],
    ["clients", bundles.clientsCsv],
    ["appointments", bundles.appointmentsCsv],
  ];

  for (const [kind, csv] of entries) {
    if (!csv?.trim()) continue;
    const res = await runUniversalCsvImport(businessId, csv, {
      kindHint: kind,
      applyOnboarding: true,
    });
    results.push(res);
    if (res.onboarding) {
      merged.actsCompleted.push(...res.onboarding.actsCompleted);
      Object.assign(merged.checklistUpdates, res.onboarding.checklistUpdates);
    }
  }

  merged.actsCompleted = [...new Set(merged.actsCompleted)];

  return { results, onboarding: merged };
}
