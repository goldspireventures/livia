import type { BookingStatus } from "@prisma/client";
import { addDays, subDays } from "date-fns";
import Link from "next/link";
import { z } from "zod";

import { listBookingsForBusiness } from "@/services/booking/bookingService";

const BOOKING_STATUSES = [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
] as const satisfies readonly BookingStatus[];

const StatusFilter = z.enum(BOOKING_STATUSES);

function utcStartOfCalendarDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function utcEndOfCalendarDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function toYmdUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayStartUtc(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

function dayEndUtc(ymd: string): Date {
  return new Date(`${ymd}T23:59:59.999Z`);
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseBookingsQuery(sp: Record<string, string | string[] | undefined>): {
  from: Date;
  to: Date;
  status?: BookingStatus;
  fromInput: string;
  toInput: string;
  statusInput: string;
  usingDefaults: boolean;
} {
  const todayUtc = utcStartOfCalendarDay(new Date());
  const defaultFrom = subDays(todayUtc, 7);
  const defaultTo = utcEndOfCalendarDay(addDays(todayUtc, 60));

  const fromStr = firstParam(sp.from);
  const toStr = firstParam(sp.to);
  const statusStr = firstParam(sp.status);

  const fromOk = Boolean(fromStr && /^\d{4}-\d{2}-\d{2}$/.test(fromStr));
  const toOk = Boolean(toStr && /^\d{4}-\d{2}-\d{2}$/.test(toStr));
  const statusOk = Boolean(statusStr && StatusFilter.safeParse(statusStr).success);
  const queryTouched = fromOk || toOk || statusOk;

  let from = defaultFrom;
  let to = defaultTo;

  if (fromOk && fromStr) {
    from = dayStartUtc(fromStr);
  }
  if (toOk && toStr) {
    to = dayEndUtc(toStr);
  }

  if (!(from < to)) {
    from = defaultFrom;
    to = defaultTo;
  }

  const statusParsed = statusStr ? StatusFilter.safeParse(statusStr) : null;
  const status = statusParsed?.success ? statusParsed.data : undefined;

  const usingDefaults = !queryTouched;

  return {
    from,
    to,
    status,
    fromInput: toYmdUtc(from),
    toInput: toYmdUtc(to),
    statusInput: status ?? "",
    usingDefaults,
  };
}

function formatUtcRange(startsAt: Date, endsAt: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  };
  return `${startsAt.toLocaleString("en-US", opts)} → ${endsAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  })}`;
}

export default async function BusinessBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { businessId } = await params;
  const sp = await searchParams;
  const q = parseBookingsQuery(sp);

  const bookings = await listBookingsForBusiness({
    businessId,
    from: q.from,
    to: q.to,
    status: q.status,
  });

  const base = `/b/${businessId}/bookings`;

  return (
    <main className="min-h-0 flex-1">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-base font-semibold">Bookings</h2>
        <Link
          href={`${base}/new`}
          className="text-sm font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
        >
          New booking →
        </Link>
        <p className="text-xs text-zinc-500">
          {q.usingDefaults
            ? "Default range: last 7 UTC days through end of day 60 days ahead"
            : "Filtered (UTC calendar dates)"}
          <span className="hidden sm:inline"> · </span>
          <span className="sm:ml-0">Times in UTC</span>
        </p>
      </div>

      <form
        method="get"
        className="mb-5 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
          <label htmlFor="bf-from" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            From (UTC date)
          </label>
          <input
            id="bf-from"
            type="date"
            name="from"
            defaultValue={q.fromInput}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
          <label htmlFor="bf-to" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            To (UTC date)
          </label>
          <input
            id="bf-to"
            type="date"
            name="to"
            defaultValue={q.toInput}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div className="flex min-w-[8rem] flex-col gap-1">
          <label htmlFor="bf-status" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Status
          </label>
          <select
            id="bf-status"
            name="status"
            defaultValue={q.statusInput}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          >
            <option value="">Any</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 sm:pb-0.5">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Apply
          </button>
          <Link
            href={base}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Reset
          </Link>
        </div>
      </form>

      {bookings.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No bookings in this range.</p>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/b/${businessId}/bookings/${b.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                    {b.status}
                  </span>
                  <span className="text-xs text-zinc-500">{formatUtcRange(b.startsAt, b.endsAt)}</span>
                </div>
                <div className="mt-2 font-medium text-zinc-900 dark:text-zinc-50">{b.service.name}</div>
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  {b.customer.displayName}
                  {b.staff ? ` · ${b.staff.displayName}` : ""}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
