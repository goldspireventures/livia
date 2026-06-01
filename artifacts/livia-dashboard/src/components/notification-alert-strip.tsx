import { Link } from "wouter";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { Button } from "@/components/ui/button";
import { Bell, Inbox, CalendarClock } from "lucide-react";

/**
 * Web has no native push yet — surface actionable counts at the top of the cockpit.
 * Mobile uses Expo push (see push.service + usePushNavigation).
 */
export function NotificationAlertStrip() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const { data: summary } = useGetDashboardSummary(bid, {
    query: { enabled: !!bid, refetchInterval: 60_000 } as never,
  });

  const pending = summary?.pendingCount ?? 0;
  const handed =
    (summary as { handedOffCount?: number } | undefined)?.handedOffCount ?? 0;

  if (!bid || (pending === 0 && handed === 0)) return null;

  return (
    <div
      className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5"
      data-testid="notification-alert-strip"
      role="status"
    >
      <div className="flex items-center gap-2 text-sm min-w-0">
        <Bell className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-muted-foreground">
          {pending > 0 && handed > 0 ? (
            <>
              <strong className="text-foreground">{pending}</strong> to confirm ·{" "}
              <strong className="text-foreground">{handed}</strong> inbox handoff
              {handed === 1 ? "" : "s"}
            </>
          ) : pending > 0 ? (
            <>
              <strong className="text-foreground">{pending}</strong> booking
              {pending === 1 ? "" : "s"} need your confirmation
            </>
          ) : (
            <>
              <strong className="text-foreground">{handed}</strong> conversation
              {handed === 1 ? "" : "s"} waiting for your team
            </>
          )}
        </span>
      </div>
      <div className="flex gap-2 sm:ml-auto shrink-0">
        {pending > 0 ? (
          <Button size="sm" variant="secondary" asChild>
            <Link href="/bookings?status=PENDING">
              <CalendarClock className="h-3.5 w-3.5 mr-1" />
              Pending
            </Link>
          </Button>
        ) : null}
        {handed > 0 ? (
          <Button size="sm" variant="secondary" asChild>
            <Link href="/inbox">
              <Inbox className="h-3.5 w-3.5 mr-1" />
              Inbox
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
