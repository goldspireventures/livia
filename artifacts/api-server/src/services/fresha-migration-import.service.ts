/**
 * Fresha partner read — best-effort when partner credentials are configured.
 * Falls back gracefully when partner endpoints are unavailable (CSV path remains primary).
 */
import { db, bookingsTable } from "@workspace/db";
import { generateId } from "../lib/id";
import {
  ensureCustomer,
  ensureService,
  parseIsoDate,
  splitPersonName,
} from "./migration-import-helpers";

const FRESHA_PARTNER_BASE =
  process.env.FRESHA_PARTNER_API_BASE?.replace(/\/$/, "") ??
  "https://partners-api.fresha.com";

type FreshaClient = {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
};

type FreshaBooking = {
  id?: string;
  start_time?: string;
  end_time?: string;
  client?: FreshaClient;
  service_name?: string;
  status?: string;
};

async function freshaFetch<T>(
  accessToken: string,
  path: string,
): Promise<T | null> {
  const res = await fetch(`${FRESHA_PARTNER_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function runFreshaMigrationImport(
  businessId: string,
  accessToken: string,
): Promise<{
  clients: { imported: number; skipped: number; errors: string[] };
  services: { imported: number; skipped: number; errors: string[] };
  appointments: { imported: number; skipped: number; errors: string[] };
  partnerApiAvailable: boolean;
}> {
  const clients = { imported: 0, skipped: 0, errors: [] as string[] };
  const services = { imported: 0, skipped: 0, errors: [] as string[] };
  const appointments = { imported: 0, skipped: 0, errors: [] as string[] };

  const clientPage = await freshaFetch<{ data?: FreshaClient[] }>(accessToken, "/v1/clients?limit=250");
  const clientRows = clientPage?.data ?? [];
  let partnerApiAvailable = clientPage !== null;

  for (const row of clientRows) {
    if (!row.first_name && !row.email && !row.mobile) {
      clients.skipped++;
      continue;
    }
    try {
      await ensureCustomer(businessId, {
        firstName: row.first_name ?? "Guest",
        lastName: row.last_name,
        email: row.email,
        phone: row.mobile,
      });
      clients.imported++;
    } catch {
      clients.skipped++;
    }
  }

  const bookingPage = await freshaFetch<{ data?: FreshaBooking[] }>(
    accessToken,
    "/v1/bookings?status=confirmed&limit=250",
  );
  if (bookingPage === null) {
    partnerApiAvailable = false;
  }

  const serviceNames = new Set<string>();
  for (const row of bookingPage?.data ?? []) {
    if (row.status === "cancelled") {
      appointments.skipped++;
      continue;
    }
    const startAt = parseIsoDate(row.start_time);
    if (!startAt) {
      appointments.skipped++;
      continue;
    }
    const endAt =
      parseIsoDate(row.end_time) ?? new Date(startAt.getTime() + 60 * 60_000);
    const serviceName = row.service_name ?? "Imported Fresha booking";
    serviceNames.add(serviceName);

    const client = row.client;
    const name = splitPersonName(
      client ? [client.first_name, client.last_name].filter(Boolean).join(" ") : undefined,
    );

    try {
      const customer = await ensureCustomer(businessId, {
        firstName: client?.first_name ?? name.firstName,
        lastName: client?.last_name ?? name.lastName,
        email: client?.email,
        phone: client?.mobile,
      });
      const service = await ensureService(businessId, {
        name: serviceName,
        durationMinutes: Math.max(1, Math.round((endAt.getTime() - startAt.getTime()) / 60_000)),
      });

      await db.insert(bookingsTable).values({
        id: generateId(),
        businessId,
        serviceId: service.id,
        customerId: customer.id,
        staffId: null,
        startAt,
        endAt,
        status: "CONFIRMED",
        source: "web",
        channelType: "WEB",
        notes: row.id ? `Imported from Fresha (#${row.id})` : "Imported from Fresha",
      });
      appointments.imported++;
    } catch {
      appointments.skipped++;
    }
  }

  for (const name of serviceNames) {
    try {
      await ensureService(businessId, { name, durationMinutes: 60, priceMinor: 0 });
      services.imported++;
    } catch {
      services.skipped++;
    }
  }

  if (!partnerApiAvailable && clients.imported === 0 && appointments.imported === 0) {
    clients.errors.push(
      "Fresha partner API unavailable — use client CSV import meanwhile.",
    );
  }

  return { clients, services, appointments, partnerApiAvailable };
}
