import Link from "next/link";
import { z } from "zod";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { assertUserCanAccessBusiness } from "@/services/business/membershipService";
import { listOwnerSlotsForDay } from "@/services/availability/slotService";
import { listServicesForBusiness } from "@/services/catalog/serviceCatalogService";
import { listCustomersForBusiness } from "@/services/customer/customerService";
import { listStaffForBusiness } from "@/services/staff/staffService";

import { createOwnerBookingAction } from "./actions";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

const ViewSchema = z.enum(["staff", "service"]);

function todayYmdUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { businessId } = await params;
  const sp = await searchParams;
  const userId = await requireOwnerUserId();
  await assertUserCanAccessBusiness({ userId, businessId, options: { emitAccessChecked: false } });

  const [customers, services, staff] = await Promise.all([
    listCustomersForBusiness({ businessId }),
    listServicesForBusiness({ businessId }),
    listStaffForBusiness({ businessId }),
  ]);

  const view = ViewSchema.safeParse(firstParam(sp.view) ?? "staff").success
    ? ViewSchema.parse(firstParam(sp.view) ?? "staff")
    : "staff";
  const dateStr = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .catch(todayYmdUtc())
    .parse(firstParam(sp.date) ?? todayYmdUtc());
  const serviceIdDefault = firstParam(sp.serviceId) ?? (services[0]?.id ?? "");
  const staffIdDefault = firstParam(sp.staffId) ?? (staff[0]?.id ?? "");

  const canQuery = Boolean(serviceIdDefault) && (view === "service" || Boolean(staffIdDefault));
  const slots = canQuery
    ? await listOwnerSlotsForDay({
        businessId,
        serviceId: serviceIdDefault,
        dateStr,
        staffId: view === "staff" ? staffIdDefault : null,
      })
    : [];

  return (
    <main className="min-h-0 flex-1">
      <div className="text-sm">
        <Link
          href={`/b/${businessId}/bookings`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          ← Bookings
        </Link>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">New booking</h2>
          <p className="text-xs text-zinc-500">Pick a slot; booking is created confirmed.</p>
        </div>

        {customers.length === 0 || services.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            You need at least one customer and one service to create a booking.
          </p>
        ) : (
          <>
            <form
              method="get"
              className="mt-5 grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2"
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Customer</span>
                <select
                  name="customerId"
                  defaultValue={firstParam(sp.customerId) ?? customers[0]?.id}
                  required
                  className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">View</span>
                <select
                  name="view"
                  defaultValue={view}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                >
                  <option value="staff">Per staff (default)</option>
                  <option value="service">Per service</option>
                </select>
              </label>

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
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Service</span>
                <select
                  name="serviceId"
                  defaultValue={serviceIdDefault}
                  required
                  className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes}m)
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Staff <span className="font-normal text-zinc-500">(used in per-staff view)</span>
                </span>
                <select
                  name="staffId"
                  defaultValue={staffIdDefault}
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
                  href={`/b/${businessId}/bookings/new`}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  Reset
                </Link>
              </div>
            </form>

            {!canQuery ? (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
                Pick a service (and staff in per-staff view) to load slots.
              </p>
            ) : slots.length === 0 ? (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">No slots for this selection.</p>
            ) : (
              <form action={createOwnerBookingAction} className="mt-6">
                <input type="hidden" name="businessId" value={businessId} />
                <input
                  type="hidden"
                  name="customerId"
                  value={firstParam(sp.customerId) ?? customers[0]!.id}
                />
                <input type="hidden" name="serviceId" value={serviceIdDefault} />

                <fieldset className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <legend className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Pick a slot (times shown in UTC)
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
                          value={`${s.staffId}|${s.startsAt}`}
                          required
                        />
                        <span className="font-mono">
                          {s.startsAt.slice(11, 16)}–{s.endsAt.slice(11, 16)}Z
                        </span>
                        <span className="text-zinc-500">· {s.staffId.slice(0, 6)}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4">
                    <button
                      type="submit"
                      className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Create booking (confirmed)
                    </button>
                  </div>
                </fieldset>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}

