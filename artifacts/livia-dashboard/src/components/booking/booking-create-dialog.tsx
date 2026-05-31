import { Link } from "wouter";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (bookingId: string) => void;
};

export function BookingCreateDialog({ open, onOpenChange, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <DialogTitle>Quick add</DialogTitle>
            <DialogDescription>
              Front-desk speed — client, service, and time only. For notes and every step, use guided
              booking.
            </DialogDescription>
          </div>
          <Link href="/bookings/new">
            <Button type="button" variant="outline" size="sm" className="shrink-0">
              Guided booking
            </Button>
          </Link>
        </DialogHeader>
        <BookingWizard
          mode="dialog"
          quick
          onCreated={(id) => {
            onCreated?.(id);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
