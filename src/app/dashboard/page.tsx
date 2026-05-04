import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InAppNotificationList } from "@/components/InAppNotificationList";
import { WebPushRegister } from "@/components/WebPushRegister";
import { ensureUserForClerk } from "@/services/auth/clerkUserService";
import { listUpcomingBookingsForUser } from "@/services/booking/bookingService";
import { listInAppNotificationsForUser } from "@/services/notifications/inAppNotificationService";

import { markInAppNotificationReadAction } from "./actions";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  const userId = await ensureUserForClerk({ clerkUserId: clerkId });

  const [bookings, notifications] = await Promise.all([
    listUpcomingBookingsForUser({ userId, limit: 30 }),
    listInAppNotificationsForUser({ userId, limit: 40 }),
  ]);
  const vapidPublic =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || process.env.VAPID_PUBLIC_KEY?.trim() || null;

  return (
    <main className="mx-auto max-w-2xl flex-1 p-6">
      <section id="inbox" className="mb-10 scroll-mt-20">
        <h2 className="text-base font-semibold">Notifications</h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          New public bookings appear here for businesses you own or administer. Push is optional; this inbox always updates.
        </p>
        <InAppNotificationList
          items={notifications}
          markReadAction={markInAppNotificationReadAction}
        />
      </section>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Upcoming bookings</h1>
        <Link
          href="/b"
          className="text-sm font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
        >
          Business workspace →
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No upcoming bookings.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="font-medium">{b.business.name}</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                {b.service.name} · {b.customer.displayName}
                {b.staff ? ` · ${b.staff.displayName}` : ""}
              </div>
              <div className="mt-1 text-zinc-500 dark:text-zinc-500">
                {b.startsAt.toISOString().replace("T", " ").slice(0, 16)} UTC
              </div>
              <Link
                href={`/book/${b.business.slug}`}
                className="mt-2 inline-block text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
              >
                Public book page
              </Link>
            </li>
          ))}
        </ul>
      )}

      <WebPushRegister vapidPublicKey={vapidPublic} />
    </main>
  );
}
