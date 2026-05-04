import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppError } from "@/lib/errors";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";
import { listServicesForBusiness } from "@/services/catalog/serviceCatalogService";
import { listServicesForStaff } from "@/services/catalog/staffServiceAssignmentService";
import { getStaffById } from "@/services/staff/staffService";

import { assignServiceAction, unassignServiceAction } from "./actions";

export default async function StaffServicesPage({
  params,
}: {
  params: Promise<{ businessId: string; staffId: string }>;
}) {
  const { businessId, staffId } = await params;
  const userId = await requireOwnerUserId();
  const role = await getMembershipRoleForUser({ userId, businessId });
  if (role !== "OWNER" && role !== "ADMIN") {
    redirect(`/b/${businessId}/staff`);
  }

  let staff;
  try {
    staff = await getStaffById({ businessId, staffId });
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") {
      notFound();
    }
    throw e;
  }

  const [allServices, assigned] = await Promise.all([
    listServicesForBusiness({ businessId, includeInactive: true }),
    listServicesForStaff({ businessId, staffId }),
  ]);
  const assignedIds = new Set(assigned.map((a) => a.serviceId));

  return (
    <main className="min-h-0 flex-1">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`/b/${businessId}/staff`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          ← Staff
        </Link>
        <Link
          href={`/b/${businessId}/staff/${staffId}/edit`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Edit profile
        </Link>
        <Link
          href={`/b/${businessId}/staff/${staffId}/availability`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Schedule
        </Link>
      </div>
      <h2 className="mt-4 text-lg font-semibold">{staff.displayName}</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Services this staff member can be booked for. Public booking only offers times when they are assigned to the selected service.
      </p>

      {allServices.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">No services in this business yet.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {allServices.map((svc) => {
            const on = assignedIds.has(svc.id);
            return (
              <li
                key={svc.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium">{svc.name}</span>
                  {!svc.active ? (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      Inactive
                    </span>
                  ) : null}
                  <span className="ml-2 text-xs text-zinc-500">{svc.durationMinutes} min</span>
                </div>
                {on ? (
                  <form action={unassignServiceAction} className="shrink-0">
                    <input type="hidden" name="businessId" value={businessId} />
                    <input type="hidden" name="staffId" value={staffId} />
                    <input type="hidden" name="serviceId" value={svc.id} />
                    <button type="submit" className="text-xs font-medium text-red-700 underline dark:text-red-400">
                      Remove
                    </button>
                  </form>
                ) : (
                  <form action={assignServiceAction} className="shrink-0">
                    <input type="hidden" name="businessId" value={businessId} />
                    <input type="hidden" name="staffId" value={staffId} />
                    <input type="hidden" name="serviceId" value={svc.id} />
                    <button type="submit" className="text-xs font-medium text-zinc-700 underline dark:text-zinc-300">
                      Assign
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
