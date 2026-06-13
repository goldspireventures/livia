import { Link } from "wouter";
import { refundLinkedInboxBannerBody } from "@workspace/policy";
import { AlertTriangle, Inbox, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolutionSummary } from "@/lib/conversation-resolution";

export type LinkedInboxCaseDto = {
  conversationId: string;
  status: string;
  caseIntent?: string | null;
  summary?: string | null;
  resolution?: {
    outcome?: string;
    refundMinor?: number | null;
    at?: string;
  } | null;
};

function isRefundCase(c: LinkedInboxCaseDto): boolean {
  return (
    c.caseIntent === "refund_request" ||
    (c.summary?.toLowerCase().includes("refund") ?? false)
  );
}

type Props = {
  bookingStatus: string;
  linkedCase: LinkedInboxCaseDto | null | undefined;
  onCancelBooking?: () => void;
  cancelPending?: boolean;
};

export function BookingLinkedInboxBanner({
  bookingStatus,
  linkedCase,
  onCancelBooking,
  cancelPending,
}: Props) {
  if (!linkedCase || !isRefundCase(linkedCase)) return null;

  const status = bookingStatus;
  const outcome = linkedCase.resolution?.outcome;
  const closed = linkedCase.status === "CLOSED";
  const open = linkedCase.status === "OPEN" || linkedCase.status === "HANDED_OFF";
  const active =
    status !== "CANCELLED" && status !== "COMPLETED" && status !== "NO_SHOW";
  const resolvedLabel = resolutionSummary(linkedCase.resolution);

  if (open && active) {
    return (
      <div
        className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 space-y-2"
        data-testid="booking-inbox-case-open"
      >
        <p className="text-sm font-medium flex items-center gap-2">
          <Inbox className="h-4 w-4 shrink-0" />
          Refund request open in inbox
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {linkedCase.summary ?? refundLinkedInboxBannerBody()}
        </p>
        <Button size="sm" variant="default" asChild>
          <Link href={`/inbox?conversation=${linkedCase.conversationId}`}>
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Resolve in inbox
          </Link>
        </Button>
      </div>
    );
  }

  if (
    closed &&
    active &&
    (outcome === "cancel_no_refund" ||
      outcome === "refund_and_cancel" ||
      outcome === "close_no_action")
  ) {
    const shouldBeCancelled =
      outcome === "cancel_no_refund" || outcome === "refund_and_cancel";
    const mismatch = shouldBeCancelled && status !== "CANCELLED";

    if (outcome === "close_no_action" && status !== "CANCELLED") {
      return (
        <div
          className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2"
          data-testid="booking-inbox-case-kept"
        >
          <p className="text-sm font-medium">Refund declined — appointment kept</p>
          <p className="text-xs text-muted-foreground">
            You closed the case without a refund. The slot is still on the calendar unless you cancel it.
          </p>
        </div>
      );
    }

    if (mismatch) {
      return (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 space-y-2"
          data-testid="booking-inbox-case-mismatch"
        >
          <p className="text-sm font-medium flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Inbox says cancelled — booking still {status.toLowerCase()}
          </p>
          <p className="text-xs text-muted-foreground">
            {resolvedLabel}. Finish by cancelling the appointment so the calendar matches what you told the customer.
          </p>
          {onCancelBooking ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={cancelPending}
              data-testid="booking-sync-cancel-from-inbox"
              onClick={onCancelBooking}
            >
              Cancel appointment now
            </Button>
          ) : null}
        </div>
      );
    }

    if (status === "CANCELLED" && resolvedLabel) {
      return (
        <div
          className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3"
          data-testid="booking-inbox-case-closed"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Inbox resolved:</span> {resolvedLabel}
          </p>
        </div>
      );
    }
  }

  return null;
}
