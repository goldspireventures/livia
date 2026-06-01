import { useState } from "react";
import { CalendarClock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingRescheduleDialog } from "@/components/booking/booking-reschedule-dialog";
import { PENDING_BOOKING_ACTION_LABELS } from "@workspace/policy";

export type PendingBookingActionBooking = {
  id: string;
  startAt: string;
  serviceId: string;
  staffId?: string | null;
  service: { name: string };
  customer: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
};

function customerName(c: PendingBookingActionBooking["customer"]): string {
  return (
    c.displayName?.trim() ||
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    "Guest"
  );
}

type Props = {
  booking: PendingBookingActionBooking;
  disabled?: boolean;
  layout?: "beauty" | "compact";
  onConfirm: (id: string) => void;
  onDecline: (id: string) => void;
};

/** Confirm · Reschedule (slot picker) · Decline — wired to real APIs. */
export function PendingBookingActions({
  booking,
  disabled,
  layout = "beauty",
  onConfirm,
  onDecline,
}: Props) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const name = customerName(booking.customer);

  if (layout === "compact") {
    return (
      <>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            aria-label={PENDING_BOOKING_ACTION_LABELS.decline}
            disabled={disabled}
            onClick={() => setDeclineOpen(true)}
            className="w-8 h-8 rounded-md bg-muted hover:bg-destructive/15 hover:text-destructive flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={PENDING_BOOKING_ACTION_LABELS.reschedule}
            disabled={disabled}
            onClick={() => setRescheduleOpen(true)}
            className="w-8 h-8 rounded-md bg-muted hover:bg-primary/15 hover:text-primary flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <CalendarClock className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={PENDING_BOOKING_ACTION_LABELS.confirm}
            disabled={disabled}
            onClick={() => onConfirm(booking.id)}
            className="w-8 h-8 rounded-md bg-primary/15 text-primary hover:bg-primary/25 flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
        <BookingRescheduleDialog
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          bookingId={booking.id}
          serviceId={booking.serviceId}
          staffId={booking.staffId}
          customerLabel={name}
          serviceName={booking.service.name}
          currentStartAt={booking.startAt}
        />
        <DeclineConfirmDialog
          open={declineOpen}
          onOpenChange={setDeclineOpen}
          customerLabel={name}
          onConfirm={() => onDecline(booking.id)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          type="button"
          className="flex-1 min-w-[7rem] min-h-[44px] rounded-xl"
          disabled={disabled}
          onClick={() => onConfirm(booking.id)}
          data-testid="beauty-confirm-pending"
        >
          {PENDING_BOOKING_ACTION_LABELS.confirm}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 min-w-[7rem] min-h-[44px] rounded-xl"
          disabled={disabled}
          onClick={() => setRescheduleOpen(true)}
          data-testid="beauty-reschedule-pending"
        >
          {PENDING_BOOKING_ACTION_LABELS.reschedule}
        </Button>
        <Button
          type="button"
          variant="ghost"
          data-skin="off"
          className="min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={disabled}
          onClick={() => setDeclineOpen(true)}
          data-testid="beauty-decline-pending"
        >
          {PENDING_BOOKING_ACTION_LABELS.decline}
        </Button>
      </div>
      <BookingRescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        bookingId={booking.id}
        serviceId={booking.serviceId}
        staffId={booking.staffId}
        customerLabel={name}
        serviceName={booking.service.name}
        currentStartAt={booking.startAt}
      />
      <DeclineConfirmDialog
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        customerLabel={name}
        onConfirm={() => onDecline(booking.id)}
      />
    </>
  );
}

function DeclineConfirmDialog({
  open,
  onOpenChange,
  customerLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline this request?</DialogTitle>
          <DialogDescription>
            {customerLabel}&apos;s appointment will be cancelled and the slot freed. They would need
            to book again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep pending
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Decline booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
