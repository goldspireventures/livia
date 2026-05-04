import Link from "next/link";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";
import { listServicesForBusiness } from "@/services/catalog/serviceCatalogService";

export default async function BusinessServicesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const userId = await requireOwnerUserId();
  const role = await getMembershipRoleForUser({ userId, businessId });
  const canManageCatalog = role === "OWNER" || role === "ADMIN";

  const services = await listServicesForBusiness({ businessId, includeInactive: true });

  return (
    <main className="min-h-0 flex-1">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Services</h2>
          <p className="mt-1 text-xs text-zinc-500">Catalog · includes inactive</p>
        </div>
        {canManageCatalog ? (
          <Link
            href={`/b/${businessId}/services/new`}
            className="inline-flex w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add service
          </Link>
        ) : null}
      </div>
      {services.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No services yet.</p>
      ) : (
        <ul className="space-y-2">
          {services.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{s.name}</div>
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
                {canManageCatalog ? (
                  <Link
                    href={`/b/${businessId}/services/${s.id}/edit`}
                    className="shrink-0 text-xs font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
                  >
                    Edit
                  </Link>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {s.durationMinutes} min
                {s.basePriceMinorUnits != null && s.currency
                  ? ` · ${(s.basePriceMinorUnits / 100).toFixed(2)} ${s.currency}`
                  : null}
              </div>
              {s.description ? (
                <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{s.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {canManageCatalog ? null : (
        <p className="mt-6 text-xs text-zinc-500">Only owners and admins can add or edit services.</p>
      )}
    </main>
  );
}
