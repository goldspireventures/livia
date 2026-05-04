import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppError } from "@/lib/errors";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";
import { getServiceById } from "@/services/catalog/serviceCatalogService";

import { updateServiceAction } from "../../actions";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ businessId: string; serviceId: string }>;
}) {
  const { businessId, serviceId } = await params;

  const userId = await requireOwnerUserId();
  const role = await getMembershipRoleForUser({ userId, businessId });
  if (role !== "OWNER" && role !== "ADMIN") {
    redirect(`/b/${businessId}/services`);
  }

  let service;
  try {
    service = await getServiceById({ businessId, serviceId });
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") {
      notFound();
    }
    throw e;
  }

  const priceMajor =
    service.basePriceMinorUnits != null ? (service.basePriceMinorUnits / 100).toFixed(2) : "";

  return (
    <main className="min-h-0 flex-1">
      <Link
        href={`/b/${businessId}/services`}
        className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← Services
      </Link>
      <h2 className="mt-4 text-base font-semibold">Edit service</h2>
      <form action={updateServiceAction} className="mt-6 max-w-md space-y-4">
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="serviceId" value={serviceId} />
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Name</span>
          <input
            required
            name="name"
            defaultValue={service.name}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Duration (minutes)</span>
          <input
            required
            type="number"
            min={1}
            name="durationMinutes"
            defaultValue={service.durationMinutes}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Description</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={service.description ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Category</span>
          <input
            name="category"
            defaultValue={service.category ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Price</span>
            <input
              name="price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={priceMajor}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Currency</span>
            <input
              name="currency"
              defaultValue={service.currency ?? "USD"}
              maxLength={3}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm uppercase dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Image URL</span>
          <input
            name="imageUrl"
            type="url"
            defaultValue={service.imageUrl ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Sort order</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={service.sortOrder}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={service.active} className="rounded border-zinc-300" />
          <span>Active (listed for booking)</span>
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Save service
        </button>
      </form>
    </main>
  );
}
