import { db, bookingsTable } from "@workspace/db";
import {
  ensureCustomer,
  ensureService,
  ensureStaffMember,
  findStaffByName,
  parseIsoDate,
  splitPersonName,
} from "./migration-import-helpers";
import { generateId } from "../lib/id";
import { getBusinessById } from "./businesses.service";

type ZenotiService = {
  id?: string;
  name?: string;
  duration?: number;
  price_info?: { sale_price?: number };
};

type ZenotiGuest = {
  id?: string;
  personal_info?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile_phone?: string;
  };
};

type ZenotiAppointment = {
  appointment_id?: string;
  start_time?: string;
  end_time?: string;
  guest?: ZenotiGuest;
  service?: { name?: string };
  therapist?: { name?: string };
  status?: number;
};

function zenotiApiKey(): string | null {
  const key = process.env.ZENOTI_PARTNER_API_KEY;
  return key?.trim() ? key.trim() : null;
}

async function zenotiFetch<T>(
  path: string,
): Promise<{ ok: true; data: T[] } | { ok: false; message: string }> {
  const apiKey = zenotiApiKey();
  if (!apiKey) {
    return { ok: false, message: "Zenoti partner API key not configured." };
  }
  const res = await fetch(`https://api.zenoti.com/v1${path}`, {
    headers: {
      Authorization: `apikey ${apiKey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    return { ok: false, message: `Zenoti API ${res.status}: ${res.statusText}` };
  }
  const json = (await res.json()) as T | { services?: T[]; guests?: T[]; appointments?: T[] };
  if (Array.isArray(json)) return { ok: true, data: json };
  if (json && typeof json === "object") {
    const obj = json as { services?: T[]; guests?: T[]; appointments?: T[] };
    if (obj.services) return { ok: true, data: obj.services };
    if (obj.guests) return { ok: true, data: obj.guests };
    if (obj.appointments) return { ok: true, data: obj.appointments };
  }
  return { ok: true, data: [json as T] };
}

export async function runZenotiMigrationImport(
  businessId: string,
  centerId: string,
): Promise<{
  ok: boolean;
  message: string;
  clients: { imported: number; skipped: number; errors: string[] };
  services: { imported: number; skipped: number; errors: string[] };
  appointments: { imported: number; skipped: number; errors: string[] };
}> {
  const clients = { imported: 0, skipped: 0, errors: [] as string[] };
  const services = { imported: 0, skipped: 0, errors: [] as string[] };
  const appointments = { imported: 0, skipped: 0, errors: [] as string[] };

  const trimmed = centerId.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: "Zenoti center ID required.",
      clients,
      services,
      appointments,
    };
  }

  const guestRes = await zenotiFetch<ZenotiGuest>(
    `/guests?center_id=${encodeURIComponent(trimmed)}&page=1&size=100`,
  );
  if (guestRes.ok) {
    for (const row of guestRes.data) {
      const pi = row.personal_info;
      const name = splitPersonName(
        `${pi?.first_name ?? ""} ${pi?.last_name ?? ""}`.trim(),
      );
      if (!name.firstName && !pi?.email && !pi?.mobile_phone) {
        clients.skipped++;
        continue;
      }
      try {
        await ensureCustomer(businessId, {
          firstName: pi?.first_name ?? name.firstName,
          lastName: pi?.last_name ?? name.lastName,
          email: pi?.email,
          phone: pi?.mobile_phone,
        });
        clients.imported++;
      } catch {
        clients.skipped++;
        clients.errors.push("Zenoti guest import failed");
      }
    }
  } else if (guestRes.message.includes("not configured")) {
    return { ok: false, message: guestRes.message, clients, services, appointments };
  }

  const serviceRes = await zenotiFetch<ZenotiService>(
    `/centers/${encodeURIComponent(trimmed)}/services`,
  );
  if (serviceRes.ok) {
    for (const row of serviceRes.data) {
      if (!row.name) {
        services.skipped++;
        continue;
      }
      try {
        const priceMinor =
          typeof row.price_info?.sale_price === "number"
            ? Math.round(row.price_info.sale_price * 100)
            : undefined;
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
  const start = now.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + 60 * 24 * 60 * 60_000).toISOString().slice(0, 10);
  const apptRes = await zenotiFetch<ZenotiAppointment>(
    `/appointments?center_id=${encodeURIComponent(trimmed)}&start_date=${start}&end_date=${end}`,
  );
  if (apptRes.ok) {
    const biz = await getBusinessById(businessId);
    void (biz?.timezone ?? "Europe/Dublin");
    for (const row of apptRes.data) {
      if (row.status === -1) {
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
      const pi = row.guest?.personal_info;
      try {
        const customer = await ensureCustomer(businessId, {
          firstName: pi?.first_name ?? "Guest",
          lastName: pi?.last_name,
          email: pi?.email,
          phone: pi?.mobile_phone,
        });
        const service = await ensureService(businessId, {
          name: row.service?.name ?? "Imported appointment",
          durationMinutes: Math.max(1, Math.round((endAt.getTime() - startAt.getTime()) / 60_000)),
        });
        const staffName = row.therapist?.name;
        const staff = staffName ? await findStaffByName(businessId, staffName) : null;
        if (staffName && !staff) {
          await ensureStaffMember(businessId, { displayName: staffName });
        }
        const staffResolved = staffName ? await findStaffByName(businessId, staffName) : null;
        await db.insert(bookingsTable).values({
          id: generateId(),
          businessId,
          serviceId: service.id,
          customerId: customer.id,
          staffId: staffResolved?.id ?? null,
          startAt,
          endAt,
          status: "CONFIRMED",
          source: "web",
          channelType: "WEB",
          notes: row.appointment_id
            ? `Imported from Zenoti (#${row.appointment_id})`
            : "Imported from Zenoti",
        });
        appointments.imported++;
      } catch {
        appointments.skipped++;
        appointments.errors.push(`Zenoti appointment ${row.appointment_id ?? "?"} failed`);
      }
    }
  }

  const total = clients.imported + services.imported + appointments.imported;
  return {
    ok: total > 0,
    message:
      total > 0
        ? `Zenoti import: ${clients.imported} clients, ${services.imported} services, ${appointments.imported} bookings.`
        : "Zenoti returned no importable rows — verify center ID and API access.",
    clients,
    services,
    appointments,
  };
}
