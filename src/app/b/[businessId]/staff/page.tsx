import Link from "next/link";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";
import { listStaffForBusiness } from "@/services/staff/staffService";

export default async function BusinessStaffPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const userId = await requireOwnerUserId();
  const role = await getMembershipRoleForUser({ userId, businessId });
  const canManageStaff = role === "OWNER" || role === "ADMIN";

  const staff = await listStaffForBusiness({ businessId, includeInactive: true });

  return (
    <main className="min-h-0 flex-1">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Staff</h2>
          <p className="mt-1 text-xs text-zinc-500">Team · includes inactive</p>
        </div>
        {canManageStaff ? (
          <Link
            href={`/b/${businessId}/staff/new`}
            className="inline-flex w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add staff
          </Link>
        ) : null}
      </div>
      {staff.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No staff yet.</p>
      ) : (
        <ul className="space-y-2">
          {staff.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{s.displayName}</div>
                  <div className="mt-1">
                    {!s.active ? (
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                        Inactive
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-xs font-medium">
                  <Link
                    href={`/b/${businessId}/staff/${s.id}/availability`}
                    className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                  >
                    Schedule
                  </Link>
                  <Link
                    href={`/b/${businessId}/staff/${s.id}/services`}
                    className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                  >
                    Services
                  </Link>
                  {canManageStaff ? (
                    <Link
                      href={`/b/${businessId}/staff/${s.id}/edit`}
                      className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
                    >
                      Edit
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {s.role}
                {s.email ? ` · ${s.email}` : null}
                {s.phone ? ` · ${s.phone}` : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-zinc-500">
        <Link href={`/b/${businessId}/availability`} className="font-medium underline-offset-2 hover:underline">
          Open schedule hub
        </Link>{" "}
        for availability and time off.
      </p>
    </main>
  );
}
