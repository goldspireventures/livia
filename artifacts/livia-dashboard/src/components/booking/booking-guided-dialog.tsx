import { BookingWizard } from "@/components/booking/booking-wizard";
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

export function BookingGuidedDialog({ open, onOpenChange, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guided booking</DialogTitle>
          <DialogDescription>
            Full flow with team, notes, and review — stays on this page.
          </DialogDescription>
        </DialogHeader>
        <BookingWizard
          mode="dialog"
          quick={false}
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
