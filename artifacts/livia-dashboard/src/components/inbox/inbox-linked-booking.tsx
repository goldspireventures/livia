import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck } from "lucide-react";
import { Link } from "wouter";
import { OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";

type LinkedBooking = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  service?: { name: string } | null;
  customer?: { displayName: string | null } | null;
};

export function InboxLinkedBooking({
  businessId,
  bookingId,
}: {
  businessId: string;
  bookingId: string;
}) {
  const { data } = useQuery({
    queryKey: ["inbox-linked-booking", businessId, bookingId],
    queryFn: () =>
      customFetch<LinkedBooking>(`/api/businesses/${businessId}/bookings/${bookingId}`),
    enabled: !!businessId && !!bookingId,
    refetchInterval: OPERATIONAL_REFETCH_MS,
  });

  if (!data) return null;

  const when = new Date(data.startAt).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="mx-4 mb-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 flex items-center justify-between gap-3 text-sm"
      data-testid="inbox-linked-booking"
    >
      <div className="flex items-center gap-2 min-w-0">
        <CalendarCheck className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="font-medium truncate">{data.service?.name ?? "Appointment"}</div>
          <div className="text-xs text-muted-foreground truncate">
            {when} · {data.customer?.displayName ?? "Customer"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={data.status === "CANCELLED" ? "secondary" : "default"}>{data.status}</Badge>
        <Link href={`/bookings/${data.id}`} className="text-xs text-primary hover:underline">
          View
        </Link>
      </div>
    </div>
  );
}
