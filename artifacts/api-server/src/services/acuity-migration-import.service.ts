import { db, bookingsTable } from "@workspace/db";
import { generateId } from "../lib/id";
import { getBusinessById } from "./businesses.service";
import {
  ensureCustomer,
  ensureService,
  ensureStaffMember,
  findStaffByName,
  parseIsoDate,
  splitPersonName,
} from "./migration-import-helpers";

const ACUITY_BASE = "https://acuityscheduling.com/api/v1";

type AcuityClient = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

type AcuityAppointmentType = {
  id: number;
  name: string;
  duration?: number;
  price?: string;
};

type AcuityAppointment = {
  id: number;
  datetime?: string;
  endTime?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type?: string;
  appointmentTypeID?: number;
  calendar?: string;
  calendarID?: number;
  price?: string;
  canceled?: boolean;
};

async function acuityFetch<T>(accessToken: string, path: string): Promise<T[]> {
  const res = await fetch(`${ACUITY_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as T | T[];
  return Array.isArray(json) ? json : [json];
}

export async function runAcuityMigrationImport(
  businessId: string,
  accessToken: string,
): Promise<{
  clients: { imported: number; skipped: number; errors: string[] };
  services: { imported: number; skipped: number; errors: string[] };
  appointments: { imported: number; skipped: number; errors: string[] };
}> {
  const clients = { imported: 0, skipped: 0, errors: [] as string[] };
  const services = { imported: 0, skipped: 0, errors: [] as string[] };
  const appointments = { imported: 0, skipped: 0, errors: [] as string[] };

  const clientRows = await acuityFetch<AcuityClient>(accessToken, "/clients");
  for (const row of clientRows) {
    if (!row.firstName && !row.email && !row.phone) {
      clients.skipped++;
      continue;
    }
    try {
      await ensureCustomer(businessId, {
        firstName: row.firstName ?? "Guest",
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
      });
      clients.imported++;
    } catch {
      clients.skipped++;
      clients.errors.push("Could not import Acuity client");
    }
  }

  const typeRows = await acuityFetch<AcuityAppointmentType>(accessToken, "/appointment-types");
  for (const row of typeRows) {
    if (!row.name) {
      services.skipped++;
      continue;
    }
    try {
      const priceMinor = row.price ? Math.round(parseFloat(row.price) * 100) : 0;
      await ensureService(businessId, {
        name: row.name,
        durationMinutes: row.duration ?? 60,
        priceMinor: Number.isFinite(priceMinor) ? priceMinor : 0,
      });
      services.imported++;
    } catch {
      services.skipped++;
    }
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 90 * 24 * 60 * 60_000);
  const minDate = now.toISOString().slice(0, 10);
  const maxDate = horizon.toISOString().slice(0, 10);
  const apptRows = await acuityFetch<AcuityAppointment>(
    accessToken,
    `/appointments?minDate=${minDate}&maxDate=${maxDate}`,
  );

  const biz = await getBusinessById(businessId);
  const timezone = biz?.timezone ?? "Europe/Dublin";
  void timezone;

  for (const row of apptRows) {
    if (row.canceled) {
      appointments.skipped++;
      continue;
    }
    const startAt = parseIsoDate(row.datetime);
    if (!startAt) {
      appointments.skipped++;
      continue;
    }
    const endAt =
      parseIsoDate(row.endTime) ??
      new Date(startAt.getTime() + (typeRows.find((t) => t.id === row.appointmentTypeID)?.duration ?? 60) * 60_000);

    try {
      const customer = await ensureCustomer(businessId, {
        firstName: row.firstName ?? "Guest",
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
      });
      const serviceName = row.type ?? "Imported appointment";
      const service = await ensureService(businessId, {
        name: serviceName,
        durationMinutes: Math.max(1, Math.round((endAt.getTime() - startAt.getTime()) / 60_000)),
      });
      const staff = row.calendar ? await findStaffByName(businessId, row.calendar) : null;

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
        notes: `Imported from Acuity (#${row.id})`,
      });
      appointments.imported++;
    } catch {
      appointments.skipped++;
      appointments.errors.push(`Acuity appointment ${row.id} failed`);
    }
  }

  return { clients, services, appointments };
}
