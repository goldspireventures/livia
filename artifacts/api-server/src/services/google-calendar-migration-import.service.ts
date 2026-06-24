import { db, bookingsTable } from "@workspace/db";
import { and, eq, gte, like } from "drizzle-orm";
import { generateId } from "../lib/id";
import { getGoogleCalendarAccessToken } from "./google-calendar-sync.service";
import {
  ensureCustomer,
  ensureService,
  findStaffByName,
  parseIsoDate,
  splitPersonName,
} from "./migration-import-helpers";

const GCAL_BOOKING_TAG = "[gcal-booking:";

type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

async function fetchGoogleEvents(accessToken: string, timeMin: Date, timeMax: Date): Promise<GoogleEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: GoogleEvent[] };
  return json.items ?? [];
}

function parseEventWindow(ev: GoogleEvent): { start: Date; end: Date } | null {
  const startRaw = ev.start?.dateTime ?? (ev.start?.date ? `${ev.start.date}T09:00:00Z` : null);
  const endRaw = ev.end?.dateTime ?? (ev.end?.date ? `${ev.end.date}T10:00:00Z` : null);
  if (!startRaw || !endRaw) return null;
  const start = parseIsoDate(startRaw);
  const end = parseIsoDate(endRaw);
  if (!start || !end || end <= start) return null;
  return { start, end };
}

function parseClientFromSummary(summary?: string): { serviceName: string; clientName?: string } {
  const raw = (summary ?? "Calendar appointment").trim();
  const parts = raw.split(/[·\-–|]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { serviceName: parts[0]!, clientName: parts.slice(1).join(" ") };
  }
  const name = splitPersonName(raw);
  if (name.firstName !== "Imported") {
    return { serviceName: "Imported calendar appointment", clientName: raw };
  }
  return { serviceName: raw || "Imported calendar appointment" };
}

export async function runGoogleCalendarMigrationImport(businessId: string): Promise<{
  appointments: { imported: number; skipped: number; errors: string[] };
}> {
  const appointments = { imported: 0, skipped: 0, errors: [] as string[] };
  const token = await getGoogleCalendarAccessToken(businessId);
  if (!token) {
    appointments.errors.push("Google Calendar not connected.");
    return { appointments };
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 90 * 24 * 60 * 60_000);
  const events = await fetchGoogleEvents(token, now, horizon);
  const active = events.filter((e) => e.id && e.status !== "cancelled");

  const existing = await db
    .select({ notes: bookingsTable.notes })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.businessId, businessId), like(bookingsTable.notes, `${GCAL_BOOKING_TAG}%`)));

  const existingIds = new Set(
    existing
      .map((r) => r.notes?.match(/\[gcal-booking:([^\]]+)\]/)?.[1])
      .filter(Boolean) as string[],
  );

  for (const ev of active) {
    if (existingIds.has(ev.id)) {
      appointments.skipped++;
      continue;
    }
    const window = parseEventWindow(ev);
    if (!window) {
      appointments.skipped++;
      continue;
    }

    const parsed = parseClientFromSummary(ev.summary);
    const clientParts = splitPersonName(parsed.clientName);

    try {
      const customer = await ensureCustomer(businessId, {
        firstName: clientParts.firstName,
        lastName: clientParts.lastName,
      });
      const durationMinutes = Math.max(
        1,
        Math.round((window.end.getTime() - window.start.getTime()) / 60_000),
      );
      const service = await ensureService(businessId, {
        name: parsed.serviceName,
        durationMinutes,
      });

      const staffHint = ev.description?.match(/with\s+([^\n]+)/i)?.[1];
      const staff = staffHint ? await findStaffByName(businessId, staffHint.trim()) : null;

      await db.insert(bookingsTable).values({
        id: generateId(),
        businessId,
        serviceId: service.id,
        customerId: customer.id,
        staffId: staff?.id ?? null,
        startAt: window.start,
        endAt: window.end,
        status: "CONFIRMED",
        source: "google-cal-import",
        channelType: "WEB",
        notes: `${GCAL_BOOKING_TAG}${ev.id}] ${ev.summary ?? "Calendar event"}`.slice(0, 500),
      });
      appointments.imported++;
    } catch {
      appointments.skipped++;
      appointments.errors.push(`Google event ${ev.id} failed`);
    }
  }

  return { appointments };
}
