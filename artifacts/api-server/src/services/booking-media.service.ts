import { and, eq, desc } from "drizzle-orm";
import { db, mediaAssetsTable, bookingsTable } from "@workspace/db";
import { generateId } from "../lib/id";
import { logEvent } from "./events.service";

export async function listBookingMedia(businessId: string, bookingId: string) {
  return db
    .select()
    .from(mediaAssetsTable)
    .where(
      and(
        eq(mediaAssetsTable.businessId, businessId),
        eq(mediaAssetsTable.entityType, "booking"),
        eq(mediaAssetsTable.entityId, bookingId),
      ),
    )
    .orderBy(desc(mediaAssetsTable.createdAt));
}

export async function attachBookingMedia(
  businessId: string,
  bookingId: string,
  input: { url: string; mimeType?: string; kind?: string },
) {
  const [booking] = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)));
  if (!booking) return null;

  const id = generateId();
  const [row] = await db
    .insert(mediaAssetsTable)
    .values({
      id,
      businessId,
      kind: input.kind ?? "image",
      url: input.url,
      mimeType: input.mimeType ?? null,
      entityType: "booking",
      entityId: bookingId,
    })
    .returning();

  await logEvent({
    type: "BOOKING_MEDIA_ATTACHED",
    businessId,
    entityType: "booking",
    entityId: bookingId,
    context: { mediaId: id, url: input.url },
  });

  return row;
}

export function extractTwilioMediaUrls(params: Record<string, string>): string[] {
  const n = parseInt(params["NumMedia"] ?? "0", 10);
  if (!n || Number.isNaN(n)) return [];
  const urls: string[] = [];
  for (let i = 0; i < n; i++) {
    const u = params[`MediaUrl${i}`];
    if (u) urls.push(u);
  }
  return urls;
}
