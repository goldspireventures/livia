import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, ExternalLink, User } from "lucide-react";
import { OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";

type LinkedBooking = {
  id: string;
  status: string;
  startAt: string;
  service?: { name: string } | null;
  customer?: { id?: string; displayName: string | null; createdAt?: string } | null;
};

export function InboxContextRail({
  businessId,
  conversation,
}: {
  businessId: string;
  conversation: {
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    linkedBookingId?: string | null;
    createdAt: string;
    bookingCount: number;
  } | null;
}) {
  const bookingId = conversation?.linkedBookingId;

  const { data: booking, isLoading } = useQuery({
    queryKey: ["inbox-context-booking", businessId, bookingId],
    queryFn: () =>
      customFetch<LinkedBooking>(`/api/businesses/${businessId}/bookings/${bookingId}`),
    enabled: !!businessId && !!bookingId,
    refetchInterval: OPERATIONAL_REFETCH_MS,
  });

  if (!conversation) {
    return (
      <aside className="hidden lg:flex flex-col bg-card/30 p-4 min-h-0" data-testid="inbox-context-rail">
        <p className="text-sm text-muted-foreground">Select a thread for customer context.</p>
      </aside>
    );
  }

  const customerSince = new Date(conversation.createdAt).toLocaleDateString([], {
    month: "short",
    year: "numeric",
  });

  return (
    <aside className="hidden lg:flex flex-col bg-card/30 overflow-hidden min-h-0" data-testid="inbox-context-rail">
      <div className="px-4 py-3 border-b border-border/60">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Context</h2>
      </div>
      <div className="p-4 space-y-5 flex-1">
        <div>
          <p className="text-sm font-semibold truncate">{conversation.customerName ?? "Guest"}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {conversation.customerEmail ?? conversation.customerPhone ?? "No contact on file"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Thread since {customerSince}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Next booking</p>
          {bookingId && isLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : booking ? (
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
                {booking.service?.name ?? "Appointment"}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(booking.startAt).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-xs text-muted-foreground">{booking.status}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No linked booking on this thread.</p>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Quick links</p>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
            <Link href="/customers">
              <User className="h-3.5 w-3.5" />
              Customer directory
            </Link>
          </Button>
          {bookingId ? (
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
              <Link href={`/bookings/${bookingId}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                Open booking
              </Link>
            </Button>
          ) : null}
        </div>

        {conversation.bookingCount > 0 ? (
          <p className="text-xs text-muted-foreground font-mono">
            {conversation.bookingCount} booking{conversation.bookingCount === 1 ? "" : "s"} on thread
          </p>
        ) : null}
      </div>
    </aside>
  );
}
