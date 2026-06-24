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

  const studioPending =
    (summary as { studioPendingCount?: number } | undefined)?.studioPendingCount ??
    summary?.pendingCount ??
    0;
  const inboxAttention =
    (summary as { inboxAttentionCount?: number } | undefined)?.inboxAttentionCount ??
    ((summary as { needsYouCount?: number } | undefined)?.needsYouCount ?? 0) +
      ((summary as { handedOffCount?: number } | undefined)?.handedOffCount ?? 0);

  if (!bid || (studioPending === 0 && inboxAttention === 0)) return null;

  return (
    <div
      className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5"
      data-testid="notification-alert-strip"
      role="status"
    >
      <div className="flex items-center gap-2 text-sm min-w-0">
        <Bell className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-muted-foreground">
          {studioPending > 0 && inboxAttention > 0 ? (
            <>
              <strong className="text-foreground">{studioPending}</strong> to confirm ·{" "}
              <strong className="text-foreground">{inboxAttention}</strong> inbox thread
              {inboxAttention === 1 ? "" : "s"}
            </>
          ) : studioPending > 0 ? (
            <>
              <strong className="text-foreground">{studioPending}</strong> booking
              {studioPending === 1 ? "" : "s"} need your confirmation
            </>
          ) : (
            <>
              <strong className="text-foreground">{inboxAttention}</strong> conversation
              {inboxAttention === 1 ? "" : "s"} waiting for your team
            </>
          )}
        </span>
      </div>
      <div className="flex gap-2 sm:ml-auto shrink-0">
        {studioPending > 0 ? (
          <Button size="sm" variant="secondary" asChild>
            <Link href="/bookings?status=PENDING&lens=needs_you">
              <CalendarClock className="h-3.5 w-3.5 mr-1" />
              Pending
            </Link>
          </Button>
        ) : null}
        {inboxAttention > 0 ? (
          <Button size="sm" variant="secondary" asChild>
            <Link href="/inbox?lens=needs_you">
              <Inbox className="h-3.5 w-3.5 mr-1" />
              Inbox
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
