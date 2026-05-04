import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { getBusinessById } from "@/services/business/businessService";
import { assertUserCanAccessBusiness, getMembershipRoleForUser } from "@/services/business/membershipService";
import { listMessageLogsForBusiness } from "@/services/messaging/messageLogService";

export default async function BusinessMessagingPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const userId = await requireOwnerUserId();

  try {
    await assertUserCanAccessBusiness({
      userId,
      businessId,
      options: { emitAccessChecked: false },
    });
  } catch {
    notFound();
  }

  const role = await getMembershipRoleForUser({ userId, businessId });
  if (role !== "OWNER" && role !== "ADMIN") {
    redirect(`/b/${businessId}/bookings`);
  }

  const business = await getBusinessById({ businessId });
  if (!business) notFound();

  const logs = await listMessageLogsForBusiness({ businessId, limit: 100 });

  return (
    <main className="min-h-0 flex-1">
      <div className="text-sm">
        <Link
          href={`/b/${businessId}/bookings`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          ← Bookings
        </Link>
      </div>
      <h2 className="mt-4 text-lg font-semibold">Message log · {business.name}</h2>
      <p className="mt-1 max-w-xl text-xs text-zinc-600 dark:text-zinc-400">
        T6 audit trail for inbound webhooks. Rows link to a customer when <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">ChannelIdentity</code> matches{" "}
        <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">channel</code> + <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">fromValue</code>. Configure{" "}
        <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">MESSAGING_INBOUND_SECRET</code> and POST to{" "}
        <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">/api/webhooks/messaging</code>.
      </p>

      {logs.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">No messages logged yet.</p>
      ) : (
        <ul className="mt-6 space-y-2 text-sm">
          {logs.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-xs text-zinc-500">{row.createdAt.toISOString().slice(0, 19)}Z</span>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{row.status}</span>
              </div>
              <div className="mt-1">
                <span className="text-xs uppercase text-zinc-500">{row.channel}</span>
                <span className="mx-1 text-zinc-400">·</span>
                <span className="font-mono text-xs">{row.provider}</span>
                <span className="mx-1 text-zinc-400">·</span>
                <span className="font-mono text-xs">{row.fromValue}</span>
              </div>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">{row.bodyPreview}</p>
              {row.customerId ? (
                <Link
                  href={`/b/${businessId}/customers/${row.customerId}`}
                  className="mt-1 inline-block text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
                >
                  Linked customer →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
