import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";

import { createServiceAction } from "../actions";

export default async function NewServicePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const userId = await requireOwnerUserId();
  const role = await getMembershipRoleForUser({ userId, businessId });
  if (role !== "OWNER" && role !== "ADMIN") {
    redirect(`/b/${businessId}/services`);
  }

  return (
    <main className="min-h-0 flex-1">
      <Link
        href={`/b/${businessId}/services`}
        className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← Services
      </Link>
      <h2 className="mt-4 text-base font-semibold">New service</h2>
      <form action={createServiceAction} className="mt-6 max-w-md space-y-4">
        <input type="hidden" name="businessId" value={businessId} />
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Name</span>
          <input
            required
            name="name"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="Standard cut"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Duration (minutes)</span>
          <input
            required
            type="number"
            min={1}
            name="durationMinutes"
            defaultValue={30}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Description</span>
          <textarea
            name="description"
            rows={2}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Category</span>
          <input
            name="category"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Price (optional)</span>
            <input
              name="price"
              type="number"
              min={0}
              step="0.01"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              placeholder="0.00"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Currency</span>
            <input
              name="currency"
              defaultValue="USD"
              maxLength={3}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm uppercase dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Image URL (optional)</span>
          <input
            name="imageUrl"
            type="url"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="https://…"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Sort order (optional)</span>
          <input
            name="sortOrder"
            type="number"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="0"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create service
        </button>
      </form>
    </main>
  );
}
