/**
 * Owner pending-booking queue — single href + action semantics for web surfaces.
 *
 * Business flow:
 * 1. Guest requests a slot → booking is PENDING until the owner acts.
 * 2. Confirm → CONFIRMED (guest can be notified per channel settings).
 * 3. Reschedule → pick a new slot (stays PENDING or CONFIRMED); guest should be told out-of-band if needed.
 * 4. Decline → CANCELLED; slot freed.
 */

export const PENDING_BOOKINGS_LIST_HREF = "/bookings?status=PENDING";

export type PendingBookingActionId = "confirm" | "reschedule" | "decline";

export const PENDING_BOOKING_ACTION_LABELS: Record<PendingBookingActionId, string> = {
  confirm: "Confirm",
  reschedule: "Reschedule",
  decline: "Decline",
};
