import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";

import { createCustomerAction } from "../actions";

export default async function NewCustomerPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const userId = await requireOwnerUserId();
  const role = await getMembershipRoleForUser({ userId, businessId });
  if (role !== "OWNER" && role !== "ADMIN") {
    redirect(`/b/${businessId}/customers`);
  }

  return (
    <main className="min-h-0 flex-1">
      <Link
        href={`/b/${businessId}/customers`}
        className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← Customers
      </Link>
      <h2 className="mt-4 text-base font-semibold">New customer</h2>
      <form action={createCustomerAction} className="mt-6 max-w-md space-y-4">
        <input type="hidden" name="businessId" value={businessId} />
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Display name</span>
          <input
            required
            name="displayName"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="Jane Doe"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes (optional)</span>
          <textarea
            name="notes"
            rows={3}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="Preferences, allergies, etc."
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create customer
        </button>
      </form>
    </main>
  );
}
