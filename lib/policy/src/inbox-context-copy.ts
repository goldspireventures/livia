import { formatBookingStatusLabel } from "./booking-experience-copy";

/** Active statuses that count as a real "next" booking for operators. */
export function isUpcomingBookingStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.trim().toUpperCase();
  return s === "PENDING" || s === "CONFIRMED";
}

/** Inbox context rail — section title for a linked booking row. */
export function inboxContextBookingSectionTitle(status: string | null | undefined): string {
  if (!status) return "Booking";
  const s = status.trim().toUpperCase();
  if (s === "PENDING" || s === "CONFIRMED") return "Next booking";
  if (s === "COMPLETED") return "Past booking";
  if (s === "CANCELLED") return "Cancelled booking";
  if (s === "NO_SHOW") return "No-show";
  return "Linked booking";
}

/** One-line summary under the booking disclosure header. */
export function inboxContextBookingSummary(
  serviceName: string | null | undefined,
  startAt: string | null | undefined,
  status: string | null | undefined,
  formatWhen: (iso: string) => string,
): string {
  const name = serviceName?.trim() || "Appointment";
  if (!startAt) return "Nothing linked on this thread";
  const s = (status ?? "").trim().toUpperCase();
  if (s === "CANCELLED") return `${name} · Cancelled`;
  if (s === "NO_SHOW") return `${name} · No-show`;
  return `${name} · ${formatWhen(startAt)}`;
}

export function inboxContextBookingStatusLabel(status: string): string {
  return formatBookingStatusLabel(status);
}

/** Bookings list morph — operator-facing section label (no internal morph names). */
export function bookingsListScheduleTitle(): string {
  return "Schedule";
}

/** Operator inbox — strip regulatory SMS prefix from stored bodies (guest still sees full text). */
export function inboxOperatorMessageText(content: string | null | undefined): string {
  if (!content?.trim()) return content?.trim() ?? "";
  const stripped = content.replace(/^\(Liv, AI assistant for [^)]+?\) — /, "").trim();
  return stripped || content.trim();
}
