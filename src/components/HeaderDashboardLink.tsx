import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { ensureUserForClerk } from "@/services/auth/clerkUserService";
import { countUnreadInAppNotifications } from "@/services/notifications/inAppNotificationService";

function clerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0,
  );
}

export async function HeaderDashboardLink() {
  if (!clerkConfigured()) {
    return (
      <Link
        href="/dashboard"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        Dashboard
      </Link>
    );
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return (
      <Link
        href="/dashboard"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        Dashboard
      </Link>
    );
  }

  const userId = await ensureUserForClerk({ clerkUserId: clerkId });
  const unread = await countUnreadInAppNotifications(userId);

  return (
    <Link
      href="/dashboard#inbox"
      className="inline-flex items-center gap-2 text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
    >
      <span>Dashboard</span>
      {unread > 0 ? (
        <span
          className="min-w-[1.25rem] rounded-full bg-zinc-900 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white dark:bg-zinc-100 dark:text-zinc-900"
          aria-label={`${unread} unread notifications`}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
