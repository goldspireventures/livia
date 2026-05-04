import Link from "next/link";
import { notFound } from "next/navigation";

import { AppError } from "@/lib/errors";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { getBusinessById } from "@/services/business/businessService";
import { getBookingById } from "@/services/booking/bookingService";
import { assertUserCanAccessBusiness } from "@/services/business/membershipService";
import { listInAppNotificationsForUserInBusiness } from "@/services/notifications/inAppNotificationService";
import { listNotificationLogsForBooking } from "@/services/notifications/notificationLogService";

import { BookingStatusForm } from "./BookingStatusForm";

function formatUtc(dt: Date) {
  return dt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ businessId: string; bookingId: string }>;
}) {
  const { businessId, bookingId } = await params;

  const userId = await requireOwnerUserId();
  await assertUserCanAccessBusiness({ userId, businessId, options: { emitAccessChecked: false } });

  let booking;
  try {
    booking = await getBookingById({ businessId, bookingId });
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") {
      notFound();
    }
    throw e;
  }

  const business = await getBusinessById({ businessId });
  const [recentAlerts, outboundAttempts] = await Promise.all([
    listInAppNotificationsForUserInBusiness({ userId, businessId, limit: 8 }),
    listNotificationLogsForBooking({ businessId, bookingId, limit: 12 }),
  ]);

  return (
    <main className="min-h-0 flex-1">
      <Link
        href={`/b/${businessId}/bookings`}
        className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← Bookings
      </Link>
      <Link
        href={`/b/${businessId}/bookings/${bookingId}/reschedule`}
        className="ml-4 text-sm font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
      >
        Reschedule →
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Booking</h2>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
            {booking.status}
          </span>
        </div>
        <BookingStatusForm businessId={businessId} bookingId={bookingId} currentStatus={booking.status} />
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Service</dt>
            <dd className="mt-0.5 font-medium">{booking.service.name}</dd>
            <dd className="text-xs text-zinc-500">{booking.service.durationMinutes} min</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Customer</dt>
            <dd className="mt-0.5">{booking.customer.displayName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Staff</dt>
            <dd className="mt-0.5">{booking.staff?.displayName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Start</dt>
            <dd className="mt-0.5">{formatUtc(booking.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">End</dt>
            <dd className="mt-0.5">{formatUtc(booking.endsAt)}</dd>
          </div>
          {booking.notes ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{booking.notes}</dd>
            </div>
          ) : null}
          {booking.internalNotes ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Internal notes</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {booking.internalNotes}
              </dd>
            </div>
          ) : null}
        </dl>
        {business ? (
          <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Link
              href={`/book/${business.slug}`}
              className="text-sm font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
            >
              Open public book page
            </Link>
          </div>
        ) : null}
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">Alerts</h3>
              <Link
                href={`/b/${businessId}/notifications`}
                className="text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
              >
                View all →
              </Link>
            </div>
            {recentAlerts.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">No alerts yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs">
                {recentAlerts.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{n.title}</span>
                      {n.readAt ? null : (
                        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-zinc-600 dark:text-zinc-400">{n.body}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold">Outbound attempts</h3>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Delivery audit for this booking (push/email). SKIPPED usually means not configured or no subscription.
            </p>
            {outboundAttempts.length === 0 ? (
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                No outbound attempts logged for this booking yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs">
                {outboundAttempts.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{row.templateKey}</span>
                      <span className="text-[10px] font-semibold uppercase text-zinc-500">{row.status}</span>
                    </div>
                    <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                      {row.channel}
                      {row.target ? ` · ${row.target}` : ""} ·{" "}
                      {row.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                    </div>
                    {row.lastError ? (
                      <div className="mt-1 break-words font-mono text-[11px] text-red-700 dark:text-red-300">
                        {row.lastError}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
