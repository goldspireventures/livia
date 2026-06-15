import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";

/** Mobile-first sticky CTA — keeps price + confirm visible while scrolling long forms. */
export function PublicBookingStickySummary({
  serviceName,
  startAt,
  priceMinor,
  currency,
  depositDueMinor = 0,
  ctaLabel,
  onCta,
  disabled,
  pending,
}: {
  serviceName: string;
  startAt: string;
  priceMinor: number;
  currency: string;
  depositDueMinor?: number;
  ctaLabel: string;
  onCta: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <div
      className="public-booking-sticky-bar md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      data-testid="public-booking-sticky-summary"
    >
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{serviceName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(startAt)} · {formatTime(startAt)} ·{" "}
            <span className="text-primary font-semibold">
              {depositDueMinor > 0
                ? `${formatCurrency(depositDueMinor, currency)} deposit`
                : formatCurrency(priceMinor, currency)}
            </span>
          </p>
        </div>
        <Button
          className="shrink-0 min-h-[44px]"
          disabled={disabled || pending}
          onClick={onCta}
          data-testid="button-sticky-continue"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" aria-hidden />
              Booking…
            </>
          ) : (
            ctaLabel
          )}
        </Button>
      </div>
    </div>
  );
}
