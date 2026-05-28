import { useMemo } from "react";
import { Link } from "wouter";
import { useGetActivityFeed } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { History } from "lucide-react";

type FeedEvent = {
  id: string;
  type: string;
  entityType?: string | null;
  entityId?: string | null;
  context?: Record<string, unknown> | null;
  createdAt: string;
};

const EVENT_LABELS: Record<string, string> = {
  BOOKING_CREATED: "Booking created",
  BOOKING_CONFIRMED: "Booking confirmed",
  BOOKING_CANCELLED: "Booking cancelled",
  BOOKING_COMPLETED: "Booking completed",
  BOOKING_NO_SHOW: "Marked no-show",
  CUSTOMER_CREATED: "Client added",
  CUSTOMER_UPDATED: "Client updated",
  MESSAGE_RECEIVED: "Message received",
  MESSAGE_SENT: "Message sent",
  NOTIFICATION_SENT: "Notification sent",
};

function labelFor(type: string): string {
  return EVENT_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase();
}

export function CustomerTimeline({
  businessId,
  customerId,
}: {
  businessId: string;
  customerId: string;
}) {
  const { data, isLoading } = useGetActivityFeed(businessId, { limit: 40 }, {
    query: { enabled: !!businessId },
  } as never);

  const events = useMemo(() => {
    const rows = (data ?? []) as FeedEvent[];
    return rows.filter((e) => {
      if (e.entityType === "customer" && e.entityId === customerId) return true;
      const ctx = e.context as { customerId?: string } | null | undefined;
      if (ctx?.customerId === customerId) return true;
      if (
        e.entityType === "booking" &&
        typeof e.context === "object" &&
        e.context &&
        (e.context as { customerId?: string }).customerId === customerId
      ) {
        return true;
      }
      return false;
    });
  }, [data, customerId]);

  return (
    <Card data-testid="customer-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity events yet for this client.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="flex flex-col gap-0.5 text-sm border-l-2 border-primary/30 pl-3">
                <span className="font-medium">{labelFor(e.type)}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</span>
                {e.entityType === "booking" && e.entityId ? (
                  <Link href={`/bookings/${e.entityId}`} className="text-xs text-primary hover:underline">
                    View booking
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
