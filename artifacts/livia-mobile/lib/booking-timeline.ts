/**
 * Client-side booking timeline helpers.
 * Source of truth remains the API; these filters drive honest "next" / "ahead" UX.
 */

export type BookingLike = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
};

const ACTIONABLE = new Set(["PENDING", "CONFIRMED"]);

/** Next actionable booking that has not yet started (owner "next up"). */
export function pickNextUpBooking<T extends BookingLike>(
  bookings: T[] | undefined,
  nowMs: number,
): T | undefined {
  if (!bookings?.length) return undefined;
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  return sorted.find(
    (b) =>
      ACTIONABLE.has(b.status) && new Date(b.startAt).getTime() > nowMs,
  );
}

/** Bookings whose start time is still in the future (rest-of-schedule list). */
export function filterStartsAhead<T extends BookingLike>(
  bookings: T[] | undefined,
  nowMs: number,
): T[] {
  if (!bookings?.length) return [];
  return [...bookings]
    .filter((b) => new Date(b.startAt).getTime() > nowMs)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}
