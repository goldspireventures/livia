import Link from "next/link";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { getUserBusinesses } from "@/services/business/membershipService";

import { CreateBusinessForm } from "./CreateBusinessForm";

export default async function BusinessPickerPage() {
  const userId = await requireOwnerUserId();
  const rows = await getUserBusinesses({ userId });

  return (
    <main className="mx-auto max-w-lg flex-1 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="text-xl font-semibold">Your businesses</h1>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Dashboard
        </Link>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Choose a business to open the owner workspace, or create a new one below.
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          You are not a member of any business yet. Create your first business here (no API or seed required).
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map(({ business, role }) => (
            <li key={business.id}>
              <Link
                href={`/b/${business.id}/bookings`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <span className="font-medium">{business.name}</span>
                <span className="text-xs text-zinc-500">{role}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add another business</h2>
          <CreateBusinessForm id="create-business" />
        </div>
      ) : (
        <CreateBusinessForm />
      )}
    </main>
  );
}
