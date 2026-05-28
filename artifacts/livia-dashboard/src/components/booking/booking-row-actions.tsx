import { Clock } from "lucide-react";
import { RunningLateSheet } from "@/components/ops/running-late-sheet";
import { Button } from "@/components/ui/button";

type Props = {
  bookingId: string;
  status: string;
  customerFirstName?: string | null;
  customerLastName?: string | null;
};

export function BookingRowActions({ bookingId, status, customerFirstName, customerLastName }: Props) {
  if (status !== "CONFIRMED") return null;

  const name = [customerFirstName, customerLastName].filter(Boolean).join(" ").trim();

  return (
    <div
      className="shrink-0"
      onClick={(e) => e.preventDefault()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <RunningLateSheet
        bookingId={bookingId}
        customerName={name || undefined}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Running late"
            data-testid={`row-running-late-${bookingId}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Clock className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  );
}
