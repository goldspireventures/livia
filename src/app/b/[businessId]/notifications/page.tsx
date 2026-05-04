import Link from "next/link";
import { notFound } from "next/navigation";

import { InAppNotificationList } from "@/components/InAppNotificationList";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { getBusinessById } from "@/services/business/businessService";
import { assertUserCanAccessBusiness } from "@/services/business/membershipService";
import { listInAppNotificationsForUserInBusiness } from "@/services/notifications/inAppNotificationService";
import { listNotificationLogsForBusiness } from "@/services/notifications/notificationLogService";

import { markInAppNotificationReadInBusinessAction } from "./actions";

export default async function BusinessNotificationsPage({
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

  const business = await getBusinessById({ businessId });
  if (!business) notFound();

  const [items, outboundLogs] = await Promise.all([
    listInAppNotificationsForUserInBusiness({ userId, businessId, limit: 50 }),
    listNotificationLogsForBusiness({ businessId, limit: 40 }),
  ]);

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
      <h2 className="mt-4 text-lg font-semibold">Notifications · {business.name}</h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Alerts for this business (bookings, assignments, payments). Unread first.
      </p>

      <InAppNotificationList
        items={items}
        markReadAction={markInAppNotificationReadInBusinessAction}
        businessId={businessId}
      />

      <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Outbound log</h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Recent email and web push attempts (audit). SKIPPED usually means the channel is not configured or the user has
          no push subscription.
        </p>
        {outboundLogs.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No outbound attempts logged yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {outboundLogs.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{row.templateKey}</span>
                  <span
                    className={
                      row.status === "SENT"
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                        : row.status === "FAILED"
                          ? "rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-900 dark:bg-red-900/40 dark:text-red-100"
                          : "rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    }
                  >
                    {row.status}
                  </span>
                </div>
                <div className="mt-1 text-zinc-500">
                  {row.channel}
                  {row.target ? ` · ${row.target}` : ""} · {row.createdAt.toISOString().replace("T", " ").slice(0, 16)}{" "}
                  UTC
                </div>
                {row.lastError ? (
                  <p className="mt-2 break-words font-mono text-[11px] text-red-700 dark:text-red-300">{row.lastError}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
