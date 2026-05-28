import { Badge } from "@/components/ui/badge";
import { bookingSourceIcon, bookingSourceLabel } from "@/lib/booking-source-labels";
import { cn } from "@/lib/utils";

export function BookingSourceBadge({
  source,
  className,
}: {
  source?: string | null;
  className?: string;
}) {
  const Icon = bookingSourceIcon(source);
  const label = bookingSourceLabel(source);

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-normal text-xs", className)}
      data-testid="booking-source-badge"
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </Badge>
  );
}
