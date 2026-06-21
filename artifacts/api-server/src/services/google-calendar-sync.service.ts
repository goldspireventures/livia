import { and, eq, gte, lte, like, inArray } from "drizzle-orm";
import {
  db,
  bookingsTable,
  businessesTable,
  customersTable,
  servicesTable,
  staffTable,
  tenantIntegrationConnectionsTable,
  timeOffTable,
} from "@workspace/db";
import { OAUTH_BROKER_CONFIGS, upsertTenantIntegrationConnection } from "./integration-oauth.service";
import { createTimeOff } from "./availability.service";

const BROKER_ID = "calendar_google";
const GCAL_TAG = "[gcal:";
const GCAL_PUSH_TAG = "gcal-event:";

type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt?: Date;
} | null> {
  const cfg = OAUTH_BROKER_CONFIGS[BROKER_ID];
  const clientId = process.env[cfg.clientIdEnv];
  const clientSecret = process.env[cfg.clientSecretEnv];
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  return {
    accessToken: json.access_token,
    expiresAt:
      typeof json.expires_in === "number"
        ? new Date(Date.now() + json.expires_in * 1000)
        : undefined,
  };
}

export async function getGoogleCalendarAccessToken(businessId: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(tenantIntegrationConnectionsTable)
    .where(
      and(
        eq(tenantIntegrationConnectionsTable.businessId, businessId),
        eq(tenantIntegrationConnectionsTable.brokerId, BROKER_ID),
      ),
    )
    .limit(1);
  if (!row?.accessToken) return null;

  if (row.expiresAt && row.expiresAt.getTime() < Date.now() + 60_000 && row.refreshToken) {
    const refreshed = await refreshAccessToken(row.refreshToken);
    if (refreshed) {
      await upsertTenantIntegrationConnection({
        businessId,
        brokerId: BROKER_ID,
        accessToken: refreshed.accessToken,
        refreshToken: row.refreshToken,
        expiresAt: refreshed.expiresAt,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
      });
      return refreshed.accessToken;
    }
  }
  return row.accessToken;
}

function gcalReason(eventId: string, summary: string): string {
  return `${GCAL_TAG}${eventId}] ${summary}`.slice(0, 500);
}

function parseEventTimes(ev: GoogleEvent): { start: Date; end: Date } | null {
  const startRaw = ev.start?.dateTime ?? (ev.start?.date ? `${ev.start.date}T00:00:00Z` : null);
  const endRaw = ev.end?.dateTime ?? (ev.end?.date ? `${ev.end.date}T23:59:59Z` : null);
  if (!startRaw || !endRaw) return null;
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  return { start, end };
}

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

async function resolveDefaultStaffId(businessId: string): Promise<string | null> {
  const rows = await db
    .select({ id: staffTable.id })
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)))
    .limit(2);
  return rows.length === 1 ? rows[0]!.id : null;
}

export async function syncGoogleCalendarInbound(businessId: string): Promise<number> {
  const token = await getGoogleCalendarAccessToken(businessId);
  if (!token) return 0;

  const now = new Date();
  const horizon = new Date(now.getTime() + 21 * 24 * 60 * 60_000);
  const events = await fetchGoogleEvents(token, now, horizon);
  const active = events.filter((e) => e.id && e.status !== "cancelled");
  const staffId = await resolveDefaultStaffId(businessId);

  const existing = await db
    .select({ id: timeOffTable.id, reason: timeOffTable.reason })
    .from(timeOffTable)
    .where(and(eq(timeOffTable.businessId, businessId), like(timeOffTable.reason, `${GCAL_TAG}%`)));

  const activeIds = new Set(active.map((e) => e.id));
  for (const row of existing) {
    const match = row.reason?.match(/\[gcal:([^\]]+)\]/);
    const eventId = match?.[1];
    if (eventId && !activeIds.has(eventId)) {
      await db.delete(timeOffTable).where(eq(timeOffTable.id, row.id));
    }
  }

  const existingIds = new Set(
    existing
      .map((r) => r.reason?.match(/\[gcal:([^\]]+)\]/)?.[1])
      .filter(Boolean) as string[],
  );

  let imported = 0;
  for (const ev of active) {
    if (existingIds.has(ev.id)) continue;
    const window = parseEventTimes(ev);
    if (!window) continue;
    await createTimeOff(businessId, {
      staffId: staffId ?? undefined,
      startsAt: window.start.toISOString(),
      endsAt: window.end.toISOString(),
      reason: gcalReason(ev.id, ev.summary ?? "External calendar"),
    });
    imported++;
  }
  return imported;
}

async function createGoogleEvent(
  accessToken: string,
  args: { summary: string; description: string; start: Date; end: Date; timezone: string },
): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: args.summary,
      description: args.description,
      start: { dateTime: args.start.toISOString(), timeZone: args.timezone },
      end: { dateTime: args.end.toISOString(), timeZone: args.timezone },
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { id?: string };
  return json.id ?? null;
}

export async function syncGoogleCalendarOutbound(businessId: string): Promise<number> {
  const token = await getGoogleCalendarAccessToken(businessId);
  if (!token) return 0;

  const [biz] = await db
    .select({ timezone: businessesTable.timezone, name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  const tz = biz?.timezone ?? "Europe/Dublin";

  const now = new Date();
  const horizon = new Date(now.getTime() + 21 * 24 * 60 * 60_000);

  const rows = await db
    .select({
      id: bookingsTable.id,
      startAt: bookingsTable.startAt,
      endAt: bookingsTable.endAt,
      notes: bookingsTable.notes,
      status: bookingsTable.status,
      serviceName: servicesTable.name,
      customerFirst: customersTable.firstName,
      customerLast: customersTable.lastName,
    })
    .from(bookingsTable)
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, now),
        lte(bookingsTable.startAt, horizon),
        inArray(bookingsTable.status, ["CONFIRMED", "PENDING"]),
      ),
    );

  let pushed = 0;
  for (const row of rows) {
    if (row.notes?.includes(GCAL_PUSH_TAG)) continue;
    const customer = [row.customerFirst, row.customerLast].filter(Boolean).join(" ").trim() || "Guest";
    const eventId = await createGoogleEvent(token, {
      summary: `${row.serviceName} · ${customer}`,
      description: `Booked via Livia for ${biz?.name ?? "your shop"}.`,
      start: row.startAt,
      end: row.endAt,
      timezone: tz,
    });
    if (!eventId) continue;
    await db
      .update(bookingsTable)
      .set({
        notes: `${row.notes ?? ""} ${GCAL_PUSH_TAG}${eventId}`.trim(),
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, row.id));
    pushed++;
  }
  return pushed;
}

export async function runGoogleCalendarSync(businessId: string): Promise<{
  ok: boolean;
  message: string;
  importedBusy: number;
  pushedBookings: number;
  lastSyncAt: string;
}> {
  const token = await getGoogleCalendarAccessToken(businessId);
  if (!token) {
    return {
      ok: false,
      message: "Connect Google Calendar in Integrations first.",
      importedBusy: 0,
      pushedBookings: 0,
      lastSyncAt: new Date().toISOString(),
    };
  }

  const importedBusy = await syncGoogleCalendarInbound(businessId);
  const pushedBookings = await syncGoogleCalendarOutbound(businessId);
  const lastSyncAt = new Date().toISOString();

  const [conn] = await db
    .select({ id: tenantIntegrationConnectionsTable.id, metadata: tenantIntegrationConnectionsTable.metadata })
    .from(tenantIntegrationConnectionsTable)
    .where(
      and(
        eq(tenantIntegrationConnectionsTable.businessId, businessId),
        eq(tenantIntegrationConnectionsTable.brokerId, BROKER_ID),
      ),
    )
    .limit(1);
  if (conn) {
    await db
      .update(tenantIntegrationConnectionsTable)
      .set({
        metadata: {
          ...((conn.metadata as Record<string, unknown>) ?? {}),
          lastSyncAt,
          lastImportedBusy: importedBusy,
          lastPushedBookings: pushedBookings,
        },
        updatedAt: new Date(),
      })
      .where(eq(tenantIntegrationConnectionsTable.id, conn.id));
  }

  return {
    ok: true,
    message: `Calendar synced — ${importedBusy} external block(s), ${pushedBookings} booking(s) pushed.`,
    importedBusy,
    pushedBookings,
    lastSyncAt,
  };
}

export async function getGoogleCalendarSyncStatus(businessId: string): Promise<{
  connected: boolean;
  lastSyncAt: string | null;
  lastImportedBusy: number;
  lastPushedBookings: number;
  note: string;
}> {
  const [row] = await db
    .select({
      metadata: tenantIntegrationConnectionsTable.metadata,
      connectedAt: tenantIntegrationConnectionsTable.connectedAt,
    })
    .from(tenantIntegrationConnectionsTable)
    .where(
      and(
        eq(tenantIntegrationConnectionsTable.businessId, businessId),
        eq(tenantIntegrationConnectionsTable.brokerId, BROKER_ID),
      ),
    )
    .limit(1);

  if (!row) {
    return {
      connected: false,
      lastSyncAt: null,
      lastImportedBusy: 0,
      lastPushedBookings: 0,
      note: "Connect once — Liv keeps your calendar and Livia bookings aligned in the background.",
    };
  }

  const meta = (row.metadata as Record<string, unknown>) ?? {};
  return {
    connected: true,
    lastSyncAt: typeof meta.lastSyncAt === "string" ? meta.lastSyncAt : row.connectedAt.toISOString(),
    lastImportedBusy: typeof meta.lastImportedBusy === "number" ? meta.lastImportedBusy : 0,
    lastPushedBookings: typeof meta.lastPushedBookings === "number" ? meta.lastPushedBookings : 0,
    note: "Liv syncs external busy time and pushes confirmed bookings — no double-booking noise in your day view.",
  };
}

export async function pushBookingToGoogleCalendar(businessId: string, bookingId: string): Promise<void> {
  const token = await getGoogleCalendarAccessToken(businessId);
  if (!token) return;

  const [row] = await db
    .select({
      id: bookingsTable.id,
      startAt: bookingsTable.startAt,
      endAt: bookingsTable.endAt,
      notes: bookingsTable.notes,
      status: bookingsTable.status,
      serviceName: servicesTable.name,
      customerFirst: customersTable.firstName,
      customerLast: customersTable.lastName,
    })
    .from(bookingsTable)
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)))
    .limit(1);

  if (!row || row.notes?.includes(GCAL_PUSH_TAG)) return;
  if (row.status !== "CONFIRMED" && row.status !== "PENDING") return;

  const [biz] = await db
    .select({ timezone: businessesTable.timezone, name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  const customer = [row.customerFirst, row.customerLast].filter(Boolean).join(" ").trim() || "Guest";
  const eventId = await createGoogleEvent(token, {
    summary: `${row.serviceName} · ${customer}`,
    description: `Booked via Livia for ${biz?.name ?? "your shop"}.`,
    start: row.startAt,
    end: row.endAt,
    timezone: biz?.timezone ?? "Europe/Dublin",
  });
  if (!eventId) return;

  await db
    .update(bookingsTable)
    .set({
      notes: `${row.notes ?? ""} ${GCAL_PUSH_TAG}${eventId}`.trim(),
      updatedAt: new Date(),
    })
    .where(eq(bookingsTable.id, bookingId));
}

export async function detectCalendarConflicts(businessId: string): Promise<
  Array<{ severity: "warning" | "info"; message: string }>
> {
  const status = await getGoogleCalendarSyncStatus(businessId);
  if (!status.connected) {
    return [
      {
        severity: "info",
        message: "Google Calendar not connected — personal calendar may disagree with Livia slots.",
      },
    ];
  }
  if (!status.lastSyncAt) {
    return [{ severity: "info", message: "Calendar connected — run sync to import external busy time." }];
  }
  return [];
}
