import {
  ensureCustomer,
  ensureService,
  ensureStaffMember,
  findStaffByName,
  parseIsoDate,
  splitPersonName,
} from "./migration-import-helpers";
import { db, bookingsTable } from "@workspace/db";
import { generateId } from "../lib/id";
import { getBusinessById } from "./businesses.service";

type PhorestClient = {
  clientId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
};

type PhorestService = {
  serviceId?: string;
  name?: string;
  duration?: number;
  price?: number;
};

type PhorestAppointment = {
  appointmentId?: string;
  startTime?: string;
  endTime?: string;
  clientId?: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientEmail?: string;
  clientMobile?: string;
  serviceName?: string;
  staffName?: string;
  cancelled?: boolean;
};

function phorestBaseUrl(): string {
  const region = (process.env.PHOREST_API_REGION ?? "eu").toLowerCase();
  const host =
    region === "us"
      ? "api-gateway-us.phorest.com"
      : region === "ap"
        ? "api-gateway-ap.phorest.com"
        : "api-gateway-eu.phorest.com";
  return `https://${host}/third-party-api-v1`;
}

function phorestAuthHeader(): string | null {
  const user = process.env.PHOREST_PARTNER_USERNAME;
  const pass = process.env.PHOREST_PARTNER_PASSWORD;
  if (!user || !pass) return null;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

/** externalId format: `businessId:branchId` or branchId with PHOREST_BUSINESS_ID env */
function parsePhorestIds(externalId: string): { businessId: string; branchId: string } | null {
  const trimmed = externalId.trim();
  if (!trimmed) return null;
  if (trimmed.includes(":")) {
    const [businessId, branchId] = trimmed.split(":");
    if (businessId && branchId) return { businessId, branchId };
  }
  const businessId = process.env.PHOREST_DEFAULT_BUSINESS_ID;
  if (businessId) return { businessId, branchId: trimmed };
  return null;
}

async function phorestFetch<T>(
  path: string,
): Promise<{ ok: true; data: T[] } | { ok: false; message: string }> {
  const auth = phorestAuthHeader();
  if (!auth) {
    return { ok: false, message: "Phorest partner credentials not configured." };
  }
  const res = await fetch(`${phorestBaseUrl()}${path}`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  if (!res.ok) {
    return { ok: false, message: `Phorest API ${res.status}: ${res.statusText}` };
  }
  const json = (await res.json()) as T | { content?: T[]; _embedded?: { clients?: T[] } };
  if (Array.isArray(json)) return { ok: true, data: json };
  if (json && typeof json === "object" && Array.isArray((json as { content?: T[] }).content)) {
    return { ok: true, data: (json as { content: T[] }).content };
  }
  if (
    json &&
    typeof json === "object" &&
    Array.isArray((json as { _embedded?: { clients?: T[] } })._embedded?.clients)
  ) {
    return { ok: true, data: (json as { _embedded: { clients: T[] } })._embedded.clients };
  }
  return { ok: true, data: [json as T] };
}

export async function runPhorestMigrationImport(
  businessId: string,
  externalId: string,
): Promise<{
  ok: boolean;
  message: string;
  clients: { imported: number; skipped: number; errors: string[] };
  services: { imported: number; skipped: number; errors: string[] };
  appointments: { imported: number; skipped: number; errors: string[] };
}> {
  const ids = parsePhorestIds(externalId);
  const clients = { imported: 0, skipped: 0, errors: [] as string[] };
  const services = { imported: 0, skipped: 0, errors: [] as string[] };
  const appointments = { imported: 0, skipped: 0, errors: [] as string[] };

  if (!ids) {
    return {
      ok: false,
      message: "Salon ID required — use branch ID or businessId:branchId.",
      clients,
      services,
      appointments,
    };
  }

  const { businessId: phorestBiz, branchId } = ids;
  const base = `/business/${phorestBiz}/branch/${branchId}`;

  const clientRes = await phorestFetch<PhorestClient>(`${base}/client?page=0&size=200`);
  if (!clientRes.ok) {
    return { ok: false, message: clientRes.message, clients, services, appointments };
  }
  for (const row of clientRes.data) {
    const name = splitPersonName(`${row.firstName ?? ""} ${row.lastName ?? ""}`.trim());
    if (!name.firstName && !row.email && !row.mobile) {
      clients.skipped++;
      continue;
    }
    try {
      await ensureCustomer(businessId, {
        firstName: row.firstName ?? name.firstName,
        lastName: row.lastName ?? name.lastName,
        email: row.email,
        phone: row.mobile,
      });
      clients.imported++;
    } catch {
      clients.skipped++;
      clients.errors.push("Phorest client import failed");
    }
  }

  const serviceRes = await phorestFetch<PhorestService>(`${base}/service`);
  if (serviceRes.ok) {
    for (const row of serviceRes.data) {
      if (!row.name) {
        services.skipped++;
        continue;
      }
      try {
        const priceMinor =
          typeof row.price === "number" ? Math.round(row.price * 100) : undefined;
        await ensureService(businessId, {
          name: row.name,
          durationMinutes: row.duration ?? 60,
          priceMinor,
        });
        services.imported++;
      } catch {
        services.skipped++;
      }
    }
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 24 * 60 * 60_000);
  const from = now.toISOString();
  const to = horizon.toISOString();
  const apptRes = await phorestFetch<PhorestAppointment>(
    `${base}/appointment?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  if (apptRes.ok) {
    const biz = await getBusinessById(businessId);
    void (biz?.timezone ?? "Europe/Dublin");
    for (const row of apptRes.data) {
      if (row.cancelled) {
        appointments.skipped++;
        continue;
      }
      const startAt = parseIsoDate(row.startTime);
      if (!startAt) {
        appointments.skipped++;
        continue;
      }
      const endAt =
        parseIsoDate(row.endTime) ?? new Date(startAt.getTime() + 60 * 60_000);
      try {
        const customer = await ensureCustomer(businessId, {
          firstName: row.clientFirstName ?? "Guest",
          lastName: row.clientLastName,
          email: row.clientEmail,
          phone: row.clientMobile,
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
          notes: row.appointmentId ? `Imported from Phorest (#${row.appointmentId})` : "Imported from Phorest",
        });
        appointments.imported++;
      } catch {
        appointments.skipped++;
        appointments.errors.push(`Phorest appointment ${row.appointmentId ?? "?"} failed`);
      }
    }
  }

  const total = clients.imported + services.imported + appointments.imported;
  return {
    ok: total > 0,
    message:
      total > 0
        ? `Phorest import: ${clients.imported} clients, ${services.imported} services, ${appointments.imported} bookings.`
        : "Phorest returned no importable rows — verify salon ID and partner access.",
    clients,
    services,
    appointments,
  };
}
