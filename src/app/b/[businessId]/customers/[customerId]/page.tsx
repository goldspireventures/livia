import Link from "next/link";
import { notFound } from "next/navigation";

import { AppError } from "@/lib/errors";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";
import { getCustomerById } from "@/services/customer/customerService";
import { listChannelIdentitiesForCustomer } from "@/services/customer/channelIdentityService";

import { CustomerEditForm } from "../CustomerEditForm";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ businessId: string; customerId: string }>;
}) {
  const { businessId, customerId } = await params;

  let customer;
  try {
    customer = await getCustomerById({ businessId, customerId });
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") {
      notFound();
    }
    throw e;
  }

  const channels = await listChannelIdentitiesForCustomer({ businessId, customerId });

  const userId = await requireOwnerUserId();
  const role = await getMembershipRoleForUser({ userId, businessId });
  const canManageCustomers = role === "OWNER" || role === "ADMIN";

  return (
    <main className="min-h-0 flex-1">
      <Link
        href={`/b/${businessId}/customers`}
        className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← Customers
      </Link>
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">{customer.displayName}</h2>
        {customer.notes ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{customer.notes}</p>
          </div>
        ) : null}
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Channel identities</p>
          {channels.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">None on file.</p>
          ) : (
            <ul className="mt-2 divide-y divide-zinc-100 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {channels.map((ch) => (
                <li key={ch.id} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-zinc-500">{ch.channel}</span>
                  <span className="break-all">{ch.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {canManageCustomers ? (
        <CustomerEditForm
          businessId={businessId}
          customerId={customerId}
          displayName={customer.displayName}
          notes={customer.notes}
        />
      ) : null}
    </main>
  );
}
