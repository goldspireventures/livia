import Link from "next/link";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { listStaffForBusiness } from "@/services/staff/staffService";

export default async function BusinessAvailabilityHubPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  await requireOwnerUserId();
  const staff = await listStaffForBusiness({ businessId, includeInactive: true });

  return (
    <main className="min-h-0 flex-1">
      <h2 className="text-base font-semibold">Schedule & availability</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Pick a staff member to manage weekly hours and time off, or preview slots.
      </p>
      <div className="mt-3 text-sm">
        <Link
          href={`/b/${businessId}/availability/slots`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          View bookable slots →
        </Link>
      </div>
      {staff.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No staff yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {staff.map((s) => (
            <li key={s.id}>
              <Link
                href={`/b/${businessId}/staff/${s.id}/availability`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <span className="font-medium">{s.displayName}</span>
                <span className="text-xs text-zinc-500">{s.active ? "Active" : "Inactive"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
