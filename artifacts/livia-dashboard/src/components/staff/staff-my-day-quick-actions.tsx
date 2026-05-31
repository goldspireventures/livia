import { Link } from "wouter";
import { Clock, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RunningLateSheet } from "@/components/ops/running-late-sheet";

export function StaffMyDayQuickActions({
  bookingId,
  customerName,
  canRunLate,
}: {
  bookingId?: string | null;
  customerName?: string | null;
  canRunLate?: boolean;
}) {
  if (!bookingId) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
      data-testid="staff-my-day-actions"
    >
      <div className="max-w-xl mx-auto grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="flex flex-col gap-1 h-auto min-h-[48px] py-2 px-1 text-[11px]"
          asChild
        >
          <Link href="/inbox">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Message
          </Link>
        </Button>
        {canRunLate ? (
          <RunningLateSheet
            bookingId={bookingId}
            customerName={customerName ?? undefined}
            trigger={
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto min-h-[48px] py-2 px-1 text-[11px] w-full"
                data-testid="staff-my-day-running-late"
              >
                <Clock className="h-4 w-4" aria-hidden />
                Running late
              </Button>
            }
          />
        ) : (
          <Button
            variant="outline"
            className="flex flex-col gap-1 h-auto min-h-[48px] py-2 px-1 text-[11px]"
            disabled
          >
            <Clock className="h-4 w-4" aria-hidden />
            Running late
          </Button>
        )}
        <Button
          variant="outline"
          className="flex flex-col gap-1 h-auto min-h-[48px] py-2 px-1 text-[11px]"
          asChild
        >
          <Link href={`/bookings/${bookingId}`}>
            <FileText className="h-4 w-4" aria-hidden />
            View detail
          </Link>
        </Button>
      </div>
    </div>
  );
}
