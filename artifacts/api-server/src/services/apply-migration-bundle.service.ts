import { db, bookingsTable } from "@workspace/db";
import {
  LIVIA_MIGRATION_BUNDLE_ENTITY_ORDER,
  type ImportEntityKind,
  type LiviaMigrationEntityBundle,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { getBusinessById } from "./businesses.service";
import {
  ensureCustomer,
  ensureService,
  ensureStaffMember,
  findStaffByName,
  parseIsoDate,
} from "./migration-import-helpers";
import {
  applyImportToOnboarding,
  type ImportOnboardingSideEffects,
} from "./import-onboarding.service";

export type BundleEntityResult = {
  kind: ImportEntityKind;
  imported: number;
  skipped: number;
  errors: string[];
};

export type ApplyMigrationBundleResult = {
  ok: boolean;
  message: string;
  results: BundleEntityResult[];
  totalImported: number;
  onboarding?: ImportOnboardingSideEffects;
};

function countBundleRows(bundle: LiviaMigrationEntityBundle): number {
  return (
    (bundle.clients?.length ?? 0) +
    (bundle.services?.length ?? 0) +
    (bundle.staff?.length ?? 0) +
    (bundle.appointments?.length ?? 0)
  );
}

async function applyClients(
  businessId: string,
  bundle: LiviaMigrationEntityBundle,
): Promise<BundleEntityResult> {
  const result: BundleEntityResult = { kind: "clients", imported: 0, skipped: 0, errors: [] };
  for (const row of bundle.clients ?? []) {
    if (!row.firstName?.trim()) {
      result.skipped++;
      continue;
    }
    try {
      await ensureCustomer(businessId, row);
      result.imported++;
    } catch {
      result.skipped++;
      result.errors.push(`Client ${row.email ?? row.firstName} failed`);
    }
  }
  return result;
}

async function applyServices(
  businessId: string,
  bundle: LiviaMigrationEntityBundle,
): Promise<BundleEntityResult> {
  const result: BundleEntityResult = { kind: "services", imported: 0, skipped: 0, errors: [] };
  for (const row of bundle.services ?? []) {
    if (!row.name?.trim()) {
      result.skipped++;
      continue;
    }
    try {
      await ensureService(businessId, {
        name: row.name,
        durationMinutes: row.durationMinutes,
        priceMinor: row.priceMinor,
      });
      result.imported++;
    } catch {
      result.skipped++;
      result.errors.push(`Service ${row.name} failed`);
    }
  }
  return result;
}

async function applyStaff(
  businessId: string,
  bundle: LiviaMigrationEntityBundle,
): Promise<BundleEntityResult> {
  const result: BundleEntityResult = { kind: "staff", imported: 0, skipped: 0, errors: [] };
  for (const row of bundle.staff ?? []) {
    if (!row.displayName?.trim()) {
      result.skipped++;
      continue;
    }
    try {
      await ensureStaffMember(businessId, row);
      result.imported++;
    } catch {
      result.skipped++;
      result.errors.push(`Staff ${row.displayName} failed`);
    }
  }
  return result;
}

async function applyAppointments(
  businessId: string,
  bundle: LiviaMigrationEntityBundle,
): Promise<BundleEntityResult> {
  const result: BundleEntityResult = { kind: "appointments", imported: 0, skipped: 0, errors: [] };
  const biz = await getBusinessById(businessId);
  void (biz?.timezone ?? "Europe/Dublin");

  for (const row of bundle.appointments ?? []) {
    if (row.status === "cancelled") {
      result.skipped++;
      continue;
    }
    const startAt = parseIsoDate(row.startAt);
    if (!startAt) {
      result.skipped++;
      continue;
    }
    const endAt =
      parseIsoDate(row.endAt) ??
      new Date(startAt.getTime() + 60 * 60_000);

    try {
      const customer = await ensureCustomer(businessId, {
        firstName: "Guest",
        lastName: undefined,
      });
      const service = await ensureService(businessId, {
        name: row.serviceName ?? "Imported appointment",
        durationMinutes: Math.max(1, Math.round((endAt.getTime() - startAt.getTime()) / 60_000)),
      });
      const staff = row.staffName ? await findStaffByName(businessId, row.staffName) : null;

      await db.insert(bookingsTable).values({
        id: generateId(),
        businessId,
        serviceId: service.id,
        customerId: customer.id,
        staffId: staff?.id ?? null,
        startAt,
        endAt,
        status: "CONFIRMED",
        source: "web",
        channelType: "WEB",
        notes: row.externalId ? `Imported (#${row.externalId})` : "Imported",
      });
      result.imported++;
    } catch {
      result.skipped++;
      result.errors.push(`Appointment ${row.externalId ?? row.startAt} failed`);
    }
  }
  return result;
}

const APPLY_BY_KIND: Record<
  ImportEntityKind,
  (businessId: string, bundle: LiviaMigrationEntityBundle) => Promise<BundleEntityResult>
> = {
  services: applyServices,
  staff: applyStaff,
  clients: applyClients,
  appointments: applyAppointments,
};

export function estimateMigrationBundleRows(bundle: LiviaMigrationEntityBundle): number {
  return countBundleRows(bundle);
}

export async function applyMigrationEntityBundle(
  businessId: string,
  bundle: LiviaMigrationEntityBundle,
  opts: { applyOnboarding?: boolean } = {},
): Promise<ApplyMigrationBundleResult> {
  const applyOnboarding = opts.applyOnboarding !== false;
  const results: BundleEntityResult[] = [];
  let totalImported = 0;
  let onboarding: ImportOnboardingSideEffects | undefined;

  for (const kind of LIVIA_MIGRATION_BUNDLE_ENTITY_ORDER) {
    const rows =
      kind === "clients"
        ? bundle.clients
        : kind === "services"
          ? bundle.services
          : kind === "staff"
            ? bundle.staff
            : bundle.appointments;
    if (!rows?.length) continue;

    const entityResult = await APPLY_BY_KIND[kind](businessId, bundle);
    results.push(entityResult);
    totalImported += entityResult.imported;

    if (applyOnboarding && entityResult.imported > 0) {
      const side = await applyImportToOnboarding(businessId, kind, entityResult.imported);
      onboarding = {
        actsCompleted: [...(onboarding?.actsCompleted ?? []), ...side.actsCompleted],
        checklistUpdates: { ...(onboarding?.checklistUpdates ?? {}), ...side.checklistUpdates },
      };
    }
  }

  const ok = totalImported > 0;
  return {
    ok,
    message: ok
      ? `Imported ${totalImported} record(s) from migration bundle.`
      : "No rows imported — check export format.",
    results,
    totalImported,
    onboarding,
  };
}
