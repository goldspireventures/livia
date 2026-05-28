import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock } from "lucide-react";
import { pendingReasonLabel } from "@/lib/booking-pending";

type TimelineEntry = { id: string; type: string; label: string; at: string };

type MediaRow = { id: string; url: string; mimeType?: string | null; kind: string };

export function BookingContinuityPanel({
  businessId,
  bookingId,
  pendingReason,
  continuityConversationId,
}: {
  businessId: string;
  bookingId: string;
  pendingReason?: string | null;
  continuityConversationId?: string | null;
}) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);

  useEffect(() => {
    if (!businessId || !bookingId) return;
    apiFetch<{ timeline: TimelineEntry[] }>(
      `/businesses/${businessId}/bookings/${bookingId}/timeline`,
    )
      .then((d) => setTimeline(d.timeline ?? []))
      .catch(() => setTimeline([]));
    apiFetch<{ media: MediaRow[] }>(`/businesses/${businessId}/bookings/${bookingId}/media`)
      .then((d) => setMedia(d.media ?? []))
      .catch(() => setMedia([]));
  }, [businessId, bookingId]);

  const show =
    pendingReason === "awaiting_continuity" ||
    continuityConversationId ||
    timeline.some((t) => t.type === "BOOKING_CONTINUITY_SENT");

  if (!show) return null;

  return (
    <Card className="border-primary/20" data-testid="booking-continuity-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Booking continuity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {pendingReason ? (
          <p className="text-muted-foreground">{pendingReasonLabel(pendingReason)}</p>
        ) : null}
        {continuityConversationId ? (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/inbox?conversation=${continuityConversationId}`}>
              Open thread
            </Link>
          </Button>
        ) : null}
        {media.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {media.map((m) => (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="block h-16 w-16 rounded-md overflow-hidden border bg-muted"
              >
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        ) : null}
        {timeline.length > 0 ? (
          <ul className="space-y-2 border-t pt-3">
            {timeline.map((e) => (
              <li key={e.id} className="flex items-start gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <span className="text-foreground">{e.label}</span>
                  {" · "}
                  {new Date(e.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
