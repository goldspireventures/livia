"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  businessId: string;
  businessSlug: string;
  unreadBiz: number;
};

const pill =
  "rounded-md border px-3 py-1.5 font-medium transition dark:border-zinc-600";
const inactive = `${pill} border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800`;
const active = `${pill} border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900`;

export function BusinessWorkspaceNav({ businessId, businessSlug, unreadBiz }: Props) {
  const pathname = usePathname() ?? "";
  const base = `/b/${businessId}`;

  function isActive(prefix: string): boolean {
    if (prefix === `${base}/bookings`) {
      return pathname === `${base}/bookings` || pathname.startsWith(`${base}/bookings/`);
    }
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  }

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
      <Link href={`${base}/bookings`} className={isActive(`${base}/bookings`) ? active : inactive}>
        Bookings
      </Link>
      <Link href={`${base}/messaging`} className={isActive(`${base}/messaging`) ? active : inactive}>
        Messages
      </Link>
      <Link
        href={`${base}/notifications`}
        className={`inline-flex items-center gap-1.5 ${isActive(`${base}/notifications`) ? active : inactive}`}
      >
        Alerts
        {unreadBiz > 0 ? (
          <span
            className={
              isActive(`${base}/notifications`)
                ? "min-w-[1.25rem] rounded-full bg-white px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
                : "min-w-[1.25rem] rounded-full bg-zinc-900 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white dark:bg-zinc-100 dark:text-zinc-900"
            }
          >
            {unreadBiz > 99 ? "99+" : unreadBiz}
          </span>
        ) : null}
      </Link>
      <Link href={`${base}/customers`} className={isActive(`${base}/customers`) ? active : inactive}>
        Customers
      </Link>
      <Link href={`${base}/services`} className={isActive(`${base}/services`) ? active : inactive}>
        Services
      </Link>
      <Link href={`${base}/staff`} className={isActive(`${base}/staff`) ? active : inactive}>
        Staff
      </Link>
      <Link href={`${base}/availability`} className={isActive(`${base}/availability`) ? active : inactive}>
        Schedule
      </Link>
      <Link href="/b" className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400">
        All businesses
      </Link>
      <Link
        href={`/book/${businessSlug}`}
        className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        Public book
      </Link>
    </nav>
  );
}
