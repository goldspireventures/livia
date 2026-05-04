import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { getTimezoneFromBusinessSettings } from "@/lib/businessSettings";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { getBusinessById } from "@/services/business/businessService";
import { assertUserCanAccessBusiness } from "@/services/business/membershipService";
import { listOwnerSlotsForDay } from "@/services/availability/slotService";
import { listServicesForBusiness } from "@/services/catalog/serviceCatalogService";
import { listStaffForBusiness } from "@/services/staff/staffService";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

const ViewSchema = z.enum(["staff", "service"]);

function todayYmdUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AvailabilitySlotsPage({
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

  const business = await getBusinessById({ businessId });
  if (!business) notFound();
  const businessTz = getTimezoneFromBusinessSettings(business.settings);

  const view = ViewSchema.safeParse(firstParam(sp.view) ?? "staff").success
    ? ViewSchema.parse(firstParam(sp.view) ?? "staff")
    : "staff";
  const dateStr = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .catch(todayYmdUtc())
    .parse(firstParam(sp.date) ?? todayYmdUtc());

  const [services, staff] = await Promise.all([
    listServicesForBusiness({ businessId }),
    listStaffForBusiness({ businessId }),
  ]);

  const serviceId = firstParam(sp.serviceId) ?? (services[0]?.id ?? "");
  const staffId = firstParam(sp.staffId) ?? (staff[0]?.id ?? "");

  const canQuery = Boolean(serviceId) && (view === "service" || Boolean(staffId));

  const slots = canQuery
    ? await listOwnerSlotsForDay({
        businessId,
        serviceId,
        dateStr,
        staffId: view === "staff" ? staffId : null,
      })
    : [];

  const staffById = new Map(staff.map((s) => [s.id, s.displayName] as const));

  const grouped =
    view === "service"
      ? slots.reduce((acc, s) => {
          const key = s.staffId;
          const cur = acc.get(key) ?? [];
          cur.push(s);
          acc.set(key, cur);
          return acc;
        }, new Map<string, typeof slots>())
      : new Map<string, typeof slots>(staffId ? [[staffId, slots]] : []);

  return (
    <main className="min-h-0 flex-1">
      <div className="text-sm">
        <Link
          href={`/b/${businessId}/availability`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          ← Schedule hub
        </Link>
      </div>

      <h2 className="mt-4 text-lg font-semibold">Slots · {business.name}</h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Per-staff is the default. Per-service shows all assigned staff. Date is interpreted in the business timezone (
        <span className="font-mono">{businessTz}</span>) but times are displayed in UTC for now.
      </p>

      <form method="get" className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">View</span>
            <select
              name="view"
              defaultValue={view}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
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
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Service</span>
            <select
              name="serviceId"
              defaultValue={serviceId}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            >
              {services.length === 0 ? <option value="">No services</option> : null}
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes}m)
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Staff <span className="font-normal text-zinc-500">(per-staff)</span>
            </span>
            <select
              name="staffId"
              defaultValue={staffId}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            >
              {staff.length === 0 ? <option value="">No staff</option> : null}
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Show slots
          </button>
          <Link
            href={`/b/${businessId}/availability/slots`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Reset
          </Link>
        </div>
      </form>

      {!canQuery ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Add at least one service and staff member, then pick a service (and staff in per-staff view).
        </p>
      ) : slots.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">No slots for this selection.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {[...grouped.entries()].map(([sid, list]) => (
            <section key={sid} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold">{staffById.get(sid) ?? sid}</h3>
                <span className="text-xs text-zinc-500">{list.length} slot(s)</span>
              </div>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {list.map((s) => (
                  <li
                    key={`${s.staffId}:${s.startsAt}`}
                    className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <span className="font-mono">{s.startsAt.slice(11, 16)}–{s.endsAt.slice(11, 16)}Z</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

