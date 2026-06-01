import type { ReactNode } from "react";
import { Link } from "wouter";
import { Clock, MessageSquare, CheckCircle2, User } from "lucide-react";
import { RunningLateSheet } from "@/components/ops/running-late-sheet";
import { useBusiness } from "@/lib/business-context";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { Button } from "@/components/ui/button";

type Props = {
  businessId: string;
  bookingId: string;
  status: string;
  customerName?: string;
  continuityConversationId?: string | null;
  /** Inbox thread linked to this booking (refund / dispute). */
  linkedInboxConversationId?: string | null;
};

/**
 * Status-aware actions on booking detail — confirm → running late → complete.
 */
export function BookingContextRail({
  businessId,
  bookingId,
  status,
  customerName,
  continuityConversationId,
  linkedInboxConversationId,
}: Props) {
  const { business } = useBusiness();
  const vocab = verticalPackUi(
    (business as { vertical?: string } | null)?.vertical,
    business?.category,
  );
  const items: { key: string; node: ReactNode }[] = [];

  if (status === "PENDING") {
    items.push({
      key: "confirm-hint",
      node: (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Confirm to lock the slot and notify the client.
        </p>
      ),
    });
  }

  const inboxThreadId = linkedInboxConversationId ?? continuityConversationId;

  if (status === "CONFIRMED") {
    items.push({
      key: "running-late",
      node: (
        <RunningLateSheet
          bookingId={bookingId}
          customerName={customerName}
          actionLabel={vocab.runningLateLabel}
          trigger={
            <Button variant="outline" size="sm" data-testid="booking-context-running-late">
              <Clock className="h-4 w-4 mr-2" />
              {vocab.runningLateLabel}
            </Button>
          }
        />
      ),
    });
  }

  if (inboxThreadId) {
    items.push({
      key: "thread",
      node: (
        <Link href={`/inbox?conversation=${inboxThreadId}`}>
          <Button variant="ghost" size="sm" data-testid="booking-context-inbox">
            <MessageSquare className="h-4 w-4 mr-2" />
            Open thread
          </Button>
        </Link>
      ),
    });
  }

  if (status === "COMPLETED") {
    items.push({
      key: "client",
      node: (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <User className="h-3.5 w-3.5 shrink-0" />
          After the visit, clients rate via their visit link — scores appear on Today.
        </p>
      ),
    });
  }

  if (items.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2"
      data-testid="booking-context-rail"
      data-business-id={businessId}
    >
      {items.map((i) => (
        <div key={i.key}>{i.node}</div>
      ))}
    </div>
  );
}
