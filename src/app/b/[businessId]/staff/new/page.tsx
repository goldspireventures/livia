import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";

import { createStaffAction } from "../actions";

export default async function NewStaffPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const userId = await requireOwnerUserId();
  const role = await getMembershipRoleForUser({ userId, businessId });
  if (role !== "OWNER" && role !== "ADMIN") {
    redirect(`/b/${businessId}/staff`);
  }

  return (
    <main className="min-h-0 flex-1">
      <Link
        href={`/b/${businessId}/staff`}
        className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← Staff
      </Link>
      <h2 className="mt-4 text-base font-semibold">New staff member</h2>
      <form action={createStaffAction} className="mt-6 max-w-md space-y-4">
        <input type="hidden" name="businessId" value={businessId} />
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">First name</span>
          <input
            required
            name="firstName"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Last name</span>
          <input name="lastName" className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Display name (optional)</span>
          <input name="displayName" className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Role</span>
          <select
            name="role"
            defaultValue="PROVIDER"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="PROVIDER">Provider</option>
            <option value="COORDINATOR">Coordinator</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</span>
          <input name="email" type="email" className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</span>
          <input name="phone" className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Photo URL</span>
          <input name="photoUrl" type="url" className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Bio</span>
          <textarea name="bio" rows={2} className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create staff
        </button>
      </form>
    </main>
  );
}
