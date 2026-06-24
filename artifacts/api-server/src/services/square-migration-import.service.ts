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

const SQUARE_API = "https://connect.squareup.com/v2";

type SquareListResponse<T> = {
  objects?: T[];
  team_members?: T[];
  bookings?: T[];
  customers?: T[];
  cursor?: string;
};

type SquareCatalogObject = {
  type?: string;
  id?: string;
  item_data?: {
    name?: string;
    variations?: Array<{
      id?: string;
      item_variation_data?: {
        name?: string;
        service_duration?: number;
        price_money?: { amount?: number };
      };
    }>;
  };
};

type SquareTeamMember = {
  id?: string;
  given_name?: string;
  family_name?: string;
  email_address?: string;
};

type SquareCustomer = {
  id?: string;
  given_name?: string;
  family_name?: string;
  email_address?: string;
  phone_number?: string;
};

type SquareBooking = {
  id?: string;
  start_at?: string;
  status?: string;
  customer_id?: string;
  appointment_segments?: Array<{
    duration_minutes?: number;
    team_member_id?: string;
    service_variation_id?: string;
    service_variation_version?: number;
  }>;
};

async function squareFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const res = await fetch(`${SQUARE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2024-10-17",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function squareListCatalog(accessToken: string): Promise<SquareCatalogObject[]> {
  const items: SquareCatalogObject[] = [];
  let cursor: string | undefined;
  do {
    const qs = new URLSearchParams({ types: "ITEM" });
    if (cursor) qs.set("cursor", cursor);
    const page = await squareFetch<SquareListResponse<SquareCatalogObject>>(
      accessToken,
      `/catalog/list?${qs.toString()}`,
    );
    if (!page?.objects) break;
    items.push(...page.objects);
    cursor = page.cursor;
  } while (cursor);
  return items;
}

export async function runSquareMigrationImport(
  businessId: string,
  accessToken: string,
): Promise<{
  clients: { imported: number; skipped: number; errors: string[] };
  services: { imported: number; skipped: number; errors: string[] };
  staff: { imported: number; skipped: number; errors: string[] };
  appointments: { imported: number; skipped: number; errors: string[] };
}> {
  const clients = { imported: 0, skipped: 0, errors: [] as string[] };
  const services = { imported: 0, skipped: 0, errors: [] as string[] };
  const staff = { imported: 0, skipped: 0, errors: [] as string[] };
  const appointments = { imported: 0, skipped: 0, errors: [] as string[] };

  const catalog = await squareListCatalog(accessToken);
  const variationNameById = new Map<string, { name: string; duration: number; priceMinor: number }>();

  for (const obj of catalog) {
    const itemName = obj.item_data?.name;
    for (const v of obj.item_data?.variations ?? []) {
      const vData = v.item_variation_data;
      const name = vData?.name && itemName ? `${itemName} — ${vData.name}` : itemName ?? vData?.name;
      if (!name || !v.id) continue;
      const durationMs = vData?.service_duration ?? 3_600_000;
      const durationMinutes = Math.max(1, Math.round(durationMs / 60_000));
      const priceMinor = vData?.price_money?.amount ?? 0;
      variationNameById.set(v.id, { name, duration: durationMinutes, priceMinor });
      try {
        await ensureService(businessId, { name, durationMinutes, priceMinor });
        services.imported++;
      } catch {
        services.skipped++;
      }
    }
  }

  const teamPage = await squareFetch<{ team_members?: SquareTeamMember[] }>(
    accessToken,
    "/team-members/search",
    { method: "POST", body: JSON.stringify({ query: { filter: { status: "ACTIVE" } } }) },
  );
  const teamMembers = teamPage?.team_members ?? [];
  const teamById = new Map<string, string>();
  for (const member of teamMembers) {
    const displayName = [member.given_name, member.family_name].filter(Boolean).join(" ").trim();
    if (!displayName || !member.id) continue;
    teamById.set(member.id, displayName);
    try {
      await ensureStaffMember(businessId, {
        displayName,
        firstName: member.given_name,
        lastName: member.family_name,
        email: member.email_address,
      });
      staff.imported++;
    } catch {
      staff.skipped++;
    }
  }

  const customerPage = await squareFetch<{ customers?: SquareCustomer[] }>(
    accessToken,
    "/customers",
  );
  const customerById = new Map<string, SquareCustomer>();
  for (const c of customerPage?.customers ?? []) {
    if (!c.id) continue;
    customerById.set(c.id, c);
    try {
      await ensureCustomer(businessId, {
        firstName: c.given_name ?? "Guest",
        lastName: c.family_name,
        email: c.email_address,
        phone: c.phone_number,
      });
      clients.imported++;
    } catch {
      clients.skipped++;
    }
  }

  const biz = await getBusinessById(businessId);
  const locationId =
    (biz as { squareLocationId?: string | null })?.squareLocationId ??
    process.env.SQUARE_DEFAULT_LOCATION_ID ??
    null;

  const now = new Date();
  const startMin = now.toISOString();
  const startMax = new Date(now.getTime() + 90 * 24 * 60 * 60_000).toISOString();

  const bookingBody: Record<string, unknown> = {
    query: {
      filter: {
        start_at_range: { start_at: startMin, end_at: startMax },
      },
    },
  };
  if (locationId) {
    (bookingBody.query as { filter: Record<string, unknown> }).filter.location_id = locationId;
  }

  const bookingPage = await squareFetch<{ bookings?: SquareBooking[] }>(
    accessToken,
    "/bookings/search",
    { method: "POST", body: JSON.stringify(bookingBody) },
  );

  for (const booking of bookingPage?.bookings ?? []) {
    if (booking.status === "CANCELLED") {
      appointments.skipped++;
      continue;
    }
    const startAt = parseIsoDate(booking.start_at);
    if (!startAt || !booking.id) {
      appointments.skipped++;
      continue;
    }
    const segment = booking.appointment_segments?.[0];
    const durationMinutes = segment?.duration_minutes ?? 60;
    const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);

    const sqCustomer = booking.customer_id ? customerById.get(booking.customer_id) : undefined;
    const customerName = splitPersonName(
      sqCustomer ? [sqCustomer.given_name, sqCustomer.family_name].filter(Boolean).join(" ") : undefined,
    );

    const variation = segment?.service_variation_id
      ? variationNameById.get(segment.service_variation_id)
      : undefined;
    const serviceName = variation?.name ?? "Imported Square booking";

    try {
      const customer = await ensureCustomer(businessId, {
        firstName: sqCustomer?.given_name ?? customerName.firstName,
        lastName: sqCustomer?.family_name ?? customerName.lastName,
        email: sqCustomer?.email_address,
        phone: sqCustomer?.phone_number,
      });
      const service = await ensureService(businessId, {
        name: serviceName,
        durationMinutes: variation?.duration ?? durationMinutes,
        priceMinor: variation?.priceMinor ?? 0,
      });
      const staffName = segment?.team_member_id ? teamById.get(segment.team_member_id) : undefined;
      const staffMember = staffName ? await findStaffByName(businessId, staffName) : null;

      await db.insert(bookingsTable).values({
        id: generateId(),
        businessId,
        serviceId: service.id,
        customerId: customer.id,
        staffId: staffMember?.id ?? null,
        startAt,
        endAt,
        status: "CONFIRMED",
        source: "web",
        channelType: "WEB",
        notes: `Imported from Square (#${booking.id})`,
      });
      appointments.imported++;
    } catch {
      appointments.skipped++;
      appointments.errors.push(`Square booking ${booking.id} failed`);
    }
  }

  return { clients, services, staff, appointments };
}
