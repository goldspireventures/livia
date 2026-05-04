import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppError } from "@/lib/errors";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";
import { getStaffById } from "@/services/staff/staffService";

import { updateStaffAction } from "../../actions";

export default async function EditStaffPage({
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
          href={`/b/${businessId}/staff/${staffId}/availability`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Schedule
        </Link>
        <Link
          href={`/b/${businessId}/staff/${staffId}/services`}
          className="font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
        >
          Services offered →
        </Link>
      </div>
      <h2 className="mt-4 text-base font-semibold">Edit staff</h2>
      <form action={updateStaffAction} className="mt-6 max-w-md space-y-4">
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="staffId" value={staffId} />
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">First name</span>
          <input
            required
            name="firstName"
            defaultValue={staff.firstName}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Last name</span>
          <input
            name="lastName"
            defaultValue={staff.lastName ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Display name</span>
          <input
            name="displayName"
            defaultValue={staff.displayName}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Role</span>
          <select
            name="role"
            defaultValue={staff.role}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="PROVIDER">Provider</option>
            <option value="COORDINATOR">Coordinator</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</span>
          <input
            name="email"
            type="email"
            defaultValue={staff.email ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</span>
          <input
            name="phone"
            defaultValue={staff.phone ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Photo URL</span>
          <input
            name="photoUrl"
            type="url"
            defaultValue={staff.photoUrl ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Bio</span>
          <textarea
            name="bio"
            rows={2}
            defaultValue={staff.bio ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={staff.active} className="rounded border-zinc-300" />
          <span>Active</span>
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Save staff
        </button>
      </form>
    </main>
  );
}
