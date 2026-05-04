import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { getTimezoneFromBusinessSettings } from "@/lib/businessSettings";
import { AppError } from "@/lib/errors";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { listOwnerSlotsForDay } from "@/services/availability/slotService";
import { getBusinessById } from "@/services/business/businessService";
import { assertUserCanAccessBusiness } from "@/services/business/membershipService";
import { getBookingById } from "@/services/booking/bookingService";
import { listStaffForBusiness } from "@/services/staff/staffService";

import { rescheduleBookingAction } from "./actions";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function todayYmdUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function RescheduleBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string; bookingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { businessId, bookingId } = await params;
  const sp = await searchParams;

  const userId = await requireOwnerUserId();
  await assertUserCanAccessBusiness({ userId, businessId, options: { emitAccessChecked: false } });

  let booking;
  try {
    booking = await getBookingById({ businessId, bookingId });
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  }

  const business = await getBusinessById({ businessId });
  if (!business) notFound();
  const tz = getTimezoneFromBusinessSettings(business.settings);

  const dateStr = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .catch(todayYmdUtc())
    .parse(firstParam(sp.date) ?? booking.startsAt.toISOString().slice(0, 10));

  const staff = await listStaffForBusiness({ businessId });
  const staffId = firstParam(sp.staffId) ?? booking.staff?.id ?? staff[0]?.id ?? "";

  const slots = staffId
    ? await listOwnerSlotsForDay({
        businessId,
        serviceId: booking.service.id,
        dateStr,
        staffId,
      })
    : [];

  return (
    <main className="min-h-0 flex-1">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`/b/${businessId}/bookings/${bookingId}`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          ← Booking
        </Link>
        <Link
          href={`/b/${businessId}/bookings`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Bookings
        </Link>
      </div>

      <h2 className="mt-4 text-lg font-semibold">Reschedule</h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Service stays the same. Date is interpreted in business timezone (<span className="font-mono">{tz}</span>).
        Slots and selected times are shown in UTC.
      </p>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm">
          <div className="font-medium">{booking.customer.displayName}</div>
          <div className="text-xs text-zinc-500">
            {booking.service.name} · current: {booking.startsAt.toISOString().slice(0, 16).replace("T", " ")} UTC
          </div>
        </div>

        <form method="get" className="mt-5 grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Date</span>
            <input
              type="date"
              name="date"
              defaultValue={dateStr}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Staff</span>
            <select
              name="staffId"
              defaultValue={staffId}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Load slots
            </button>
            <Link
              href={`/b/${businessId}/bookings/${bookingId}/reschedule`}
              className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Reset
            </Link>
          </div>
        </form>

        {staffId === "" ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">Create a staff member first.</p>
        ) : slots.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">No slots for this selection.</p>
        ) : (
          <form action={rescheduleBookingAction} className="mt-6">
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="serviceId" value={booking.service.id} />
            <input type="hidden" name="dateStr" value={dateStr} />

            <fieldset className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <legend className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Pick a slot
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {slots.map((s) => (
                  <label
                    key={`${s.staffId}:${s.startsAt}`}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                  >
                    <input
                      type="radio"
                      name="slotKey"
                      value={`${s.staffId}|${s.startsAt}|${s.endsAt}`}
                      required
                    />
                    <span className="font-mono">
                      {s.startsAt.slice(11, 16)}–{s.endsAt.slice(11, 16)}Z
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Reschedule booking
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </div>
    </main>
  );
}

