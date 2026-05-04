import Link from "next/link";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";
import { listCustomersForBusiness } from "@/services/customer/customerService";

export default async function BusinessCustomersPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const userId = await requireOwnerUserId();
  const role = await getMembershipRoleForUser({ userId, businessId });
  const canManageCustomers = role === "OWNER" || role === "ADMIN";

  const customers = await listCustomersForBusiness({ businessId });

  return (
    <main className="min-h-0 flex-1">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Customers</h2>
          <p className="mt-1 text-xs text-zinc-500">Alphabetical by display name</p>
        </div>
        {canManageCustomers ? (
          <Link
            href={`/b/${businessId}/customers/new`}
            className="inline-flex w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add customer
          </Link>
        ) : null}
      </div>
      {customers.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No customers yet.</p>
      ) : (
        <ul className="space-y-2">
          {customers.map((c) => (
            <li key={c.id}>
              <Link
                href={`/b/${businessId}/customers/${c.id}`}
                className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <span className="font-medium">{c.displayName}</span>
                {c.notes ? (
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{c.notes}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
