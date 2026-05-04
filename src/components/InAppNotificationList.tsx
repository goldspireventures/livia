import Link from "next/link";

import type { InAppNotification } from "@prisma/client";

type MarkRead = (formData: FormData) => Promise<void>;

type Props = {
  items: InAppNotification[];
  markReadAction: MarkRead;
  /** Sent as hidden `businessId` on every row (tenant inbox). */
  businessId?: string;
  /** Extra hidden fields for each row (e.g. devUserId). */
  extraHidden?: Record<string, string>;
};

export function InAppNotificationList({ items, markReadAction, businessId, extraHidden }: Props) {
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No notifications yet.</p>;
  }

  return (
    <ul className="mt-3 space-y-2">
      {items.map((n) => (
        <li
          key={n.id}
          className={`rounded-lg border px-3 py-2 text-sm dark:border-zinc-800 ${
            n.readAt ? "border-zinc-100 bg-zinc-50 dark:bg-zinc-950/50" : "border-zinc-200 bg-white dark:bg-zinc-900"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-medium">{n.title}</div>
              <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">{n.body}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                <span>{n.createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC</span>
                {n.href ? (
                  <Link href={n.href} className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300">
                    Open
                  </Link>
                ) : null}
              </div>
            </div>
            {!n.readAt ? (
              <form action={markReadAction} className="shrink-0">
                <input type="hidden" name="notificationId" value={n.id} />
                {businessId ? <input type="hidden" name="businessId" value={businessId} /> : null}
                {extraHidden
                  ? Object.entries(extraHidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
                  : null}
                <button type="submit" className="text-xs font-medium text-zinc-700 underline dark:text-zinc-300">
                  Mark read
                </button>
              </form>
            ) : (
              <span className="shrink-0 text-xs text-zinc-400">Read</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
